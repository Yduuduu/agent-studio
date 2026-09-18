import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProgressBar } from "./ProgressBar";

const meta = {
  title: "UI/ProgressBar",
  component: ProgressBar,
  parameters: { layout: "padded" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100 } } },
} satisfies Meta<typeof ProgressBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { value: 0 } };
export const HalfWay: Story = { args: { value: 50 } };
export const Complete: Story = { args: { value: 100 } };
export const OverMax: Story = { args: { value: 150 } };
