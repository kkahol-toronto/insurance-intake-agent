import io
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from pypdf import PdfReader


logger = logging.getLogger(__name__)

# Ensure environment variables are available
load_dotenv()


class PDFIngestionService:
    """
    Extract data from PDF claim documents using Azure OpenAI.
    """

    def __init__(self) -> None:
        self.openai_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.openai_key = os.getenv("AZURE_OPENAI_KEY")
        self.openai_deployment = os.getenv("AZURE_OPENAI_PDF_DEPLOYMENT") or os.getenv(
            "AZURE_OPENAI_DEPLOYMENT"
        )
        self.api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

        self.configured = bool(
            self.openai_endpoint and self.openai_key and self.openai_deployment
        )

        # Load reference JSON examples to guide extraction
        reference_files = [
            Path("data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_01.json"),
            Path("data/initial_agent_sample_data_from_client/extracted_data/2025_11_03_02.json"),
            Path("data/pend_data/Scenario 1/extracted_data/Sample2.json"),
        ]
        self.reference_examples = self._load_reference_examples(reference_files)

    def process_pdf(self, pdf_bytes: bytes, file_name: str) -> Dict[str, Any]:
        """
        Extract structured JSON data from a PDF document using Azure OpenAI.
        """
        if not self.configured:
            raise ValueError(
                "Azure OpenAI credentials not configured. "
                "Please set AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_KEY, and AZURE_OPENAI_DEPLOYMENT in your environment."
            )

        text, metadata = self._extract_pdf_text(pdf_bytes)
        if not text.strip():
            raise ValueError("Unable to extract readable text from PDF.")

        messages = self._build_prompt(text, file_name, metadata)

        raw_response = self._call_azure_openai(messages)

        parsed_json, parse_error = self._safe_parse_json(raw_response)

        result: Dict[str, Any] = {
            "file_name": file_name,
            "metadata": metadata,
            "raw_response": raw_response,
            "parsed_json": parsed_json,
        }

        if parse_error:
            result["parse_error"] = parse_error

        return result

    def _extract_pdf_text(self, pdf_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
        """
        Extract raw text from the PDF using pypdf.
        """
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text_chunks: List[str] = []
        for idx, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
            except Exception as exc:  # pragma: no cover - defensive
                logger.warning("Failed to extract text from page %s: %s", idx + 1, exc)
                page_text = ""
            text_chunks.append(page_text.strip())

        # Keep only non-empty blocks and enforce a sensible upper limit to avoid overly long prompts.
        text = "\n\n".join(chunk for chunk in text_chunks if chunk)
        max_chars = int(os.getenv("PDF_INGESTION_MAX_CHARS", "20000"))
        truncated_text = text[:max_chars]

        metadata: Dict[str, Any] = {
            "page_count": len(reader.pages),
            "truncated": len(truncated_text) < len(text),
            "character_count": len(truncated_text),
            "max_chars": max_chars,
        }

        return truncated_text, metadata

    def _load_reference_examples(self, paths: List[Path]) -> List[Dict[str, Any]]:
        examples: List[Dict[str, Any]] = []
        for path in paths:
            try:
                if path.exists():
                    with path.open("r", encoding="utf-8") as handle:
                        content = json.load(handle)
                        examples.append(content)
            except Exception as exc:  # pragma: no cover - defensive
                logger.debug("Unable to load reference example %s: %s", path, exc)
        return examples[:2]  # limit to keep prompt compact

    def _build_prompt(
        self, document_text: str, file_name: str, metadata: Dict[str, Any]
    ) -> List[Dict[str, str]]:
        """
        Construct chat messages for Azure OpenAI with guidance and examples.
        """
        instructions = (
            "You are a Sun Life insurance PDF ingestion agent. "
            "Your task is to extract structured data from dental and medical claim PDFs. "
            "Return a single JSON object that mirrors the fields present in the PDF. "
            "Use the following guidelines:\n"
            "1. Key top-level sections typically include ClaimantInformation, ClaimDetails, ProviderInformation, "
            "Invoice, PrescriptionRequest, and AdditionalNotes.\n"
            "2. Within each section, include all data points that appear in the document. "
            "Use nested objects to reflect structure (e.g., addresses, items, expenses).\n"
            "3. Preserve numeric values as numbers when possible, otherwise keep strings.\n"
            "4. Use null for fields that are explicitly absent but expected.\n"
            "5. NEVER invent data that is not in the document. If unsure, omit the field or set it to null.\n"
            "6. Preserve bilingual (French/English) text when present.\n"
            "7. Output valid JSON only. Do not include commentary, markdown, or code fences.\n"
        )

        examples_snippet = ""
        if self.reference_examples:
            example_jsons = []
            for example in self.reference_examples:
                try:
                    example_jsons.append(json.dumps(example, indent=2, ensure_ascii=False))
                except TypeError:
                    continue
            if example_jsons:
                examples_snippet = (
                    "Here are examples of the desired JSON structure derived from similar documents:\n"
                    + "\n\n".join(example_jsons)
                )

        user_prompt = (
            f"Document name: {file_name}\n"
            f"Page count: {metadata.get('page_count')}\n"
            f"Characters processed: {metadata.get('character_count')} "
            f"(truncated={metadata.get('truncated')})\n\n"
            f"Document content begins below:\n{document_text}"
        )

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": instructions},
        ]

        if examples_snippet:
            messages.append({"role": "system", "content": examples_snippet})

        messages.append({"role": "user", "content": user_prompt})
        return messages

    def _call_azure_openai(self, messages: List[Dict[str, str]]) -> str:
        """
        Send the prompt to Azure OpenAI and return the raw response text.
        """
        api_endpoint = (
            f"{self.openai_endpoint.rstrip('/')}/openai/deployments/"
            f"{self.openai_deployment}/chat/completions?api-version={self.api_version}"
        )

        headers = {
            "api-key": self.openai_key,
            "Content-Type": "application/json",
        }

        payload = {
            "messages": messages,
            "max_tokens": 2000,
            "temperature": 0.2,
            "top_p": 0.9,
        }

        response = requests.post(api_endpoint, headers=headers, json=payload, timeout=60)

        if response.status_code != 200:
            logger.error("Azure OpenAI API error: %s - %s", response.status_code, response.text)
            raise RuntimeError(
                f"Azure OpenAI API error: {response.status_code} - {response.text}"
            )

        result = response.json()
        choices = result.get("choices", [])
        if not choices:
            raise RuntimeError("Azure OpenAI response did not include choices.")

        return choices[0]["message"]["content"]

    def _safe_parse_json(self, raw_response: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
        """
        Attempt to parse the LLM response as JSON and return (parsed_json, error_message).
        """
        try:
            cleaned = raw_response.strip()
            # Remove surrounding code fences if present
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.startswith("json"):
                    cleaned = cleaned[4:]
            return json.loads(cleaned), None
        except Exception as exc:
            logger.debug("Failed to parse JSON response: %s", exc)
            return None, str(exc)


