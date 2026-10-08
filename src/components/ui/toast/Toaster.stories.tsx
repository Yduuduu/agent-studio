import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { useToastStore } from "@/store/useToastStore";

import { Button } from "../button/Button";
import { Toaster } from "./Toaster";

const meta = {
  title: "UI/Toaster",
  component: Toaster,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

function ToasterDemo() {
  const show = useToastStore((state) => state.show);
  return (
    <div className="flex gap-2 p-6">
      <Button onClick={() => show({ variant: "success", title: "Workflow saved" })}>Success</Button>
      <Button
        variant="danger"
        onClick={() =>
          show({
            variant: "warning",
            title: "Connection rejected",
            description: "This edge would create a cycle in the workflow.",
          })
        }
      >
        Cycle warning
      </Button>
      <Toaster />
    </div>
  );
}

export const Default: Story = { render: () => <ToasterDemo /> };
