# Claims Process Agent

An interactive visual simulator for the SunLife Insurance claims processing workflow, built with React Flow and TypeScript.

## Features

- **Interactive Flow Visualization**: Drag-and-drop nodes with React Flow
- **Real-time Simulation**: Watch the claims process flow from Start to CHESS
- **Branching Logic**: Supports NIGO/IGO branching at Claim Content Validation
- **Visual States**: 
  - Idle (dark card)
  - Active (neon light-blue with glow)
  - Done (green with glow)
- **Animated Edges**: Glowing arrows with dash-flow animation during transitions
- **Controls**: Play/Pause/Step/Reset with speed control (0.25× to 3×)
- **Branch Policies**:
  - Always IGO: Always take the IGO path
  - Always NIGO (once): Take NIGO path once, then IGO
  - Random p=0.2 NIGO: 20% chance to take NIGO path
- **Event Logging**: Real-time log of all transitions
- **Layout Persistence**: Node positions saved to localStorage
- **Auto Layout**: Dagre-based automatic layout

## Usage

Click on any claim in the Claims Table to open the simulator modal.

### Controls

- **Play**: Start or resume simulation
- **Pause**: Pause the running simulation
- **Step**: Advance one node at a time
- **Reset**: Reset simulation to initial state
- **Speed Slider**: Adjust simulation speed (0.25× to 3×)
- **Branch Policy**: Select branching behavior at validation gate
- **Lock Layout**: Toggle node dragging
- **Auto Layout**: Apply automatic layout algorithm

## Flow Stages

1. **Start** → Claim Ingestion
2. **Claim Ingestion** → Claim Form Enhancement
3. **Claim Form Enhancement** → Classification
4. **Classification** → Claim Content Validation
5. **Claim Content Validation** → (NIGO/IGO branch)
   - **NIGO**: → Provider Notification → back to Claim Content Validation
   - **IGO**: → Data Enrichment
6. **Data Enrichment** → Electronic Claim
7. **Electronic Claim** → Electronic Claim Validation
8. **Electronic Claim Validation** → Gap Assessment
9. **Gap Assessment** → Code Conversion
10. **Code Conversion** → Claim Data Entry
11. **Claim Data Entry** → CHESS (terminal)

## Technical Details

- **Framework**: React 18 + TypeScript
- **Flow Library**: React Flow v11+
- **State Management**: Zustand
- **Animations**: Framer Motion + CSS keyframes
- **Layout**: Dagre for automatic layout
- **Storage**: localStorage for node positions

## Files

- `ClaimsSimulator.tsx`: Main simulator component
- `StageNode.tsx`: Custom node component with status styling
- `GlowingEdge.tsx`: Custom edge component with animations
- `ControlsPanel.tsx`: Control buttons and settings
- `SidePanel.tsx`: Status display and event log
- `simulatorStore.ts`: Zustand store for simulation state
- `simulationEngine.ts`: Simulation logic and branching
- `layoutUtils.ts`: Dagre layout utilities

