import re
import os
import json
import httpx
from typing import Dict, List, Optional
from app.models.misconception import MisconceptionDetectionResult

class MisconceptionEngine:
    def __init__(self, misconceptions_data: List[dict]):
        self.misconceptions = misconceptions_data
        self.misc_by_id = {m["id"]: m for m in misconceptions_data}
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")

    def check_option_distractor(
        self,
        question: dict,
        selected_option: str
    ) -> Optional[MisconceptionDetectionResult]:
        """
        Rule 1: Direct distractor analysis based on curated question distractor mapping.
        """
        distractor_map = question.get("misconception_distractors", {})
        misc_id = distractor_map.get(selected_option)
        
        if misc_id and misc_id in self.misc_by_id:
            misc = self.misc_by_id[misc_id]
            return MisconceptionDetectionResult(
                detected=True,
                misconception_id=misc_id,
                misconception_name=misc["name"],
                confidence=0.92,
                evidence=f"Selected distractor option '{selected_option}' which reflects: {misc['name']}",
                remediation=misc["remediation"]
            )
        return None

    def analyze_explanation_text(
        self,
        explanation_text: str,
        concept_id: Optional[str] = None
    ) -> MisconceptionDetectionResult:
        """
        Rule 2 + LLM: Analyzes natural language explanation for conceptual misunderstandings.
        Uses keyword-pattern heuristic by default, and enhances with Gemini API if GEMINI_API_KEY is configured.
        """
        if not explanation_text or len(explanation_text.strip()) < 4:
            return MisconceptionDetectionResult(
                detected=False,
                confidence=0.0,
                evidence="No explanation provided."
            )

        text_lower = explanation_text.lower()
        
        # Candidate misconceptions to match against
        candidates = self.misconceptions
        if concept_id:
            concept_candidates = [m for m in self.misconceptions if m.get("concept_id") == concept_id]
            if concept_candidates:
                candidates = concept_candidates

        # 1. First evaluate rule-based pattern triggers
        for misc in candidates:
            triggers = misc.get("trigger_keywords", [])
            for trigger in triggers:
                if re.search(r'\b' + re.escape(trigger.lower()) + r'\b', text_lower):
                    return MisconceptionDetectionResult(
                        detected=True,
                        misconception_id=misc["id"],
                        misconception_name=misc["name"],
                        confidence=0.88,
                        evidence=f"Detected conceptual misconception trigger phrase: '{trigger}' in explanation.",
                        remediation=misc["remediation"]
                    )

        # 2. If GEMINI_API_KEY is available, call Gemini for advanced semantic reasoning
        if self.gemini_api_key:
            llm_result = self._call_gemini_analyzer(explanation_text, candidates)
            if llm_result:
                return llm_result

        # 3. Fallback semantic heuristic: require presence of misconception-specific discriminator phrases
        # Avoid generic false positives like "current is constant in series"
        false_positive_guardrails = [
            "charge conservation", "current is constant in series",
            "identical in series", "same current", "equal brightness"
        ]
        if any(guard in text_lower for guard in false_positive_guardrails):
            return MisconceptionDetectionResult(
                detected=False,
                confidence=0.05,
                evidence="Valid scientific reasoning principles detected."
            )

        return MisconceptionDetectionResult(
            detected=False,
            confidence=0.10,
            evidence="No known misconception detected in reasoning text."
        )

    def _call_gemini_analyzer(
        self,
        explanation_text: str,
        candidates: List[dict]
    ) -> Optional[MisconceptionDetectionResult]:
        """Calls Gemini API for deep semantic reasoning when configured."""
        try:
            prompt = (
                "You are an expert Physics educational evaluator. Analyze this Class 10 student's explanation.\n"
                f"Student Explanation: \"{explanation_text}\"\n\n"
                "Known Misconceptions:\n"
                + "\n".join([f"- {m['id']}: {m['name']} ({m['description']})" for m in candidates])
                + "\n\n"
                "Respond strictly with valid JSON with keys: "
                "{\"detected\": bool, \"misconception_id\": str or null, \"confidence\": float (0.0 to 1.0), \"evidence\": str, \"remediation\": str}"
            )
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.gemini_api_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
            }
            with httpx.Client(timeout=4.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    raw_content = res.json()["candidates"][0]["content"]["parts"][0]["text"]
                    data = json.loads(raw_content)
                    if data.get("detected"):
                        misc_id = data.get("misconception_id")
                        misc_name = self.misc_by_id.get(misc_id, {}).get("name", "Identified Misconception")
                        return MisconceptionDetectionResult(
                            detected=True,
                            misconception_id=misc_id,
                            misconception_name=misc_name,
                            confidence=float(data.get("confidence", 0.85)),
                            evidence=data.get("evidence", ""),
                            remediation=data.get("remediation", self.misc_by_id.get(misc_id, {}).get("remediation", ""))
                        )
        except Exception:
            # Fallback gracefully to rule engine
            pass
        return None
