import { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import GlowingEdge from './GlowingEdge';
import StageNode from './StageNode';
import './FNOLSimulator.css';

const nodeTypes = {
  stageNode: StageNode,
};

const edgeTypes = {
  glowingEdge: GlowingEdge,
};

function EdgeTestInner() {
  const nodes = useMemo(() => [
    {
      id: 'node1',
      type: 'stageNode',
      position: { x: 100, y: 100 },
      data: { label: 'Node 1', status: 'idle' },
    },
    {
      id: 'node2',
      type: 'stageNode',
      position: { x: 400, y: 100 },
      data: { label: 'Node 2', status: 'idle' },
    },
  ], []);

  const edges = useMemo(() => [
    {
      id: 'edge1',
      source: 'node1',
      target: 'node2',
      type: 'glowingEdge',
      animated: false,
      data: { isActive: false },
      markerEnd: {
        type: 'arrowclosed',
        color: '#D4AF37',
      },
    },
  ], []);

  console.log('EdgeTest - Nodes:', nodes);
  console.log('EdgeTest - Edges:', edges);

  return (
    <div style={{ width: '100%', height: '600px', background: '#0a0f1a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}

export default function EdgeTest() {
  return (
    <ReactFlowProvider>
      <EdgeTestInner />
    </ReactFlowProvider>
  );
}

