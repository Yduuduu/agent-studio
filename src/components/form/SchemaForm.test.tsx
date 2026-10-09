import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import type { z } from "zod";

import { NODE_CONFIG_FORMS, type NodeConfigForm } from "@/types/form.schema";

import { SchemaForm } from "./SchemaForm";

function ConfigForm<K extends keyof typeof NODE_CONFIG_FORMS>({
  kind,
  onSubmit,
}: {
  kind: K;
  onSubmit: (values: FieldValues) => void;
}) {
  const { schema, uiSchema, defaultValues } = NODE_CONFIG_FORMS[
    kind
  ] as unknown as NodeConfigForm<z.AnyZodObject>;
  const { control, handleSubmit } = useForm({ resolver: zodResolver(schema), defaultValues });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <SchemaForm
        control={control as unknown as Control<FieldValues>}
        schema={schema}
        uiSchema={uiSchema}
      />
      <button type="submit">Save</button>
    </form>
  );
}

describe("SchemaForm", () => {
  it("renders the LLM config, toggles conditional fields and edits nested paths", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ConfigForm kind="llm" onSubmit={onSubmit} />);

    expect(screen.getByLabelText("Extended thinking")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Provider"), "openai");
    expect(screen.queryByLabelText("Extended thinking")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("Model"), "gpt-x");
    await user.clear(screen.getByLabelText("Max attempts"));
    await user.type(screen.getByLabelText("Max attempts"), "5");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      provider: "openai",
      model: "gpt-x",
      retry: { policy: { maxAttempts: 5, backoff: "exponential" } },
    });
  });

  it("surfaces nested validation errors at the right field", async () => {
    const user = userEvent.setup();
    render(<ConfigForm kind="llm" onSubmit={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Model is required")).toBeInTheDocument();
  });

  it("renders array items recursively and appends new rows", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ConfigForm kind="condition" onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    const fields = screen.getAllByLabelText("Field");
    const values = screen.getAllByLabelText("Value");
    expect(fields).toHaveLength(2);

    for (const [index, input] of fields.entries()) {
      await user.type(input, `f${index}`);
      await user.type(values[index]!, `v${index}`);
    }
    await user.selectOptions(screen.getAllByLabelText("Operator")[1]!, "greaterThan");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      rules: [
        { field: "f0", operator: "equals", value: "v0" },
        { field: "f1", operator: "greaterThan", value: "v1" },
      ],
      combinator: "and",
    });
  });
});
