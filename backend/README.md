# SunLife Insurance Intake Portal - Backend API

FastAPI backend for the SunLife Insurance Intake Portal, providing chat functionality with dashboard data and documents using Azure OpenAI.

## Features

- **Chat Service**: Interactive chat with dashboard data and documents
- **PDF Ingestion Agent**: Upload a claim PDF and receive structured JSON output
- **Azure OpenAI Integration**: Powered by Azure OpenAI for intelligent responses
- **Dashboard Context**: Chat with claims statistics and data
- **Document Support**: Chat with insurance documents (ready for extension)
- **Chat History**: Maintains last 10 request-response pairs (20 messages) as context
- **No Fallbacks**: Requires Azure OpenAI configuration - returns clear error messages if not configured

## Setup

### Prerequisites

- Python 3.8 or higher
- Azure OpenAI account and credentials

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
   - Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   - Edit `.env` and add your Azure OpenAI credentials:
   ```
   AZURE_OPENAI_ENDPOINT=https://your-resource-name.openai.azure.com/
   AZURE_OPENAI_KEY=your-api-key-here
   AZURE_OPENAI_MODEL=gpt-4
   AZURE_OPENAI_DEPLOYMENT=gpt-4
AZURE_OPENAI_PDF_DEPLOYMENT=gpt-4o-mini    # Optional dedicated deployment for PDF ingestion
AZURE_OPENAI_API_VERSION=2024-02-15-preview
   ```

## Running the Server

### Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Production Mode

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## API Endpoints

### Health Check

```bash
GET /health
```

Returns the health status of the API and whether the chat service is configured.

### Chat

```bash
POST /api/chat
```

Chat endpoint for interacting with dashboard data and documents.

**Request Body:**
```json
{
  "message": "What are the claims statistics?",
  "chat_history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?"
    }
  ],
  "context_type": "dashboard",
  "claims_data": {
    "statistics": {
      "processedToday": 108,
      "processedWeek": 520,
      "processedMonth": 2000,
      "accepted": 82,
      "pending": 21,
      "denied": 5,
      "total": 53
    },
    "cityData": [
      {
        "city": "Toronto",
        "total": 450,
        "accepted": 340,
        "pending": 85,
        "denied": 25
      }
    ]
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on the current claims data, here are the statistics...",
  "error": null
}
```

### PDF Ingestion

```bash
POST /api/pdf-ingestion
Content-Type: multipart/form-data
```

Upload a PDF dental/medical claim document and receive structured JSON extracted by the Azure OpenAI-powered ingestion agent.

**curl example**
```bash
curl -X POST http://localhost:8000/api/pdf-ingestion \
  -F "file=@data/pend_data/Scenario\ 1/Sunlife\ Sample\ 1\ (Additional\ document).pdf"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ClaimantInformation": { "...": "..." },
    "ClaimDetails": {},
    "ProviderInformation": {},
    "Invoice": {},
    "PrescriptionRequest": {},
    "AdditionalNotes": ""
  },
  "raw_response": "{...}",
  "metadata": {
    "page_count": 4,
    "truncated": false,
    "character_count": 18750,
    "max_chars": 20000
  },
  "parse_error": null
}
```

## API Documentation

Once the server is running, you can access:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Configuration

The services use the following environment variables in `backend/.env`:

- `AZURE_OPENAI_ENDPOINT`: Azure OpenAI endpoint URL (required)
- `AZURE_OPENAI_KEY`: Azure OpenAI API key (required)
- `AZURE_OPENAI_MODEL`: Model name (default: gpt-4)
- `AZURE_OPENAI_DEPLOYMENT`: Deployment name (default: gpt-4)
- `AZURE_OPENAI_PDF_DEPLOYMENT`: Optional deployment name dedicated to PDF ingestion (falls back to `AZURE_OPENAI_DEPLOYMENT`)
- `AZURE_OPENAI_API_VERSION`: Azure OpenAI API version (default: 2024-02-15-preview)
- `PDF_INGESTION_MAX_CHARS`: Optional character limit applied when sending PDF text to the model (default: 20000)

**Note**: The service requires Azure OpenAI to be configured. If not configured, it will return clear error messages instead of fallback responses.

## CORS

The API is configured to allow requests from:
- `http://localhost:3030`
- `http://localhost:3031`
- `http://localhost:5173`

To add more origins, edit the CORS configuration in `main.py`.

## Development Notes

- **No Fallbacks**: The service requires Azure OpenAI configuration and returns clear error messages if not configured
- **Chat History**: Maintains last 10 request-response pairs (20 messages total) as context for better conversation continuity
- **Dashboard Context**: Includes claims statistics, city data, and recent claims in every request
- **Document Context**: Ready for extension to support document chat functionality
- **Markdown Support**: Frontend renders markdown responses including tables, lists, and formatted text
- **API Version**: Uses Azure OpenAI API version 2024-02-15-preview

## License

This project is proprietary software for SunLife Insurance.

