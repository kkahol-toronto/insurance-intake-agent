import './ControlsPanel.css';

function ControlsPanel({
  isPlaying,
  isPaused,
  speedMultiplier,
  onPlay,
  onPause,
  onStep,
  onReset,
  onSpeedChange,
}) {
  return (
    <div className="controls-panel">
      <div className="controls-group">
        <button
          onClick={isPlaying && !isPaused ? onPause : onPlay}
          className="control-btn play-btn"
        >
          {isPlaying && !isPaused ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button onClick={onStep} className="control-btn step-btn" disabled={isPlaying && !isPaused}>
          ⏭️ Step
        </button>
        <button onClick={onReset} className="control-btn reset-btn">
          🔄 Reset
        </button>
      </div>

      <div className="controls-group">
        <label className="control-label">
          Speed: {speedMultiplier.toFixed(2)}×
          <input
            type="range"
            min="0.25"
            max="3"
            step="0.25"
            value={speedMultiplier}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="speed-slider"
          />
        </label>
      </div>
    </div>
  );
}

export default ControlsPanel;

