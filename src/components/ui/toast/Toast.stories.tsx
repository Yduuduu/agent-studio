import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Toast } from "./Toast";

const meta = {
  title: "UI/Toast",
  component: Toast,
  parameters: { layout: "centered" },
  argTypes: {
    variant: { control: "select", options: ["info", "success", "warning", "error"] },
  },
  args: { title: "Workflow saved", onDismiss: () => {} },
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = { args: { variant: "info" } };
export const Success: Story = { args: { variant: "success" } };
export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Connection rejected",
    description: "This edge would create a cycle in the workflow.",
  },
};
export const Error: Story = {
  args: { variant: "error", title: "Run failed", description: "LLM provider timed out." },
};
