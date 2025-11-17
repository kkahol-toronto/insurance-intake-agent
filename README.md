# Munich Re FNOL Processing Portal

A comprehensive digital intake portal for SunLife Insurance claims processing, built with React and featuring bilingual support (English/French), interactive dashboards, and geographical visualization.

## Features

### Authentication
- Secure login system with predefined users
- Protected routes for dashboard access
- Users: `pallavi`, `kanav`, `devesh`, `pankaj`, `divvijay` (password: `nttdata`)

### Dashboard
- **Statistics Widgets**: Real-time metrics for claims processing
  - Daily, weekly, monthly, and quarterly views
  - Processed claims tracking
  - Accepted, pending, and denied claims breakdown
  - Percentage change indicators with trend graphs
  - Interactive line and bar charts with export functionality
  
- **Geographical Distribution Map**: Interactive Canada map visualization
  - Province-level heatmap with clear boundaries
  - City-wise claim data with markers
  - Status-based filtering (Total, Accepted, Pending, Denied)
  - Hover tooltips with detailed breakdown and pie charts
  - Data for last month
  
- **Claims Table**: Searchable and sortable claims list
  - Full-text search functionality
  - Status-based filtering
  - Detailed claim information
  
- **Chat Assistant**: AI-powered chat widget with Azure OpenAI
  - Always accessible via bottom-right floating button
  - Real-time chat with dashboard data and statistics
  - Markdown formatting support (tables, lists, bold, etc.)
  - Chat history maintained (last 10 request-response pairs)
  - Context-aware responses using dashboard data

### Design
- **Brand Colors**:
  - Marigold/Yellow: `#ECAB23` (signature brand color)
  - Deep Blue/Teal: `#003946` (primary text and backgrounds)
  - Rich Black: `#0E3846` (secondary text)
  - White: Background and contrast

- **Bilingual Support**: Full English and French translations
- **Responsive Design**: Works across desktop and mobile devices

## Munich Re FNOL Portal

A second tenant, built under `munich/`, replicates the SunLife experience for Munich Re's First Notice of Loss (FNOL) operations:

- **Branding & Theme**: Navy, white, and mustard palette with Munich Re logos.
- **USA Map Widget**: Leaflet-based map that plots FNOL cases by city (Dallas, New York, Miami, etc.) with hover details.
- **FNOL Table**: Dedicated FNOL case list with CHESS-augmentation tags, searchable columns, and row actions.
- **FNOL Processing Agent**:
  - 20-stage FNOL flow rendered with React Flow.
  - Lock/Unlock layout, auto-layout, zoom/pan, and speed controls.
  - Stage-specific messaging side panel plus event log.
  - Debug flow toggle for quick visual validation (two nodes / single edge).
- **Chat Widget**: Reuses the multi-tenant FastAPI service; sends `client=munich` so prompts/statistics are scoped to FNOL data.
- **Data Files**: Five FNOL cases live under `munich/cases/` (each with `fnol.json`, `status.json`, `outcome.txt`).

## Technology Stack

- **Frontend**: React 18 with Vite
- **Routing**: React Router DOM
- **Internationalization**: react-i18next
- **Charts**: Recharts (Line charts, Bar charts, Pie charts)
- **Maps**: react-simple-maps with Canada provinces GeoJSON
- **Styling**: CSS with custom design system
- **Markdown**: react-markdown with remark-gfm for table support
- **Backend**: FastAPI with Azure OpenAI integration

## Project Structure

```
sunlife/
├── assets/              # Images and static assets
│   ├── logo.png         # Main SunLife logo
│   ├── small_logo.png   # Small logo for header
│   └── carousel/        # Login page carousel images
├── data/                # Sample and simulated data
│   ├── initial_agent_sample_data_from_client/
│   ├── pend_data/
│   └── simulated/
├── backend/              # FastAPI backend
│   ├── main.py          # FastAPI application
│   ├── requirements.txt # Python dependencies
│   ├── services/        # Backend services
│   │   └── chat_service.py # Azure OpenAI chat service
│   └── .env            # Environment variables (not in git)
├── src/
│   ├── components/      # Reusable React components
│   │   ├── StatsWidget.jsx
│   │   ├── CityMapWidget.jsx
│   │   ├── GeographicHeatMap.jsx
│   │   ├── ClaimsTable.jsx
│   │   ├── ChatWidget.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   └── Dashboard.jsx
│   ├── utils/           # Utility functions
│   │   ├── auth.js
│   │   ├── claimsData.js
│   │   └── loadSimulatedData.js
│   ├── locales/         # Translation files
│   │   ├── en.json
│   │   └── fr.json
│   └── i18n.js          # i18n configuration
└── vite.config.js        # Vite configuration
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/kkahol-toronto/insurance-intake-agent.git
cd insurance-intake-agent
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3030`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Usage

1. **Login**: Use one of the predefined usernames with password `nttdata`
2. **Dashboard**: View statistics, maps, and claims data
3. **Graphs**: Toggle between line and bar charts, download as PNG
4. **Language**: Switch between English and French using the dropdown
5. **Map**: Hover over cities to see detailed breakdowns
6. **Chat**: Click the floating chat button (bottom-right) to open the chat window

## Key Features Details

### Statistics Widgets
- Time period selection (Day, Week, Month, Quarter)
- Percentage change indicators (green for positive, red for negative)
- Interactive graphs showing last 5 data points
- Export functionality to download graphs as high-resolution PNGs (1920x1080)
- Graphs shown by default with toggle option

### Geographical Map
- Interactive Canada map with all provinces and territories
- Province boundaries clearly marked
- City markers with heatmap colors based on claim status
- Tooltip with pie chart breakdown on hover
- Data period indicator (last month)

### Claims Table
- Searchable by claim number, patient name, city, or status
- Filterable by status (All, Accepted, Pending, Denied)
- Sortable columns
- Real patient names (not generic placeholders)
- Fully bilingual status badges (English/French)
- Translation fallback system for robust i18n support
- Pagination support

## Data Sources

- Sample data from `data/initial_agent_sample_data_from_client/extracted_data/`
- Pending claims data from `data/pend_data/`
- Simulated data for statistics and city data in `data/simulated/`

## Development Notes

- Port: 3030 (configured in `vite.config.js`)
- All pages support bilingual switching with real-time translation updates
- Color scheme follows SunLife brand guidelines
- Responsive design for mobile and desktop
- Translation system includes fallback logic for robust language switching
- Status badges automatically update when language changes
- Patient names use realistic data instead of generic placeholders

## Recent Updates

- ✅ Fixed status translation issue in claims table - status badges now properly translate between English and French
- ✅ Replaced generic patient names with realistic patient names
- ✅ Enhanced translation system with fallback logic for robust language switching
- ✅ Improved component re-rendering on language changes
- ✅ Added direct resource bundle lookup as fallback for translations
- ✅ Integrated FastAPI backend with Azure OpenAI for intelligent chat
- ✅ Connected frontend chat widget to backend API
- ✅ Added markdown rendering support for tables, lists, and formatted text
- ✅ Implemented chat history context (last 10 request-response pairs)
- ✅ Added dashboard data context for AI responses

## Backend API

The backend is a FastAPI application located in the `backend/` directory. See `backend/README.md` for detailed setup instructions.

### Quick Start

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment and install dependencies:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Configure environment variables in `backend/.env`:
```
AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
AZURE_OPENAI_KEY=your-api-key-here
AZURE_OPENAI_MODEL=gpt-4
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

4. Run the backend server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8004
```

The API will be available at `http://localhost:8004`

## Claims Process Agent

The application includes an interactive Claims Process Agent that allows users to visualize and simulate the claims processing workflow. Click on any claim in the claims table to open the agent for that claim.

### Agent Features
- **Interactive node-based flow visualization** using React Flow
- **Drag and drop nodes** - Click and drag nodes to rearrange the layout (when layout is unlocked)
- **Scroll to pan** - Use mouse wheel or trackpad to scroll/pan the canvas up, down, left, and right
- **Zoom controls** - Use the zoom controls (+/- buttons) or pinch gesture on trackpad to zoom in/out
- **Play/Pause/Step/Reset controls** for simulation
- **Real-time status updates** (idle, active, done) with visual feedback
- **Branching logic** for NIGO vs IGO paths at the Content Validation gate
- **Auto-layout functionality** to automatically arrange nodes
- **Lock Layout toggle** to prevent accidental node movement
- **Event log** for tracking transitions
- **Side panel** showing current node, elapsed time, and next node information

### Agent Controls
- **Layout Lock**: Toggle to lock/unlock node positions
- **Auto Layout**: Automatically arrange all nodes in a grid layout
- **Play/Pause**: Start or pause the simulation
- **Step**: Advance one node at a time
- **Reset**: Reset simulation to initial state
- **Speed Slider**: Adjust simulation speed (0.25x to 3x)
- **Branch Policy**: Select branching behavior at Content Validation (Always IGO, Always NIGO once, Random 20% NIGO)

### Agent Flow
The agent visualizes the claims process from Start through CHESS:
- Start → Claim Ingestion → Claim Form Enhancement → Classification → Claim Content Validation
- At Content Validation: Branch to NIGO (Provider Notification) or IGO (Data Enrichment)
- Data Enrichment → Electronic Claim → Electronic Claim Validation → Gap Assessment → Code Conversion → Claim Data Entry → CHESS

### Agent Interaction
- **Unlocked Mode**: Left-click and drag nodes to move them; middle/right-click to pan canvas
- **Locked Mode**: Left-click and drag to pan canvas; nodes cannot be moved
- **Scrolling**: Mouse wheel scrolls/pans the canvas
- **Zooming**: Use zoom controls (+/-) or pinch gesture on trackpad
- **Node States**: 
  - Idle: Neutral dark card
  - Active: Neon light-blue background with glow (#00E5FF)
  - Done: Green background with glow (#22C55E)

## Future Enhancements

- Real-time data updates
- Advanced filtering and analytics
- User management system
- Export functionality for reports
- Additional language support
- Document chat functionality

## License

This repository contains the **Munich Re First Notice of Loss (FNOL) portal** – a React/Vite experience that helps Munich Re teams triage FNOL submissions, monitor KPIs across the US, drive a 20-stage FNOL simulator, and collaborate with an Azure OpenAI copilot.  
All customer-facing code lives in the `munich/` directory; the legacy SunLife implementation (`src/`) is kept only for historical reference.

---

## Highlights

| Area | Details |
|------|---------|
| **Branding** | Munich Re navy / white / mustard palette, responsive layout, EN/DE toggle. |
| **Dashboard** | KPI cards, Leaflet USA map, FNOL table with CHESS augmentation tags. |
| **FNOL Simulator** | React Flow DAG (20 stages), lock/auto layout, play/pause/step/reset, event log, stage messages, debug flow toggle. |
| **Chat Copilot** | Floating widget posts to FastAPI with `client: "munich"`; renders markdown tables and remembers last 10 exchanges. |
| **Sample Data** | Five FNOL scenarios (each ships with `fnol.json`, `status.json`, `outcome.txt`) plus Munich collateral PDFs. |
| **Backend** | FastAPI services (chat + PDF ingestion) already multi-tenant. |

---

## Repository Layout

```
.
├── backend/                   # FastAPI (multi-tenant chat + PDF ingestion)
├── munich/                    # Munich Re FNOL SPA
│   ├── assets/                # Logos, PDFs
│   ├── cases/                 # case{1..5}/{fnol,status,outcome}
│   ├── src/
│   │   ├── components/        # Dashboard widgets, chat, simulator
│   │   ├── pages/             # Login, Dashboard
│   │   ├── store/             # Zustand simulator store
│   │   ├── utils/             # Auth helper, FNOL data loader, layout utils
│   │   └── locales/           # en/de translations
│   └── vite.config.js
└── README.md
```

> Deploy the `munich/` directory as a standalone SPA. The backend folder is optional if you only need the UI.

---

## Dashboard Walkthrough (munich/src/pages/Dashboard.jsx)

### Authentication
- `/login` prompts for credentials (`admin / fnol2025`) and stores the token in `localStorage`.
- `ProtectedRoute` enforces authentication for `/dashboard`.

### KPI Grid
- Stats are computed from the mock FNOL cases (`generateFNOLStatistics`) – total, accepted, rejected, pending.

### USA FNOL Map
- `react-leaflet` canvas with mustard markers for Dallas, Austin, LA, SF, Seattle, NY, Miami. Tooltips include counts and severity hints.

### FNOL Table
- Searchable, sortable, CHESS augmentation label, action button to open the simulator modal.

### Chat Widget
- Munich-themed floating button.
- Sends requests to `/api/chat` with `client: "munich"` so the FastAPI service loads Munich-specific prompts, KPIs, event logs, and documents.

---

## FNOL Processing Simulator

| Feature | Description |
|---------|-------------|
| Flow | 20 deterministic stages defined in `src/data/fnolFlowData.json`. |
| State | Zustand store tracks node status, active edge, simulation state, event log, and stage messages. |
| Controls | Play / Pause / Step / Reset / Speed slider (0.25×–3×) plus Auto Layout and Lock Layout toggles. |
| Side Panel | Shows current & next stage, elapsed time, case metadata, and event log (with “View Extracted Info” links). |
| Messages | Each FNOL case includes stage-by-stage copy loaded from `status.json`; CHESS cases (Robin Noah, Bandy Morris, etc.) display bespoke messaging. |
| Debug Flow | Header button toggles to a minimal two-node canvas to confirm edges render within the modal container. |

The simulator also persists event logs (JSON) under `backend/data/event_logs/` so the chat copilot can answer questions about prior runs.

---

## Backend (FastAPI)

Located in `backend/`. Main endpoints:

1. `POST /api/chat` – Azure OpenAI chat with tenant-aware prompts (`client` field).  
2. `POST /api/pdf_ingestion_agent` – Optional PDF → OCR → Azure OpenAI JSON extraction.  
3. Event log persistence (gitignored) for later analytics or chat context.

Quick setup:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill AZURE_OPENAI_*, MISTRAL_* keys
uvicorn main:app --reload --host 0.0.0.0 --port 8004
```

---

## Frontend Setup (`munich/`)

```bash
cd munich
npm install
npm run dev        # http://localhost:3031
```

Build for production:
```bash
npm run build      # creates munich/dist
```

Deploy `munich/dist` to Azure Static Web Apps, Storage Static Website, Vercel, Netlify, etc.

---

## Data & Assets
- **Cases** live in `munich/cases/case{1..5}/` with:
  - `fnol.json`: raw FNOL payload
  - `status.json`: simulator stage messages + durations
  - `outcome.txt`: narrative summary
- **Branding** assets (logo + marketing PDF) live in `munich/assets/`.
- **Layout** logic for the simulator is centralized in `munich/src/utils/layoutUtils.js` (columns of four nodes).

---

## Roadmap Ideas

- Wire KPI widgets/map/table to live FNOL feeds or Azure Functions.
- Persist per-case node positions in localStorage.
- Embed PDF + extracted JSON viewer directly in the simulator.
- Expand chat to support retrieval over attachments and event logs.
- Add role-based auth / assignments.

---

## License

Internal prototype © Munich Re. Not licensed for public distribution.
