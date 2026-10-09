"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type FieldValues } from "react-hook-form";
import { z } from "zod";

import { SchemaForm } from "@/components/form/SchemaForm";
import { TextField } from "@/components/form/fields/TextField";
import { Button } from "@/components/ui/button/Button";
import { Drawer } from "@/components/ui/drawer/Drawer";
import { useEditingNode, useNodeSelectionStore } from "@/hooks/useNodeSelection";
import { useCanvasStore, type WorkflowNode } from "@/store/useCanvasStore";
import { useToastStore } from "@/store/useToastStore";
import { NODE_CONFIG_FORMS, type NodeConfigForm } from "@/types/form.schema";
import type { WorkflowNodeKind } from "@/types/node.schema";

const labelSchema = z.string().min(1, "Label is required");

// One settings schema per node kind, built once at module scope so the
// resolver and SchemaForm's memoized parse see a stable reference.
const settingsSchema = (config: z.AnyZodObject) => z.object({ label: labelSchema, config });
const SETTINGS_SCHEMAS: Record<WorkflowNodeKind, z.AnyZodObject> = {
  llm: settingsSchema(NODE_CONFIG_FORMS.llm.schema),
  "db-query": settingsSchema(NODE_CONFIG_FORMS["db-query"].schema),
  condition: settingsSchema(NODE_CONFIG_FORMS.condition.schema),
};

const KIND_TITLES: Record<WorkflowNodeKind, string> = {
  llm: "LLM node",
  "db-query": "DB query node",
  condition: "Condition node",
};

export function NodeSettingsDrawer() {
  const node = useEditingNode();
  const close = useNodeSelectionStore((state) => state.close);

  return (
    <Drawer
      open={Boolean(node)}
      onClose={close}
      title={node ? `${KIND_TITLES[node.data.kind]} settings` : undefined}
    >
      {/* key: switching nodes remounts the form with that node's values. */}
      {node ? <NodeSettingsForm key={node.id} node={node} onDone={close} /> : null}
    </Drawer>
  );
}

interface NodeSettingsFormProps {
  node: WorkflowNode;
  onDone: () => void;
}

function NodeSettingsForm({ node, onDone }: NodeSettingsFormProps) {
  const { kind } = node.data;
  // Erase the per-kind type here: `kind` is only known at runtime, and the
  // registry's `satisfies` check already ties each schema to its uiSchema.
  const form = NODE_CONFIG_FORMS[kind] as unknown as NodeConfigForm<z.AnyZodObject>;
  const updateNodeSettings = useCanvasStore((state) => state.updateNodeSettings);

  const { control, handleSubmit, formState } = useForm<FieldValues>({
    resolver: zodResolver(SETTINGS_SCHEMAS[kind]),
    defaultValues: {
      label: node.data.label,
      config: node.data.config ?? structuredClone(form.defaultValues),
    },
  });

  const onSubmit = handleSubmit((values) => {
    updateNodeSettings(node.id, {
      label: values.label as string,
      config: values.config as Record<string, unknown>,
    });
    useToastStore.getState().show({ variant: "success", title: "Node settings saved" });
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <TextField control={control} name="label" label="Label" />
      <SchemaForm
        control={control}
        schema={form.schema}
        uiSchema={form.uiSchema}
        namePrefix="config"
      />
      <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" isLoading={formState.isSubmitting}>
          Save
        </Button>
      </div>
    </form>
  );
}
