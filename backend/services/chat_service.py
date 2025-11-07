import os
import json
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()


class ChatService:
    """
    Service for chatting with dashboard data and documents using Azure OpenAI
    """
    
    def __init__(self):
        # Load environment variables
        self.openai_endpoint = os.getenv('AZURE_OPENAI_ENDPOINT')
        self.openai_key = os.getenv('AZURE_OPENAI_KEY')
        self.openai_model = os.getenv('AZURE_OPENAI_MODEL', 'gpt-4')
        self.openai_deployment = os.getenv('AZURE_OPENAI_DEPLOYMENT', 'gpt-4')
        self.configured = bool(self.openai_endpoint and self.openai_key)
        
        if not self.configured:
            print("Warning: Azure OpenAI credentials not configured. Chat functionality will use fallback responses.")
    
    def chat(self, user_message: str, chat_history: List[Dict[str, str]] = None, 
             context_type: str = "dashboard", document_id: Optional[int] = None,
             claims_data: Optional[Dict[str, Any]] = None,
             event_log: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """
        Chat with dashboard data or documents
        
        Args:
            user_message: User's message
            chat_history: Previous chat messages
            context_type: "dashboard" or "document"
            document_id: Document ID if chatting with a document
            claims_data: Claims data for dashboard context
            
        Returns:
            Dictionary with success, response, and error fields
        """
        try:
            # Prepare the system prompt based on context type
            if context_type == "dashboard":
                system_prompt = self._create_dashboard_prompt(claims_data, event_log)
            elif context_type == "document":
                system_prompt = self._create_document_prompt(document_id)
            else:
                system_prompt = self._create_general_prompt()
            
            # Prepare messages for OpenAI
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add chat history (last 10 request-response pairs = 20 messages total)
            if chat_history:
                # Limit to last 20 messages (10 conversations = 10 pairs = 20 messages)
                # This ensures we keep the last 10 request-response pairs as context
                limited_history = chat_history[-20:] if len(chat_history) > 20 else chat_history
                messages.extend(limited_history)
            
            # Add current user message
            messages.append({"role": "user", "content": user_message})
            
            # Call Azure OpenAI - no fallbacks, must be configured
            if not self.configured:
                return {
                    "success": False,
                    "error": "Azure OpenAI is not configured. Please set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY in your .env file."
                }
            
            try:
                response = self._call_azure_openai(messages)
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Azure OpenAI API error: {str(e)}"
                }
            
            return {
                "success": True,
                "response": response
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Error processing chat request: {str(e)}"
            }
    
    def _create_dashboard_prompt(self, claims_data: Optional[Dict[str, Any]] = None, 
                                  event_log: Optional[List[Dict[str, Any]]] = None) -> str:
        """
        Create a system prompt for dashboard chat
        """
        base_prompt = """You are an intelligent assistant for SunLife Insurance Claims Processing Dashboard. 
You help users understand and analyze insurance claims data, statistics, and processing information.

You can help with:
1. Explaining claims statistics (processed, accepted, pending, denied)
2. Analyzing geographical distribution of claims
3. Understanding claim details and patterns
4. Answering questions about claims processing
5. Providing insights about claim trends
6. Helping with data interpretation and analysis

Instructions:
1. Be helpful and accurate in your responses
2. Use the provided claims data when available
3. Provide specific numbers and statistics when relevant
4. Keep responses concise but informative
5. If asked about something not in the data, say so clearly
6. Format responses with markdown for better readability
7. Use emojis sparingly to enhance readability (✅ accepted, ⏳ pending, ❌ denied)
8. When presenting data in tables or lists, ALWAYS use proper markdown table format:
   - Use markdown tables (| column | column |) for tabular data
   - Use markdown lists (- or 1.) for sequential data
   - Use bold (**text**) for emphasis on numbers or key points
   - Ensure tables are properly formatted with headers and alignment

Please help the user understand and analyze their insurance claims data."""

        prompt_parts = [base_prompt]
        
        claims_data = claims_data if isinstance(claims_data, dict) else None
        event_log = event_log if isinstance(event_log, list) else None

        if claims_data:
            # Add claims data context
            claims_summary = self._format_claims_data_summary(claims_data)
            prompt_parts.append(f"\nCurrent Claims Data Summary:\n{claims_summary}")
        
        if event_log:
            # Add event log context
            event_log_summary = self._format_event_log_summary(event_log)
            prompt_parts.append(f"\nClaims Process Agent Activity Log:\n{event_log_summary}")
            prompt_parts.append("\nUse the activity log to answer questions about the claims process agent stages, actions taken, extracted information, branching decisions, and outcomes.")
        
        if claims_data or event_log:
            prompt_parts.append("\nUse this data to provide accurate and relevant responses.")
        
        return "\n".join(prompt_parts)
    
    def _format_claims_data_summary(self, claims_data: Dict[str, Any]) -> str:
        """
        Format claims data for the prompt
        """
        if not isinstance(claims_data, dict):
            return "No claims statistics available."

        summary_parts = []
        
        # Statistics
        if "statistics" in claims_data and isinstance(claims_data.get("statistics"), dict):
            stats = claims_data["statistics"]
            summary_parts.append("Statistics:")
            summary_parts.append(f"  - Processed Today: {stats.get('processedToday', 0)}")
            summary_parts.append(f"  - Processed This Week: {stats.get('processedWeek', 0)}")
            summary_parts.append(f"  - Processed This Month: {stats.get('processedMonth', 0)}")
            summary_parts.append(f"  - Accepted Claims: {stats.get('accepted', 0)}")
            summary_parts.append(f"  - Pending Claims: {stats.get('pending', 0)}")
            summary_parts.append(f"  - Denied Claims: {stats.get('denied', 0)}")
            summary_parts.append(f"  - Total Claims: {stats.get('total', 0)}")
        
        # City data
        if "cityData" in claims_data and isinstance(claims_data.get("cityData"), list):
            city_data = claims_data["cityData"]
            if city_data:
                summary_parts.append("\nCity-wise Distribution:")
                for city in city_data[:10]:  # Limit to top 10 cities
                    city_name = city.get("city", "Unknown")
                    total = city.get("total", 0)
                    accepted = city.get("accepted", 0)
                    pending = city.get("pending", 0)
                    denied = city.get("denied", 0)
                    summary_parts.append(f"  - {city_name}: Total={total}, Accepted={accepted}, Pending={pending}, Denied={denied}")
        
        # Recent claims
        if "recentClaims" in claims_data and isinstance(claims_data.get("recentClaims"), list):
            recent = claims_data["recentClaims"]
            if recent:
                summary_parts.append("\nRecent Claims (sample):")
                for claim in recent[:5]:  # Limit to 5 recent claims
                    claim_num = claim.get("claimNumber", "Unknown")
                    patient = claim.get("patientName", "Unknown")
                    status = claim.get("status", "Unknown")
                    city = claim.get("city", "Unknown")
                    amount = claim.get("amount", 0)
                    summary_parts.append(f"  - {claim_num}: {patient} ({status}) - {city} - ${amount}")
        
        return "\n".join(summary_parts)
    
    def _format_event_log_summary(self, event_log: List[Dict[str, Any]]) -> str:
        """
        Format event log for the prompt
        """
        if not isinstance(event_log, list) or not event_log:
            return "No agent activity events recorded yet."

        summary_parts = []
        summary_parts.append(f"Total Events Recorded: {len(event_log)}")
        summary_parts.append("\nChronological Activity Timeline (latest last):")

        for raw_event in event_log:
            if not isinstance(raw_event, dict):
                logger.debug("Skipping non-dict event log entry: %s", raw_event)
                continue

            event = raw_event
            timestamp = event.get("timestamp", 0)
            from_node = event.get("fromNodeId")
            to_node = event.get("toNodeId")
            reason = event.get("reason", "")
            action = event.get("action")
            
            time_str = datetime.fromtimestamp(timestamp / 1000).strftime("%H:%M:%S") if timestamp else "N/A"
            
            if from_node:
                event_desc = f"{from_node} → {to_node}"
            else:
                event_desc = f"Started: {to_node}"
            
            summary_parts.append(f"  [{time_str}] {event_desc}")
            if reason:
                summary_parts.append(f"    reason: {reason}")
            if action:
                summary_parts.append(f"    action: {action}")
            action_data = event.get("actionData")
            if action_data:
                try:
                    formatted_data = json.dumps(action_data, indent=2)
                except (TypeError, ValueError) as exc:
                    logger.debug("Unable to serialize actionData: %s (%s)", action_data, exc)
                    formatted_data = str(action_data)
                summary_parts.append("    actionData:")
                for line in formatted_data.splitlines():
                    summary_parts.append(f"      {line}")
        
        return "\n".join(summary_parts)
    
    def _create_document_prompt(self, document_id: Optional[int] = None) -> str:
        """
        Create a system prompt for document chat
        """
        return """You are an intelligent document assistant for SunLife Insurance. 
You help users understand and analyze insurance claim documents, forms, and related paperwork.

You can help with:
1. Extracting information from documents
2. Understanding document content
3. Answering questions about document details
4. Identifying key information in forms
5. Explaining document structure and purpose

Instructions:
1. Be helpful and accurate in your responses
2. Use the provided document content when available
3. Provide specific quotes or references when possible
4. Keep responses concise but informative
5. If asked about something not in the document, say so clearly
6. Format responses with markdown for better readability

Please help the user understand and analyze their insurance documents."""
    
    def _create_general_prompt(self) -> str:
        """
        Create a general system prompt
        """
        return """You are an intelligent assistant for SunLife Insurance Claims Processing Portal. 
You help users with questions about insurance claims, processing, and general inquiries.

Instructions:
1. Be helpful and accurate in your responses
2. Keep responses concise but informative
3. Format responses with markdown for better readability
4. If you don't know something, say so clearly

Please help the user with their questions."""
    
    def _call_azure_openai(self, messages: List[Dict[str, str]]) -> str:
        """
        Call Azure OpenAI API with the prepared messages
        """
        try:
            # Prepare the API endpoint
            api_endpoint = f"{self.openai_endpoint.rstrip('/')}/openai/deployments/{self.openai_deployment}/chat/completions?api-version=2024-02-15-preview"
            
            # Headers
            headers = {
                'api-key': self.openai_key,
                'Content-Type': 'application/json'
            }
            
            # Request payload
            payload = {
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7,
                "top_p": 0.9,
                "frequency_penalty": 0,
                "presence_penalty": 0
            }
            
            # Make the request
            response = requests.post(
                api_endpoint,
                headers=headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Azure OpenAI API error: {response.status_code} - {response.text}")
            
            result = response.json()
            
            # Extract the response content
            if 'choices' in result and len(result['choices']) > 0:
                return result['choices'][0]['message']['content']
            else:
                raise Exception("No response content from Azure OpenAI")
                
        except Exception as e:
            raise Exception(f"Error calling Azure OpenAI: {str(e)}")
    

