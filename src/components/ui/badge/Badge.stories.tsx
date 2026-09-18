import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Badge } from "./Badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    status: {
      control: "select",
      options: ["idle", "pending", "running", "success", "error"],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = { args: { status: "idle" } };
export const Pending: Story = { args: { status: "pending" } };
export const Running: Story = { args: { status: "running" } };
export const Success: Story = { args: { status: "success" } };
export const Error: Story = { args: { status: "error" } };
