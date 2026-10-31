import json
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Set
from app.models.learner import ConceptMastery, EvidenceLog
from app.models.spaced_repetition import ReviewCard

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data"))

class LearnerState:
    def __init__(self, learner_id: str, concepts: List[dict]):
        self.learner_id = learner_id
        now_str = datetime.now(timezone.utc).isoformat()
        
        # Initialize Concept Mastery
        self.mastery: Dict[str, ConceptMastery] = {}
        for c in concepts:
            cid = c["id"]
            cname = c["name"]
            self.mastery[cid] = ConceptMastery(
                concept_id=cid,
                concept_name=cname,
                mastery_score=0.15,  # Unmastered prior
                state="unmastered",
                confidence=0.5,
                attempts=0,
                successes=0,
                last_updated=now_str
            )
            
        # Spaced Repetition Cards (SM-2 initialized)
        self.review_cards: Dict[str, ReviewCard] = {}
        for c in concepts:
            cid = c["id"]
            cname = c["name"]
            self.review_cards[cid] = ReviewCard(
                concept_id=cid,
                concept_name=cname,
                interval_days=1,
                repetitions=0,
                ease_factor=2.5,
                last_reviewed_at=now_str,
                next_review_at=now_str,  # Due immediately for first review
                is_due=True,
                urgency_score=1.0
            )
            
        self.evidence_history: List[EvidenceLog] = []
        self.attempted_questions: Set[str] = set()

class StateStore:
    def __init__(self):
        self._learners: Dict[str, LearnerState] = {}
        self.concepts_cache: List[dict] = []
        self.misconceptions_cache: List[dict] = []
        self.questions_cache: List[dict] = []
        self._load_static_data()

    def _load_static_data(self):
        concepts_path = os.path.join(DATA_DIR, "concepts.json")
        with open(concepts_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.concepts_cache = data.get("concepts", [])

        misc_path = os.path.join(DATA_DIR, "misconceptions.json")
        with open(misc_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.misconceptions_cache = data.get("misconceptions", [])

        q_path = os.path.join(DATA_DIR, "questions.json")
        with open(q_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.questions_cache = data.get("questions", [])

    def get_or_create_learner(self, learner_id: str) -> LearnerState:
        if learner_id not in self._learners:
            self._learners[learner_id] = LearnerState(learner_id, self.concepts_cache)
        return self._learners[learner_id]

    def get_question_by_id(self, question_id: str) -> Optional[dict]:
        for q in self.questions_cache:
            if q["id"] == question_id:
                return q
        return None

    def get_misconception_by_id(self, misc_id: str) -> Optional[dict]:
        for m in self.misconceptions_cache:
            if m["id"] == misc_id:
                return m
        return None

    def get_concept_by_id(self, concept_id: str) -> Optional[dict]:
        for c in self.concepts_cache:
            if c["id"] == concept_id:
                return c
        return None

# Singleton state instance
store = StateStore()
