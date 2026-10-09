"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  type Connection,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";

import { useNodeSelectionStore } from "@/hooks/useNodeSelection";
import { useCanvasStore, type WorkflowNode } from "@/store/useCanvasStore";
import { useToastStore } from "@/store/useToastStore";

import { EDGE_TYPES, NODE_TYPES } from "./canvas.constants";
import { wouldCreateCycle } from "./canvas.utils";

export function WorkflowCanvas() {
  const nodes = useCanvasStore((state) => state.nodes);
  const edges = useCanvasStore((state) => state.edges);
  const onNodesChange = useCanvasStore((state) => state.onNodesChange);
  const onEdgesChange = useCanvasStore((state) => state.onEdgesChange);
  const onConnect = useCanvasStore((state) => state.onConnect);
  const openNode = useNodeSelectionStore((state) => state.openNode);

  const handleNodeClick = useCallback<NodeMouseHandler<WorkflowNode>>(
    (_event, node) => openNode(node.id),
    [openNode],
  );

  const handleConnect = useCallback(
    (connection: Connection) => {
      const { nodes: currentNodes, edges: currentEdges } = useCanvasStore.getState();

      if (wouldCreateCycle(currentNodes, currentEdges, connection)) {
        useToastStore.getState().show({
          variant: "warning",
          title: "Connection rejected",
          description: "This edge would create a cycle in the workflow.",
        });
        return;
      }

      onConnect(connection);
    },
    [onConnect],
  );

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={handleConnect}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable />
      </ReactFlow>
    </div>
  );
}
