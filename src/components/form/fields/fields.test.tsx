import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useForm, type Control, type FieldValues } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ArrayField } from "./ArrayField";
import { BooleanField } from "./BooleanField";
import { ConditionalField } from "./ConditionalField";
import { NumberField } from "./NumberField";
import { SelectField } from "./SelectField";
import { TextField } from "./TextField";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  attempts: z.number().int().min(1, "At least 1"),
  provider: z.enum(["anthropic", "openai"]),
  thinking: z.boolean().optional(),
  rules: z.array(z.object({ field: z.string().min(1, "Field is required") })).min(1, "Add a rule"),
});
type Values = z.input<typeof schema>;

const DEFAULTS: Values = {
  name: "draft",
  attempts: 3,
  provider: "openai",
  thinking: false,
  rules: [{ field: "score" }],
};

function Harness({
  children,
  onSubmit = () => {},
}: {
  children: (control: Control<FieldValues>) => ReactNode;
  onSubmit?: (values: Values) => void;
}) {
  const { control, handleSubmit } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {children(control as unknown as Control<FieldValues>)}
      <button type="submit">Save</button>
    </form>
  );
}

describe("TextField", () => {
  it("shows the schema error and clears it once filled", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness onSubmit={onSubmit}>
        {(control) => <TextField control={control} name="name" label="Name" />}
      </Harness>,
    );

    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");

    await user.type(screen.getByLabelText("Name"), "Summarize");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ name: "Summarize" });
  });

  it("renders a textarea when multiline", () => {
    render(
      <Harness>
        {(control) => <TextField control={control} name="name" label="Prompt" multiline />}
      </Harness>,
    );
    expect(screen.getByLabelText("Prompt").tagName).toBe("TEXTAREA");
  });
});

describe("NumberField", () => {
  it("stores numbers, not strings", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <Harness onSubmit={onSubmit}>
        {(control) => <NumberField control={control} name="attempts" label="Attempts" />}
      </Harness>,
    );

    await user.clear(screen.getByLabelText("Attempts"));
    await user.type(screen.getByLabelText("Attempts"), "5");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ attempts: 5 });
  });
});

describe("SelectField + ConditionalField", () => {
  it("reveals the dependent field only for the matching option", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        {(control) => (
          <>
            <SelectField
              control={control}
              name="provider"
              label="Provider"
              options={[
                { value: "anthropic", label: "Anthropic" },
                { value: "openai", label: "OpenAI" },
              ]}
            />
            <ConditionalField
              control={control}
              dependsOn="provider"
              is={(value) => value === "anthropic"}
            >
              <BooleanField control={control} name="thinking" label="Extended thinking" />
            </ConditionalField>
          </>
        )}
      </Harness>,
    );

    expect(screen.queryByLabelText("Extended thinking")).not.toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Provider"), "anthropic");
    expect(screen.getByLabelText("Extended thinking")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Provider"), "openai");
    expect(screen.queryByLabelText("Extended thinking")).not.toBeInTheDocument();
  });
});

describe("ArrayField", () => {
  function renderRules(onSubmit = vi.fn()) {
    render(
      <Harness onSubmit={onSubmit}>
        {(control) => (
          <ArrayField
            control={control}
            name="rules"
            label="Rules"
            newItem={() => ({ field: "" })}
            addLabel="Add rule"
            renderItem={(itemName, index) => (
              <TextField
                control={control}
                name={`${itemName}.field`}
                label={`Field ${index + 1}`}
              />
            )}
          />
        )}
      </Harness>,
    );
    return onSubmit;
  }

  it("appends and removes items with nested dot-path names", async () => {
    const user = userEvent.setup();
    const onSubmit = renderRules();

    await user.click(screen.getByRole("button", { name: "Add rule" }));
    await user.type(screen.getByLabelText("Field 2"), "latency");
    await user.click(screen.getByRole("button", { name: "Remove Rules 1" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ rules: [{ field: "latency" }] });
  });

  it("shows the array-level error when every item is removed", async () => {
    const user = userEvent.setup();
    renderRules();

    await user.click(screen.getByRole("button", { name: "Remove Rules 1" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Add a rule")).toBeInTheDocument();
  });
});
