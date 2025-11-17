import { useFNOLSimulatorStore } from '../../store/fnolSimulatorStore';
import './SidePanel.css';

function SidePanel({ currentNodeId, elapsedTime, nodes, edges, caseData }) {
  const { eventLog } = useFNOLSimulatorStore();
  
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
            eventLog.slice().reverse().map((event, reverseIndex) => {
              const actualIndex = eventLog.length - 1 - reverseIndex;
              return (
                <div key={actualIndex} className="log-event">
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function getNextNode(currentNodeId, nodes, edges) {
  const outgoingEdges = edges.filter(e => e.source === currentNodeId);
  if (outgoingEdges.length === 0) return null;
  
  const nextNodeId = outgoingEdges[0].target;
  return nodes.find(n => n.id === nextNodeId) || null;
}

export default SidePanel;

