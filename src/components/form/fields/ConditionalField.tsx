import { memo } from "react";
import { useWatch } from "react-hook-form";

import type { ConditionalFieldProps } from "../schema-form.types";

/**
 * Renders `children` only while the watched field satisfies `is`. useWatch
 * subscribes to `dependsOn` alone, so edits elsewhere never re-evaluate it.
 */
function ConditionalFieldComponent({ control, dependsOn, is, children }: ConditionalFieldProps) {
  const value = useWatch({ control, name: dependsOn });
  return is(value) ? <>{children}</> : null;
}

export const ConditionalField = memo(ConditionalFieldComponent);
