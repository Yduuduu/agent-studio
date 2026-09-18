import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Input } from "./Input";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "centered" },
  args: { placeholder: "Enter a value..." },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: "sm" } };
export const Large: Story = { args: { size: "lg" } };
export const WithError: Story = {
  args: { error: "This field is required.", defaultValue: "" },
};
export const Disabled: Story = { args: { disabled: true, defaultValue: "Locked" } };
