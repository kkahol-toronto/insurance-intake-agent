# SunLife Insurance Intake Portal

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
  
- **Chat Assistant**: Floating chat widget
  - Always accessible via bottom-right floating button
  - Ready for backend integration

### Design
- **Brand Colors**:
  - Marigold/Yellow: `#ECAB23` (signature brand color)
  - Deep Blue/Teal: `#003946` (primary text and backgrounds)
  - Rich Black: `#0E3846` (secondary text)
  - White: Background and contrast

- **Bilingual Support**: Full English and French translations
- **Responsive Design**: Works across desktop and mobile devices

## Technology Stack

- **Frontend**: React 18 with Vite
- **Routing**: React Router DOM
- **Internationalization**: react-i18next
- **Charts**: Recharts (Line charts, Bar charts, Pie charts)
- **Maps**: react-simple-maps with Canada provinces GeoJSON
- **Styling**: CSS with custom design system

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

## Future Enhancements

- Backend integration for chat functionality
- Real-time data updates
- Advanced filtering and analytics
- User management system
- Export functionality for reports
- Additional language support

## License

This project is proprietary software for SunLife Insurance.

## Contributors

- Development Team
