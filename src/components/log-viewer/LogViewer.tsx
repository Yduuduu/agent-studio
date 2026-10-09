"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

import { Button } from "@/components/ui/button/Button";
import { useLogStore } from "@/store/useLogStore";
import { cn } from "@/utils/cn";

import { isNearBottom } from "./log-viewer.utils";
import { LogRow } from "./LogRow";

const ESTIMATED_ROW_HEIGHT = 26;

interface LogViewerProps {
  className?: string;
}

/**
 * Virtualized, auto-following log list. Rows have variable height and are
 * measured after render. While the user is at the bottom, new logs keep the
 * view pinned there; once they scroll up, following pauses until they return
 * (or click "Jump to latest").
 */
export function LogViewer({ className }: LogViewerProps) {
  const logs = useLogStore((state) => state.logs);
  const scrollRef = useRef<HTMLDivElement>(null);
  // A ref, not state: it changes on every scroll event and is only read when
  // new logs arrive, so it must not trigger renders.
  const followingRef = useRef(true);
  const [following, setFollowing] = useState(true);

  // React Compiler is not enabled; the virtualizer's unstable function identity is expected.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    getItemKey: (index) => logs[index]?.id ?? index,
    overscan: 12,
    // Lets the first paint (and jsdom) render rows before the element is measured.
    initialRect: { width: 0, height: 320 },
  });

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const atBottom = isNearBottom(element);
    if (atBottom !== followingRef.current) {
      followingRef.current = atBottom;
      setFollowing(atBottom);
    }
  }, []);

  const pinToBottom = useCallback(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, []);

  const jumpToLatest = useCallback(() => {
    followingRef.current = true;
    setFollowing(true);
    pinToBottom();
  }, [pinToBottom]);

  const totalSize = virtualizer.getTotalSize();

  // Pin synchronously after each commit (new rows, or rows re-measured to a
  // new total height). A direct scrollTop write rather than scrollToIndex:
  // the latter keeps reconciling over later frames and would override a user
  // who scrolls up mid-stream.
  useLayoutEffect(() => {
    if (followingRef.current) pinToBottom();
  }, [logs.length, totalSize, pinToBottom]);

  const items = virtualizer.getVirtualItems();

  return (
    <section className={cn("relative flex min-h-0 flex-col bg-white", className)}>
      <header className="flex items-center justify-between border-b border-gray-200 px-3 py-2">
        <h2 className="text-xs font-semibold text-gray-700">Run logs</h2>
        <span className="text-xs text-gray-400 tabular-nums">{logs.length} lines</span>
      </header>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="min-h-0 flex-1 overflow-y-auto"
        role="log"
        aria-live="off"
        aria-label="Run logs"
      >
        {logs.length === 0 ? (
          <p className="p-6 text-center text-xs text-gray-400">No logs yet. Run the workflow.</p>
        ) : (
          <div
            className="relative h-(--total-height) w-full"
            style={{ "--total-height": `${totalSize}px` } as CSSProperties}
          >
            {items.map((item) => {
              const entry = logs[item.index];
              if (!entry) return null;
              return (
                <div
                  key={item.key}
                  data-index={item.index}
                  ref={virtualizer.measureElement}
                  className="absolute top-0 left-0 w-full translate-y-(--row-start)"
                  style={{ "--row-start": `${item.start}px` } as CSSProperties}
                >
                  <LogRow entry={entry} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!following && logs.length > 0 ? (
        <Button size="sm" className="absolute right-4 bottom-4 shadow-md" onClick={jumpToLatest}>
          Jump to latest
        </Button>
      ) : null}
    </section>
  );
}
