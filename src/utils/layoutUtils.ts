import { FlowNode, FlowEdge } from '../types/flow';

// Simple manual layout to avoid dagre/d3 conflicts
export const applyLayout = (nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] => {
  // Create a simple grid layout
  const nodeMap = new Map<string, FlowNode>();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Calculate levels (depth from start)
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  // Start node is at level 0
  const startNode = nodes.find(n => n.id === 'start');
  if (startNode) {
    levels.set('start', 0);
    visited.add('start');
  }
  
  // BFS to calculate levels
  const queue: string[] = startNode ? ['start'] : [];
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentLevel = levels.get(currentId) || 0;
    
    edges
      .filter(e => e.source === currentId)
      .forEach(edge => {
        if (!visited.has(edge.target)) {
          levels.set(edge.target, currentLevel + 1);
          visited.add(edge.target);
          queue.push(edge.target);
        }
      });
  }
  
  // Group nodes by level
  const nodesByLevel = new Map<number, FlowNode[]>();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level)!.push(node);
  });
  
  // Position nodes in a grid
  const nodeWidth = 220;
  const nodeHeight = 100;
  const horizontalSpacing = 250;
  const verticalSpacing = 200;
  const startX = 100;
  const startY = 100;
  
  return nodes.map(node => {
    const level = levels.get(node.id) || 0;
    const levelNodes = nodesByLevel.get(level) || [];
    const indexInLevel = levelNodes.findIndex(n => n.id === node.id);
    
    // Center nodes horizontally within level
    const totalWidth = (levelNodes.length - 1) * horizontalSpacing;
    const levelStartX = startX - (totalWidth / 2);
    
    return {
      ...node,
      position: {
        x: levelStartX + (indexInLevel * horizontalSpacing),
        y: startY + (level * verticalSpacing),
      },
    };
  });
};

