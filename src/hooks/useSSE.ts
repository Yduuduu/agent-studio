import { useCallback, useEffect, useEffectEvent, useState } from "react";

export type SSEStatus = "idle" | "connecting" | "open" | "reconnecting" | "closed" | "failed";

export interface UseSSEOptions<T> {
  url: string;
  onMessage: (data: T) => void;
  onError?: (err: Event) => void;
  enabled?: boolean;
  /** Turns raw `event.data` into T; throwing drops that message. Defaults to JSON.parse. */
  parse?: (raw: string) => T;
  /** Reconnect attempts after a connection error before giving up. */
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

/** Exponential backoff: base, 2×base, 4×base … capped at maxDelayMs. */
export function getBackoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number) {
  return Math.min(baseDelayMs * 2 ** attempt, maxDelayMs);
}

const defaultParse = (raw: string) => JSON.parse(raw) as unknown;

/**
 * Subscribes to a Server-Sent Events endpoint. Reconnects with exponential
 * backoff on error (the browser's own auto-reconnect is bypassed by closing
 * the source), stops cleanly when the server sends an `end` event, and always
 * closes the EventSource on unmount or when url/enabled change.
 */
export function useSSE<T>({
  url,
  onMessage,
  onError,
  enabled = true,
  parse = defaultParse as (raw: string) => T,
  maxRetries = 5,
  baseDelayMs = 500,
  maxDelayMs = 10_000,
}: UseSSEOptions<T>) {
  // Bumped by retry() to force a fresh connection after "failed".
  const [generation, setGeneration] = useState(0);
  const connectionKey = `${url}#${generation}`;
  // Status is tagged with the connection it belongs to; a status from a
  // previous url/generation reads as "connecting" for the new one. This avoids
  // a synchronous setState at the start of the effect.
  const [state, setState] = useState<{ key: string; status: SSEStatus }>({
    key: "",
    status: "idle",
  });

  // Effect events always see the latest callbacks without being dependencies,
  // so swapping onMessage never tears down the connection.
  const handleMessage = useEffectEvent((raw: string) => {
    let data: T;
    try {
      data = parse(raw);
    } catch {
      return;
    }
    onMessage(data);
  });
  const handleError = useEffectEvent((event: Event) => onError?.(event));

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    const update = (status: SSEStatus) => setState({ key: connectionKey, status });

    const connect = () => {
      source = new EventSource(url);
      source.onopen = () => {
        attempt = 0;
        update("open");
      };
      source.onmessage = (event: MessageEvent<string>) => handleMessage(event.data);
      source.addEventListener("end", () => {
        source?.close();
        update("closed");
      });
      source.onerror = (event) => {
        source?.close();
        handleError(event);
        if (attempt >= maxRetries) {
          update("failed");
          return;
        }
        const delay = getBackoffDelay(attempt, baseDelayMs, maxDelayMs);
        attempt += 1;
        update("reconnecting");
        retryTimer = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      clearTimeout(retryTimer);
      source?.close();
    };
  }, [url, enabled, connectionKey, maxRetries, baseDelayMs, maxDelayMs]);

  const retry = useCallback(() => setGeneration((value) => value + 1), []);

  let status: SSEStatus = "idle";
  if (enabled) status = state.key === connectionKey ? state.status : "connecting";

  return { status, retry };
}
