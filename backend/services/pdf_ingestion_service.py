import base64
import io
import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import requests
from dotenv import load_dotenv
from pypdf import PdfReader
import pypdfium2 as pdfium
from PIL import Image


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
        self.include_text = (
            os.getenv("PDF_INGESTION_INCLUDE_TEXT", "true").strip().lower() != "false"
        )
        self.use_mistral_ocr = (
            os.getenv("PDF_INGESTION_USE_MISTRAL", "false").strip().lower() == "true"
        )
        self.mistral_endpoint = os.getenv(
            "MISTRAL_OCR_ENDPOINT",
            "https://mirakalous-ai-rnd.services.ai.azure.com/providers/mistral/azure/ocr",
        )
        self.mistral_key = os.getenv("MISTRAL_KEY")

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
        metadata["text_source"] = "pypdf"

        if (
            self.include_text
            and self.use_mistral_ocr
            and self.mistral_endpoint
            and self.mistral_key
        ):
            mistral_text = self._call_mistral_document_ai(pdf_bytes)
            if mistral_text:
                text = mistral_text
                metadata["text_source"] = "mistral_document_ai"
            else:
                metadata["ocr_warning"] = "Mistral OCR failed; falling back to PyPDF text."
        page_images, image_info = self._render_pdf_images(pdf_bytes)
        metadata.update(image_info)
        if self.include_text and not text.strip():
            raise ValueError("Unable to extract readable text from PDF.")

        prompt_text = text if self.include_text else ""

        messages = self._build_prompt(prompt_text, file_name, metadata, page_images)

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

    def _render_pdf_images(self, pdf_bytes: bytes) -> Tuple[List[str], Dict[str, Any]]:
        """
        Render PDF pages into base64-encoded JPEG images for multimodal extraction.
        """
        images: List[str] = []
        image_info: Dict[str, Any] = {
            "rendered_page_count": 0,
            "max_pages": 0,
            "image_resolution": None,
        }
        try:
            pdf = pdfium.PdfDocument(io.BytesIO(pdf_bytes))
            total_pages = len(pdf)
            max_pages = int(os.getenv("PDF_INGESTION_MAX_PAGES", "3"))
            image_info["max_pages"] = max_pages

            scale = float(os.getenv("PDF_INGESTION_RENDER_SCALE", "2.0"))

            for index in range(min(total_pages, max_pages)):
                page = pdf[index]
                bitmap = page.render(
                    scale=scale,
                    rotation=0,
                    crop=(0, 0, 0, 0),
                    color=pdfium.Colorspace.RGB,
                    greyscale=False,
                    annot=False,
                )
                pil_image: Image.Image = bitmap.to_pil()

                buffer = io.BytesIO()
                pil_image.save(buffer, format="JPEG", quality=85)
                encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")
                images.append(encoded)

                if image_info["image_resolution"] is None:
                    image_info["image_resolution"] = {
                        "width": pil_image.width,
                        "height": pil_image.height,
                        "scale": scale,
                    }

                page.close()
                pil_image.close()
                bitmap.close()

            pdf.close()
            image_info["rendered_page_count"] = len(images)
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to render PDF pages for vision prompt: %s", exc)

        return images, image_info

    def _call_mistral_document_ai(self, pdf_bytes: bytes) -> Optional[str]:
        """
        Use Azure-hosted Mistral Document AI to perform OCR on the PDF.
        """
        try:
            pdf_base64 = base64.b64encode(pdf_bytes).decode("utf-8")
            payload = {
                "model": "mistral-document-ai-2505",
                "document": {
                    "type": "document_url",
                    "document_url": f"data:application/pdf;base64,{pdf_base64}",
                },
                "include_image_base64": False,
            }

            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.mistral_key}",
            }

            response = requests.post(
                self.mistral_endpoint,
                headers=headers,
                json=payload,
                timeout=120,
            )

            if response.status_code != 200:
                logger.warning(
                    "Mistral OCR error: %s - %s", response.status_code, response.text
                )
                return None

            result = response.json()
            text_fragments: List[str] = []

            if isinstance(result, dict):
                output = result.get("output")
                if isinstance(output, dict):
                    primary_text = output.get("text") or output.get("markdown")
                    if isinstance(primary_text, str):
                        text_fragments.append(primary_text)

                    pages_output = output.get("pages")
                    if isinstance(pages_output, list):
                        for page in pages_output:
                            if isinstance(page, dict):
                                page_text = page.get("text") or page.get("markdown")
                                if isinstance(page_text, str):
                                    text_fragments.append(page_text)

                pages = result.get("pages")
                if isinstance(pages, list):
                    for page in pages:
                        if isinstance(page, dict):
                            page_text = page.get("text") or page.get("markdown")
                            if isinstance(page_text, str):
                                text_fragments.append(page_text)

            combined = "\n\n".join(
                fragment.strip() for fragment in text_fragments if isinstance(fragment, str)
            )
            return combined.strip() or None

        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to call Mistral Document AI: %s", exc)
        return None

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
        self,
        document_text: str,
        file_name: str,
        metadata: Dict[str, Any],
        page_images: List[str],
    ) -> List[Dict[str, Any]]:
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

        if self.include_text:
            user_prompt = (
                f"Document name: {file_name}\n"
                f"Page count: {metadata.get('page_count')}\n"
                f"Characters processed: {metadata.get('character_count')} "
                f"(truncated={metadata.get('truncated')})\n\n"
                f"Document content begins below:\n{document_text}"
            )
        else:
            user_prompt = (
                f"Document name: {file_name}\n"
                f"Page count: {metadata.get('page_count')}\n"
                "Text extraction was deliberately skipped. "
                "Use only the supplied page images to read the document and extract every data field. "
                "Return the structured JSON exactly as specified in the instructions."
            )

        system_content: List[Dict[str, str]] = [{"type": "text", "text": instructions}]
        if examples_snippet:
            system_content.append({"type": "text", "text": examples_snippet})

        user_content: List[Dict[str, Any]] = [{"type": "text", "text": user_prompt}]

        for idx, image_b64 in enumerate(page_images):
            user_content.append(
                {
                    "type": "image_base64",
                    "image_base64": image_b64,
                    "mime_type": "image/jpeg",
                    "page_index": idx,
                }
            )

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": user_content},
        ]
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


