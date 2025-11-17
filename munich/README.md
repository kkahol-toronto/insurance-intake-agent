# Munich Re FNOL Processing Portal

A complete portal for Munich Re to process First Notice of Loss (FNOL) claims with a 20-stage automated workflow.

## Features

- **Dashboard**: Overview of FNOL cases with statistics and geographical distribution
- **USA Map**: Interactive map showing cases by state and city
- **FNOL Table**: Searchable and sortable table of all cases
- **20-Stage Simulator**: Visual workflow simulator for processing FNOL cases
- **Bilingual Support**: English and German (EN/DE)

## Color Theme

- **Navy Blue**: Primary background (`#003366`)
- **White**: Content backgrounds and text
- **Mustard**: Accent color (`#FFB347`)

## Setup

1. Install dependencies:
```bash
cd munich
npm install
```

2. Start development server:
```bash
npm run dev
```

The portal will be available at `http://localhost:3031`

## Case Data

Cases are loaded from the `cases/` folder:
- `case1/fnol.json` - Input data
- `case1/status.json` - 20-stage processing status
- `case1/outcome.txt` - Case summary

## Structure

```
munich/
├── src/
│   ├── components/      # React components
│   ├── pages/          # Page components
│   ├── utils/          # Data utilities
│   ├── locales/        # Translations
│   └── assets/         # Static assets
├── cases/              # Case data (5 cases)
└── package.json
```

## Authentication

Default credentials:
- Username: `pallavi`, `kanav`, `devesh`, `pankaj`, or `divvijay`
- Password: `nttdata`

