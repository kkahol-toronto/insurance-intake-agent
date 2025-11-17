// Simple manual layout for FNOL flow
export const applyLayout = (nodes, edges) => {
  const nodeMap = new Map();
  nodes.forEach(node => nodeMap.set(node.id, node));
  
  // Calculate levels (depth from start)
  const levels = new Map();
  const visited = new Set();
  
  const startNode = nodes.find(n => n.id === 'start');
  if (startNode) {
    levels.set('start', 0);
    visited.add('start');
  }
  
  // BFS to calculate levels
  const queue = startNode ? ['start'] : [];
  while (queue.length > 0) {
    const currentId = queue.shift();
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
  const nodesByLevel = new Map();
  nodes.forEach(node => {
    const level = levels.get(node.id) || 0;
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, []);
    }
    nodesByLevel.get(level).push(node);
  });
  
  // Position nodes in columns: 4 nodes per column, then move to next column
  const nodesPerColumn = 4;
  const verticalSpacing = 150;
  const horizontalSpacing = 350;
  const startX = 200;
  const startY = 100;
  
  const positionedNodes = nodes.map((node, index) => {
    const level = levels.get(node.id) || index;
    
    // Calculate which column (every 4 nodes)
    const column = Math.floor(level / nodesPerColumn);
    // Calculate position within column (0-3)
    const positionInColumn = level % nodesPerColumn;
    
    return {
      ...node,
      position: {
        x: startX + (column * horizontalSpacing),
        y: startY + (positionInColumn * verticalSpacing),
      },
    };
  });
  
  return positionedNodes;
};

