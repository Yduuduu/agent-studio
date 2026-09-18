import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "../button/Button";
import { Drawer } from "./Drawer";

const meta = {
  title: "UI/Drawer",
  component: Drawer,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

function DrawerDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Node Settings">
        <p className="text-sm text-gray-600">Drawer content goes here.</p>
      </Drawer>
    </div>
  );
}

export const Default: Story = {
  args: { open: true, onClose: () => {} },
  render: () => <DrawerDemo />,
};
