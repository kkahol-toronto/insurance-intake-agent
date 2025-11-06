import { useSimulatorStore } from '../../store/simulatorStore';
import { FlowNode, FlowEdge } from '../../types/flow';
import './SidePanel.css';

interface SidePanelProps {
  currentNodeId: string | null;
  elapsedTime: number;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

function SidePanel({ currentNodeId, elapsedTime, nodes, edges }: SidePanelProps) {
  const { eventLog } = useSimulatorStore();
  
  const currentNode = nodes.find(n => n.id === currentNodeId);
  const nextNode = currentNodeId ? getNextNode(currentNodeId, nodes, edges) : nodes.find(n => n.id === 'start');

  return (
    <div className="side-panel">
      <div className="panel-section">
        <h3>Current Status</h3>
        <div className="status-item">
          <span className="status-label">Current Node:</span>
          <span className="status-value">{currentNode?.label || 'Not started'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Next Node:</span>
          <span className="status-value">{nextNode?.label || 'N/A'}</span>
        </div>
        <div className="status-item">
          <span className="status-label">Elapsed Time:</span>
          <span className="status-value">{elapsedTime.toFixed(1)}s</span>
        </div>
      </div>

      <div className="panel-section">
        <h3>Event Log</h3>
        <div className="event-log" role="log" aria-live="polite">
          {eventLog.length === 0 ? (
            <div className="log-empty">No events yet</div>
          ) : (
            eventLog.slice().reverse().map((event, index) => (
              <div key={index} className="log-event">
                <div className="log-time">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </div>
                <div className="log-content">
                  {event.fromNodeId ? (
                    <>
                      <span className="log-from">
                        {nodes.find(n => n.id === event.fromNodeId)?.label || event.fromNodeId}
                      </span>
                      {' → '}
                      <span className="log-to">
                        {nodes.find(n => n.id === event.toNodeId)?.label || event.toNodeId}
                      </span>
                    </>
                  ) : (
                    <span className="log-to">
                      Started: {nodes.find(n => n.id === event.toNodeId)?.label || event.toNodeId}
                    </span>
                  )}
                  {event.reason && (
                    <div className="log-reason">{event.reason}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function getNextNode(currentNodeId: string, nodes: FlowNode[], edges: FlowEdge[]): FlowNode | null {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  if (outgoingEdges.length === 0) return null;
  
  // For now, just get the first edge's target
  // The actual branching logic is in the simulation engine
  const nextNodeId = outgoingEdges[0].target;
  return nodes.find(n => n.id === nextNodeId) || null;
}

export default SidePanel;

