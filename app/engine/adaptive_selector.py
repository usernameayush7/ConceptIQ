import random
from typing import Dict, List, Optional, Tuple
from app.engine.concept_graph import ConceptGraphEngine
from app.engine.question_generator import QuestionGeneratorEngine
from app.storage.state_store import LearnerState

class AdaptiveSelectorEngine:
    def __init__(
        self,
        concept_graph: ConceptGraphEngine,
        questions_pool: List[dict]
    ):
        self.graph = concept_graph
        self.questions = questions_pool
        self.generator = QuestionGeneratorEngine()

    def select_next_question(
        self,
        learner_state: LearnerState,
        preferred_concept_id: Optional[str] = None
    ) -> Tuple[dict, dict]:
        """
        Adaptively chooses or generates the next optimal question.
        Returns (question_dict, selection_metadata).
        """
        mastery_scores = {cid: m.mastery_score for cid, m in learner_state.mastery.items()}
        topo_order = self.graph.get_topological_order()

        target_concept_id = preferred_concept_id
        selection_reason = ""

        # 1. Check for specific preferred concept
        if target_concept_id:
            # Check prerequisite mastery
            unmet = self.graph.get_unmet_prerequisites(target_concept_id, mastery_scores, threshold=0.55)
            if unmet:
                # Backtrack to weakest prerequisite!
                target_concept_id = min(unmet, key=lambda c: mastery_scores.get(c, 0.0))
                c_name = learner_state.mastery[target_concept_id].concept_name
                selection_reason = f"Prerequisite remediation: foundational concept '{c_name}' mastery is low ({mastery_scores[target_concept_id]:.2f})."
            else:
                selection_reason = f"Targeted practice for selected concept."

        # 2. Check for Spaced Repetition Due Concepts
        if not target_concept_id:
            due_cards = [c for c in learner_state.review_cards.values() if c.is_due]
            if due_cards:
                due_cards.sort(key=lambda c: c.urgency_score, reverse=True)
                target_concept_id = due_cards[0].concept_id
                selection_reason = f"Spaced repetition review due for '{due_cards[0].concept_name}' (urgency: {due_cards[0].urgency_score:.1f})."

        # 3. Zone of Proximal Development (ZPD) Selection
        if not target_concept_id:
            # Look along topological order for first concept whose prereqs are met but mastery < 0.75
            for cid in topo_order:
                score = mastery_scores.get(cid, 0.0)
                if score < 0.75 and self.graph.are_prerequisites_met(cid, mastery_scores, threshold=0.55):
                    target_concept_id = cid
                    c_name = learner_state.mastery[cid].concept_name
                    selection_reason = f"ZPD progression: Prerequisite satisfied, building mastery on '{c_name}' (current: {score:.2f})."
                    break

        # 4. Fallback to concept with lowest mastery
        if not target_concept_id:
            target_concept_id = min(topo_order, key=lambda c: mastery_scores.get(c, 0.0))
            selection_reason = "Reinforcement on lowest mastery concept."

        target_mastery = mastery_scores.get(target_concept_id, 0.15)
        
        # 5. Determine Target Difficulty
        if target_mastery < 0.40:
            target_diff_min, target_diff_max = 0.20, 0.45
            diff_label = "Easy"
        elif target_mastery < 0.70:
            target_diff_min, target_diff_max = 0.40, 0.70
            diff_label = "Medium"
        else:
            target_diff_min, target_diff_max = 0.65, 0.95
            diff_label = "Hard"

        # 6. Filter candidate questions from curated bank
        candidates = [
            q for q in self.questions
            if q.get("concept_id") == target_concept_id
            and q.get("id") not in learner_state.attempted_questions
            and target_diff_min <= q.get("difficulty", 0.5) <= target_diff_max
        ]

        # Broaden difficulty range if none found
        if not candidates:
            candidates = [
                q for q in self.questions
                if q.get("concept_id") == target_concept_id
                and q.get("id") not in learner_state.attempted_questions
            ]

        # 7. If bank exhausted or empty, generate a verified supplementary question
        is_generated = False
        if candidates:
            chosen_q = random.choice(candidates)
        else:
            chosen_q, is_generated = self._generate_supplementary_question(target_concept_id, (target_diff_min + target_diff_max) / 2.0)
            if not chosen_q:
                # If cannot generate for this specific concept, pick any from concept
                all_concept_qs = [q for q in self.questions if q.get("concept_id") == target_concept_id]
                chosen_q = random.choice(all_concept_qs) if all_concept_qs else random.choice(self.questions)

        metadata = {
            "concept_id": target_concept_id,
            "concept_name": learner_state.mastery[target_concept_id].concept_name,
            "current_concept_mastery": round(target_mastery, 2),
            "difficulty_tier": diff_label,
            "target_difficulty": chosen_q.get("difficulty", 0.5),
            "selection_reason": selection_reason,
            "is_generated_supplementary": is_generated
        }

        return chosen_q, metadata

    def _generate_supplementary_question(self, concept_id: str, difficulty: float) -> Tuple[Optional[dict], bool]:
        """Generates dynamic verified question when bank runs out."""
        try:
            if concept_id == "c5_ohms_law":
                return self.generator.generate_ohms_law_question(difficulty), True
            elif concept_id == "c8_parallel_circuits":
                return self.generator.generate_parallel_resistor_question(difficulty), True
            elif concept_id == "c9_joules_heating":
                return self.generator.generate_heating_question(difficulty), True
        except Exception:
            pass
        return None, False
