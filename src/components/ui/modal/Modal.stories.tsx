import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";

import { Button } from "../button/Button";
import { Modal } from "./Modal";

const meta = {
  title: "UI/Modal",
  component: Modal,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

function ModalDemo() {
  const [open, setOpen] = useState(true);
  return (
    <div className="p-6">
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Delete node?">
        <p className="mb-4 text-sm text-gray-600">This action cannot be undone.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export const Default: Story = {
  args: { open: true, onClose: () => {} },
  render: () => <ModalDemo />,
};
