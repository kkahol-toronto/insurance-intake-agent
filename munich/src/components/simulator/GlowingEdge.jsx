import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';
import classNames from 'classnames';
import './GlowingEdge.css';

function GlowingEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = data?.isActive || false;
  const condition = data?.condition;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isActive ? '#00E5FF' : '#D4AF37',
          strokeWidth: isActive ? 3 : 2,
          fill: 'none',
          ...style,
        }}
        className={classNames('glowing-edge', {
          'edge-active': isActive,
          'edge-nigo': condition === 'NIGO',
          'edge-igo': condition === 'IGO'
        })}
      />
      {condition && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className={classNames('edge-label', {
              'label-nigo': condition === 'NIGO',
              'label-igo': condition === 'IGO'
            })}
          >
            {condition}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export default memo(GlowingEdge);

