import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useFNOLSimulatorStore } from '../../store/fnolSimulatorStore';
import StageNode from './StageNode';
import GlowingEdge from './GlowingEdge';
import ControlsPanel from './ControlsPanel';
import SidePanel from './SidePanel';
import StageMessages from './StageMessages';
import ChatWidget from '../ChatWidget';
import { applyLayout } from '../../utils/layoutUtils';
import './FNOLSimulator.css';

// Define nodeTypes and edgeTypes outside component to prevent recreation
const nodeTypes = {
  stageNode: StageNode,
};

const edgeTypes = {
  glowingEdge: GlowingEdge,
};

function FNOLSimulatorInner({ caseData }) {
  const [showDebugFlow, setShowDebugFlow] = useState(false);

  const {
    nodes,
    edges,
    isPlaying,
    isPaused,
    currentNodeId,
    activeEdgeId,
    lockLayout,
    speedMultiplier,
    elapsedTime,
    startTime,
    eventLog,
    setNodes,
    setEdges,
    setLockLayout,
    setSpeedMultiplier,
    reset,
    setIsPlaying,
    setIsPaused,
    setElapsedTime,
    loadFlow,
    updateNodeStatus,
    setCurrentNode,
    setActiveEdge,
    addLogEvent,
    setStartTime,
    setStageMessages,
    setCurrentStageMessageIndex,
  } = useFNOLSimulatorStore();
  
  const { fitView, getEdges: getReactFlowEdges } = useReactFlow();
  const simulationTimeoutRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const fitViewCalledRef = useRef(false);
  const layoutAppliedRef = useRef(false);

  // Load flow on mount and apply layout - ensure nodes have positions before rendering
  useEffect(() => {
    loadFlow();
    // Apply layout immediately after loading
    setTimeout(() => {
      if (nodes.length > 0) {
        const hasValidPositions = nodes.every(n => 
          n.position && 
          n.position.x !== undefined && 
          n.position.y !== undefined &&
          !isNaN(n.position.x) &&
          !isNaN(n.position.y) &&
          (n.position.x !== 0 || n.position.y !== 0)
        );
        
        if (!hasValidPositions) {
          try {
            const laidOutNodes = applyLayout(nodes, edges);
            if (laidOutNodes && laidOutNodes.length > 0) {
              setNodes(laidOutNodes);
            }
          } catch (e) {
            console.error('Layout error:', e);
            // Fallback: set basic positions in columns of 4
            const fallbackNodes = nodes.map((node, index) => ({
              ...node,
              position: { 
                x: 200 + Math.floor(index / 4) * 350, 
                y: 100 + (index % 4) * 150 
              }
            }));
            setNodes(fallbackNodes);
          }
        }
      }
      setIsLoading(false);
    }, 100);
  }, [loadFlow, nodes.length, edges.length, setNodes]);

  // Force fitView after React Flow is ready - moved after reactFlowNodes definition

  // Elapsed time counter
  useEffect(() => {
    if (!isPlaying || isPaused || !startTime) return;
    
    const interval = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, isPaused, startTime, setElapsedTime]);

  // Load stage messages from caseData
  useEffect(() => {
    if (caseData?.statusData?.logs) {
      const logs = caseData.statusData.logs;
      logs.forEach((log) => {
        const stageId = getStageIdFromName(log.stageName);
        if (stageId) {
          // Store the message for this stage
          setStageMessages(stageId, [log.message]);
          setCurrentStageMessageIndex(stageId, 0);
        }
      });
    }
  }, [caseData, setStageMessages, setCurrentStageMessageIndex]);

  const getStageIdFromName = (stageName) => {
    const mapping = {
      'FNOL Ingestion': 'fnolIngestion',
      'Metadata Extraction': 'metadataExtraction',
      'Document Classification': 'documentClassification',
      'Address Normalization': 'addressNormalization',
      'Deduplication Check': 'deduplicationCheck',
      'Policy Retrieval': 'policyRetrieval',
      'Coverage Matching': 'coverageMatching',
      'Premium Check': 'premiumCheck',
      'Coverage Integrity Score': 'coverageIntegrityScore',
      'Severity Scoring': 'severityScoring',
      'Fraud/Anomaly Check': 'fraudAnomalyCheck',
      'Inspection Decisioning': 'inspectionDecisioning',
      'Evidence Collection': 'evidenceCollection',
      'Revalidation': 'revalidation',
      'Property Damage Estimation': 'propertyDamageEstimation',
      'Reserve Estimation': 'reserveEstimation',
      'Managerial Escalation & Approval': 'managerialEscalation',
      'Coverage Determination': 'coverageDetermination',
      'Payment Preparation': 'paymentPreparation',
      'Final Outcome': 'finalOutcome',
    };
    return mapping[stageName];
  };

  const runSimulationStep = useCallback(() => {
    if (!currentNodeId) {
      // Start from 'start' node
      const startNode = nodes.find(n => n.id === 'start');
      if (startNode) {
        setCurrentNode('start');
        updateNodeStatus('start', 'active');
        setStartTime(Date.now());
        addLogEvent({
          timestamp: Date.now(),
          fromNodeId: null,
          toNodeId: 'start',
          reason: 'Simulation started'
        });
        
        const duration = startNode.durationMs / speedMultiplier;
        simulationTimeoutRef.current = setTimeout(() => {
          updateNodeStatus('start', 'done');
          advanceToNextNode('start');
        }, duration);
      }
      return;
    }
    
    advanceToNextNode(currentNodeId);
  }, [currentNodeId, nodes, speedMultiplier, setCurrentNode, updateNodeStatus, setStartTime, addLogEvent]);

  const advanceToNextNode = useCallback((currentNodeId) => {
    const outgoingEdges = edges.filter(e => e.source === currentNodeId);
    if (outgoingEdges.length === 0) {
      // Terminal node
      setIsPlaying(false);
      setActiveEdge(null);
      addLogEvent({
        timestamp: Date.now(),
        fromNodeId: currentNodeId,
        toNodeId: currentNodeId,
        reason: 'Simulation complete'
      });
      return;
    }
    
    const nextEdge = outgoingEdges[0];
    const nextNodeId = nextEdge.target;
    const nextNode = nodes.find(n => n.id === nextNodeId);
    
    if (!nextNode) return;
    
    // Transition animation
    setActiveEdge(nextEdge.id);
    addLogEvent({
      timestamp: Date.now(),
      fromNodeId: currentNodeId,
      toNodeId: nextNodeId,
      reason: `Transitioning to ${nextNode.label}`
    });
    
    setTimeout(() => {
      updateNodeStatus(currentNodeId, 'done');
      setActiveEdge(null);
      setCurrentNode(nextNodeId);
      updateNodeStatus(nextNodeId, 'active');
      
      const duration = nextNode.durationMs / speedMultiplier;
      simulationTimeoutRef.current = setTimeout(() => {
        if (isPlaying && !isPaused) {
          updateNodeStatus(nextNodeId, 'done');
          advanceToNextNode(nextNodeId);
        }
      }, duration);
    }, 300);
  }, [edges, nodes, isPlaying, isPaused, speedMultiplier, setActiveEdge, setCurrentNode, updateNodeStatus, addLogEvent]);

  const handlePlay = useCallback(() => {
    if (!isPlaying) {
      setIsPlaying(true);
      setIsPaused(false);
      runSimulationStep();
    } else if (isPaused) {
      setIsPaused(false);
      runSimulationStep();
    }
  }, [isPlaying, isPaused, setIsPlaying, setIsPaused, runSimulationStep]);

  const handlePause = useCallback(() => {
    setIsPaused(true);
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
  }, [setIsPaused]);

  const handleStep = useCallback(() => {
    if (isPlaying && !isPaused) {
      handlePause();
    }
    runSimulationStep();
  }, [isPlaying, isPaused, handlePause, runSimulationStep]);

  const handleReset = useCallback(() => {
    if (simulationTimeoutRef.current) {
      clearTimeout(simulationTimeoutRef.current);
    }
    reset();
    setIsPlaying(false);
    setIsPaused(false);
    setElapsedTime(0);
    setStartTime(null);
  }, [reset, setIsPlaying, setIsPaused, setElapsedTime, setStartTime]);

  const handleAutoLayout = useCallback(() => {
    try {
      const laidOutNodes = applyLayout(nodes, edges);
      if (laidOutNodes && laidOutNodes.length > 0) {
        setNodes(laidOutNodes);
        setTimeout(() => {
          try {
            fitView({ padding: 0.2 });
          } catch (e) {
            console.warn('fitView error in auto layout:', e);
          }
        }, 200);
      }
    } catch (e) {
      console.error('Auto layout error:', e);
    }
  }, [nodes, edges, setNodes, fitView]);

  const onNodesChange = useCallback((changes) => {
    setNodes(applyNodeChanges(changes, nodes));
  }, [nodes, setNodes]);

  const reactFlowNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) {
      return [];
    }
    
    const flowNodes = nodes.map((node, index) => {
      // Ensure position exists and is valid (no NaN, no undefined)
      let position;
      if (node.position && 
          node.position.x !== undefined && 
          node.position.y !== undefined &&
          !isNaN(node.position.x) &&
          !isNaN(node.position.y)) {
        position = node.position;
      } else {
        // Fallback: columns of 4 layout
        position = { 
          x: 200 + Math.floor(index / 4) * 350, 
          y: 100 + (index % 4) * 150 
        };
      }
      
      const flowNode = {
        id: node.id,
        type: 'stageNode',
        position,
        data: {
          label: node.label,
          status: node.status,
          notes: node.notes || [],
        },
        draggable: !lockLayout,
        selectable: true,
        style: {
          cursor: lockLayout ? 'default' : 'grab',
        },
      };
      
      return flowNode;
    });
    
    return flowNodes;
  }, [nodes, lockLayout]);

  // Force fitView after React Flow nodes are ready - only once
  useEffect(() => {
    if (reactFlowNodes.length > 0 && !fitViewCalledRef.current) {
      fitViewCalledRef.current = true;
      const timer = setTimeout(() => {
        try {
          fitView({ padding: 0.2, duration: 300, maxZoom: 1 });
        } catch (e) {
          console.warn('Force fitView error:', e);
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [reactFlowNodes.length, fitView]);

  // Convert store edges to ReactFlow edges - only when nodes are ready
  const reactFlowEdges = useMemo(() => {
    if (reactFlowNodes.length === 0) return [];
    if (!edges || edges.length === 0) return [];
    
    const nodeIds = new Set(reactFlowNodes.map(n => n.id));
    
    // Filter and map edges - ensure source and target exist
    const validEdges = edges.filter(edge => {
      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);
      if (!sourceExists || !targetExists) {
        console.warn(`Edge ${edge.id} has invalid source/target`);
        return false;
      }
      return true;
    });
    
    const flowEdges = validEdges.map(edge => {
      const isActive = activeEdgeId === edge.id;
      return {
        id: String(edge.id),
        source: String(edge.source),
        target: String(edge.target),
        type: 'default', // TEST: Use default edge type instead of custom
        animated: isActive,
        style: {
          stroke: isActive ? '#00E5FF' : '#D4AF37',
          strokeWidth: isActive ? 3 : 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: isActive ? '#00E5FF' : '#D4AF37',
        },
      };
    });
    
    return flowEdges;
  }, [edges, activeEdgeId, reactFlowNodes]);

  // Debug once edges/nodes ready: compare props vs ReactFlow internal store
  useEffect(() => {
    if (reactFlowNodes.length > 0) {
      const internalEdges = getReactFlowEdges();
      console.log('FNOLSimulator edge comparison', {
        nodesPassed: reactFlowNodes.length,
        edgesPassed: reactFlowEdges.length,
        internalEdgesCount: internalEdges.length,
        sampleEdgePassed: reactFlowEdges[0],
        sampleInternalEdge: internalEdges[0],
      });
    }
  }, [reactFlowNodes, reactFlowEdges, getReactFlowEdges]);

  const debugNodes = useMemo(() => ([
    {
      id: 'debug-1',
      type: 'stageNode',
      position: { x: 200, y: 200 },
      data: { label: 'Debug Node A', status: 'idle' },
    },
    {
      id: 'debug-2',
      type: 'stageNode',
      position: { x: 500, y: 200 },
      data: { label: 'Debug Node B', status: 'idle' },
    },
  ]), []);

  const debugEdges = useMemo(() => ([
    {
      id: 'debug-edge',
      source: 'debug-1',
      target: 'debug-2',
      type: 'default',
      style: { stroke: '#D4AF37', strokeWidth: 3 },
    },
  ]), []);

  if (isLoading || nodes.length === 0) {
    return (
      <div className="simulator-loading">
        <p>Loading simulator...</p>
      </div>
    );
  }

  return (
    <div className="fnol-simulator" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {showDebugFlow ? (
        <ReactFlow
          nodes={debugNodes}
          edges={debugEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          className="simulator-flow"
          nodesDraggable={false}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      ) : (
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          className="simulator-flow"
          nodesDraggable={false}
          className="simulator-flow"
          nodesDraggable={false}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        >
          <Background />
          <Controls />
          <MiniMap />
          
          <Panel position="top-left" className="simulator-header">
            <div className="header-content">
              <h2>FNOL Processing Agent</h2>
              <div className="header-controls">
                <button
                  onClick={() => setLockLayout(!lockLayout)}
                  className={lockLayout ? 'active' : ''}
                >
                  {lockLayout ? '🔒 Locked' : '🔓 Unlocked'}
                </button>
                <button onClick={handleAutoLayout}>
                  📐 Auto Layout
                </button>
                <button onClick={() => setShowDebugFlow(true)}>
                  🧪 Show Debug Flow
                </button>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      )}

      {showDebugFlow && (
        <Panel position="top-left" className="simulator-header">
          <div className="header-content">
            <h2>Debug Flow (Test)</h2>
            <div className="header-controls">
              <button onClick={() => setShowDebugFlow(false)}>
                🔁 Return to FNOL Flow
              </button>
            </div>
          </div>
        </Panel>
      )}

      <ControlsPanel
        isPlaying={isPlaying}
        isPaused={isPaused}
        speedMultiplier={speedMultiplier}
        onPlay={handlePlay}
        onPause={handlePause}
        onStep={handleStep}
        onReset={handleReset}
        onSpeedChange={setSpeedMultiplier}
      />

      <SidePanel
        currentNodeId={currentNodeId}
        elapsedTime={elapsedTime}
        nodes={nodes}
        edges={edges}
        caseData={caseData}
      />

      {/* Stage Messages - only render for active stage to prevent infinite loops */}
      {currentNodeId && (
        <StageMessages
          key={currentNodeId}
          stageId={currentNodeId}
          isActive={nodes.find(n => n.id === currentNodeId)?.status === 'active'}
          caseData={caseData}
        />
      )}

      <ChatWidget
        cases={caseData ? [caseData] : []}
        statistics={{}}
        cityData={{}}
      />
    </div>
  );
}

export default function FNOLSimulator({ caseData }) {
  return (
    <ReactFlowProvider>
      <FNOLSimulatorInner caseData={caseData} />
    </ReactFlowProvider>
  );
}

