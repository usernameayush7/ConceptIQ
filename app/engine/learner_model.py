import math
from datetime import datetime, timezone
from typing import Dict, Tuple
from app.models.learner import ConceptMastery, EvidenceLog

class LearnerModelEngine:
    """
    Bayesian Knowledge Tracing (BKT) engine augmented with
    Item Difficulty, Hint Penalties, and Attempt Counts.
    """
    def __init__(
        self,
        p_transit: float = 0.15,
        p_slip: float = 0.10,
        p_guess: float = 0.25
    ):
        self.p_transit = p_transit
        self.p_slip = p_slip
        self.p_guess = p_guess

    def update_mastery(
        self,
        current_mastery: ConceptMastery,
        question_id: str,
        is_correct: bool,
        difficulty: float,
        hints_used: int = 0,
        attempt_number: int = 1,
        misconception_flagged: bool = False
    ) -> Tuple[ConceptMastery, EvidenceLog]:
        """
        Updates concept mastery score based on answer submission evidence.
        """
        prior_score = current_mastery.mastery_score
        
        # 1. Compute effective observation score [0.0, 1.0]
        if is_correct:
            # Each hint penalizes credit by 25% (min 0.25 credit)
            hint_penalty = min(0.75, hints_used * 0.25)
            # Multiple attempts penalize credit
            attempt_penalty = 1.0 if attempt_number <= 1 else (0.8 ** (attempt_number - 1))
            effective_obs = max(0.20, (1.0 - hint_penalty) * attempt_penalty)
        else:
            # If an explicit misconception was triggered, stronger penalty
            effective_obs = 0.0 if not misconception_flagged else -0.05

        # 2. Adjust Guess and Slip based on Question Difficulty
        # Higher difficulty -> lower guess probability, higher slip probability
        p_g = max(0.05, self.p_guess * (1.1 - difficulty))
        p_s = min(0.40, self.p_slip * (0.8 + difficulty))

        # 3. Bayesian Observation Update
        p_l = max(0.01, min(0.99, prior_score))
        
        # Posterior if completely correct
        numerator_corr = p_l * (1.0 - p_s)
        denom_corr = numerator_corr + (1.0 - p_l) * p_g
        posterior_correct = numerator_corr / max(1e-6, denom_corr)

        # Posterior if completely incorrect
        numerator_incorr = p_l * p_s
        denom_incorr = numerator_incorr + (1.0 - p_l) * (1.0 - p_g)
        posterior_incorrect = numerator_incorr / max(1e-6, denom_incorr)

        # Interpolate based on effective observation
        if effective_obs >= 0:
            posterior_l = effective_obs * posterior_correct + (1.0 - effective_obs) * posterior_incorrect
        else:
            # Penalize slightly extra for active misconceptions
            posterior_l = max(0.02, posterior_incorrect * 0.90)

        # 4. Transition (Learning Opportunity)
        # Students transition to learned state during successful application
        if effective_obs > 0.4:
            posterior_l = posterior_l + (1.0 - posterior_l) * (self.p_transit * effective_obs)

        posterior_score = round(max(0.02, min(0.98, posterior_l)), 4)
        delta = round(posterior_score - prior_score, 4)

        # 5. Update confidence and attempts
        total_attempts = current_mastery.attempts + 1
        total_successes = current_mastery.successes + (1 if is_correct else 0)
        confidence = round(1.0 - 0.5 * math.exp(-0.35 * total_attempts), 3)

        # 6. Determine Mastery State
        if posterior_score >= 0.75:
            state = "mastered"
        elif posterior_score >= 0.40:
            state = "learning"
        else:
            state = "unmastered"

        now_str = datetime.now(timezone.utc).isoformat()
        
        updated_mastery = ConceptMastery(
            concept_id=current_mastery.concept_id,
            concept_name=current_mastery.concept_name,
            mastery_score=posterior_score,
            state=state,
            confidence=confidence,
            attempts=total_attempts,
            successes=total_successes,
            last_updated=now_str
        )

        reason = (
            f"{'Correct' if is_correct else 'Incorrect'} answer on diff={difficulty:.2f} "
            f"(hints={hints_used}, attempt={attempt_number}"
            f"{', misconception detected' if misconception_flagged else ''}). "
            f"Mastery shifted from {prior_score:.2f} to {posterior_score:.2f}."
        )

        evidence = EvidenceLog(
            timestamp=now_str,
            question_id=question_id,
            concept_id=current_mastery.concept_id,
            is_correct=is_correct,
            hints_used=hints_used,
            attempts_count=attempt_number,
            prior_mastery=prior_score,
            posterior_mastery=posterior_score,
            delta_mastery=delta,
            reason=reason
        )

        return updated_mastery, evidence
