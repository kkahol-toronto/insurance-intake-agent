import { FlowNode, FlowEdge, BranchPolicy } from '../types/flow';
import { useSimulatorStore } from '../store/simulatorStore';

export const getNextNode = (
  currentNodeId: string,
  nodes: FlowNode[],
  edges: FlowEdge[],
  branchPolicy: BranchPolicy,
  nigoCount: number
): { nextNodeId: string | null; edgeId: string; reason?: string } | null => {
  // Find all outgoing edges from current node
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  
  if (outgoingEdges.length === 0) {
    return null; // Terminal node (CHESS)
  }
  
  // Special handling for contentValidation node (NIGO/IGO branch)
  if (currentNodeId === 'contentValidation') {
    const nigoEdge = outgoingEdges.find(e => e.condition === 'NIGO');
    const igoEdge = outgoingEdges.find(e => e.condition === 'IGO');
    
    if (!nigoEdge || !igoEdge) {
      // Fallback to first edge if structure is wrong
      return { nextNodeId: outgoingEdges[0].target, edgeId: outgoingEdges[0].id };
    }
    
    switch (branchPolicy) {
      case 'Always IGO':
        return { nextNodeId: igoEdge.target, edgeId: igoEdge.id, reason: 'IGO path selected' };
      
      case 'Always NIGO (once)':
        if (nigoCount === 0) {
          return { nextNodeId: nigoEdge.target, edgeId: nigoEdge.id, reason: 'NIGO path selected (first time)' };
        } else {
          return { nextNodeId: igoEdge.target, edgeId: igoEdge.id, reason: 'IGO path selected (after NIGO)' };
        }
      
      case 'Random p=0.2 NIGO':
        const shouldNigo = Math.random() < 0.2;
        if (shouldNigo && nigoCount === 0) {
          return { nextNodeId: nigoEdge.target, edgeId: nigoEdge.id, reason: 'NIGO path selected (random)' };
        } else {
          return { nextNodeId: igoEdge.target, edgeId: igoEdge.id, reason: 'IGO path selected' };
        }
    }
  }
  
  // For all other nodes, take the first outgoing edge
  return { nextNodeId: outgoingEdges[0].target, edgeId: outgoingEdges[0].id };
};

export const runSimulationStep = async (
  currentNodeId: string | null,
  onComplete: () => void
) => {
  const store = useSimulatorStore.getState();
  const { nodes, edges, branchPolicy, speedMultiplier, nigoCount } = store;
  
  if (!currentNodeId) {
    // Start simulation from 'start' node
    const startNode = nodes.find(n => n.id === 'start');
    if (startNode) {
      store.setCurrentNode('start');
      store.updateNodeStatus('start', 'active');
      store.setStartTime(Date.now());
      store.addLogEvent({
        timestamp: Date.now(),
        fromNodeId: null,
        toNodeId: 'start',
        reason: 'Simulation started'
      });
      
      const duration = startNode.durationMs / speedMultiplier;
      setTimeout(() => {
        store.updateNodeStatus('start', 'done');
        advanceToNextNode('start', onComplete);
      }, duration);
    }
    return;
  }
  
  // Current node is active, need to transition
  advanceToNextNode(currentNodeId, onComplete);
};

const advanceToNextNode = (
  currentNodeId: string,
  onComplete: () => void
) => {
  const store = useSimulatorStore.getState();
  const { nodes, edges, branchPolicy, speedMultiplier, nigoCount } = store;
  
  const next = getNextNode(currentNodeId, nodes, edges, branchPolicy, nigoCount);
  
  if (!next || !next.nextNodeId) {
    // Reached terminal node (CHESS)
    store.setIsPlaying(false);
    store.setActiveEdge(null);
    store.addLogEvent({
      timestamp: Date.now(),
      fromNodeId: currentNodeId,
      toNodeId: 'chess',
      reason: 'Reached CHESS - simulation complete'
    });
    onComplete();
    return;
  }
  
  const nextNode = nodes.find(n => n.id === next.nextNodeId);
  if (!nextNode) {
    onComplete();
    return;
  }
  
  // Check if we're going to NIGO path
  if (next.reason?.includes('NIGO')) {
    store.incrementNigoCount();
  }
  
  // Activate edge
  store.setActiveEdge(next.edgeId);
  store.addLogEvent({
    timestamp: Date.now(),
    fromNodeId: currentNodeId,
    toNodeId: next.nextNodeId,
    reason: next.reason
  });
  
  // After a short delay, activate next node
  setTimeout(() => {
    store.updateNodeStatus(currentNodeId, 'done');
    store.setCurrentNode(next.nextNodeId!);
    store.updateNodeStatus(next.nextNodeId!, 'active');
    store.setActiveEdge(null);
    
    // Schedule next transition
    const duration = nextNode.durationMs / speedMultiplier;
    setTimeout(() => {
      if (store.isPlaying && !store.isPaused) {
        advanceToNextNode(next.nextNodeId!, onComplete);
      } else {
        onComplete();
      }
    }, duration);
  }, 200); // Small delay for edge animation
};

export const stepSimulation = () => {
  const store = useSimulatorStore.getState();
  const { currentNodeId } = store;
  
  if (!currentNodeId) {
    // Start from beginning
    store.setStartTime(Date.now());
    store.setElapsedTime(0);
    runSimulationStep(null, () => {});
  } else {
    // Advance one step
    advanceToNextNode(currentNodeId, () => {});
  }
};

