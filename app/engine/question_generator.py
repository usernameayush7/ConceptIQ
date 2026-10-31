import random
import uuid
from typing import Dict, Optional, Tuple

class QuestionGeneratorEngine:
    """
    Algorithmic and parameterized question generator for Class 10 Electricity
    with automated mathematical verification.
    """

    def generate_ohms_law_question(self, difficulty: float = 0.5) -> dict:
        """Generates a verified Ohm's law question."""
        v_candidates = [6, 12, 24, 48, 60, 120, 220, 240]
        r_candidates = [2, 3, 4, 5, 6, 8, 10, 12, 15, 20]
        
        v = random.choice(v_candidates)
        r = random.choice(r_candidates)
        correct_i = round(v / r, 2)

        # Distractors
        d_product = round(v * r, 2)
        d_inverse = round(r / v, 2)
        d_random = round(correct_i * 2.0, 2)

        options_pool = [
            (f"{correct_i} A", True, None),
            (f"{d_product} A", False, None),
            (f"{d_inverse} A", False, None),
            (f"{d_random} A", False, None)
        ]
        random.shuffle(options_pool)
        
        keys = ["A", "B", "C", "D"]
        options = {}
        correct_key = "A"
        distractor_map = {}

        for idx, (text, is_corr, misc) in enumerate(options_pool):
            k = keys[idx]
            options[k] = text
            if is_corr:
                correct_key = k
            elif misc:
                distractor_map[k] = misc

        q_dict = {
            "id": f"gen_ohms_{uuid.uuid4().hex[:6]}",
            "concept_id": "c5_ohms_law",
            "difficulty": difficulty,
            "text": f"An electric appliance of resistance {r} Ω is connected across a {v} V potential difference. What current flows through it?",
            "options": options,
            "correct_option": correct_key,
            "explanation": f"Using Ohm's Law V = I * R, I = V / R = {v} / {r} = {correct_i} A.",
            "hints": [
                "Use Ohm's Law: V = I * R.",
                f"Divide {v} V by {r} Ω."
            ],
            "misconception_distractors": distractor_map
        }
        
        self.verify_question(q_dict, target_value=correct_i, formula=lambda: v / r)
        return q_dict

    def generate_parallel_resistor_question(self, difficulty: float = 0.6) -> dict:
        """Generates a verified Resistors in Parallel question."""
        # Pairs that yield clean integer equivalents
        clean_pairs = [
            (6, 3, 2),
            (12, 4, 3),
            (10, 40, 8),
            (20, 5, 4),
            (15, 30, 10),
            (10, 10, 5)
        ]
        r1, r2, req = random.choice(clean_pairs)
        
        d_series = r1 + r2  # Common misconception: student adds them directly
        d_half = round((r1 + r2) / 2, 1)
        d_diff = abs(r1 - r2)

        options_pool = [
            (f"{req} Ω", True, None),
            (f"{d_series} Ω", False, "MISC_PARALLEL_ADDITION"),
            (f"{d_half} Ω", False, None),
            (f"{d_diff} Ω", False, None)
        ]
        random.shuffle(options_pool)

        keys = ["A", "B", "C", "D"]
        options = {}
        correct_key = "A"
        distractor_map = {}

        for idx, (text, is_corr, misc) in enumerate(options_pool):
            k = keys[idx]
            options[k] = text
            if is_corr:
                correct_key = k
            elif misc:
                distractor_map[k] = misc

        q_dict = {
            "id": f"gen_parallel_{uuid.uuid4().hex[:6]}",
            "concept_id": "c8_parallel_circuits",
            "difficulty": difficulty,
            "text": f"Two resistors of values {r1} Ω and {r2} Ω are connected in parallel. Calculate their equivalent resistance.",
            "options": options,
            "correct_option": correct_key,
            "explanation": f"In parallel: 1/Rp = 1/{r1} + 1/{r2}. Solving yields Rp = ({r1} * {r2}) / ({r1} + {r2}) = {req} Ω.",
            "hints": [
                "Use the reciprocal formula: 1/Rp = 1/R1 + 1/R2.",
                "Remember that equivalent parallel resistance is always smaller than either branch."
            ],
            "misconception_distractors": distractor_map
        }

        self.verify_question(q_dict, target_value=req, formula=lambda: (r1 * r2) / (r1 + r2))
        return q_dict

    def generate_heating_question(self, difficulty: float = 0.65) -> dict:
        """Generates a verified Joule's Heating question."""
        i = random.choice([2, 3, 4, 5])
        r = random.choice([5, 10, 20])
        t = random.choice([1, 2, 5]) # seconds
        heat = (i ** 2) * r * t

        d_linear_i = i * r * t # forgot squaring current
        d_cube = (i ** 3) * r * t
        d_double = heat * 2

        options_pool = [
            (f"{heat} J", True, None),
            (f"{d_linear_i} J", False, None),
            (f"{d_cube} J", False, None),
            (f"{d_double} J", False, None)
        ]
        random.shuffle(options_pool)

        keys = ["A", "B", "C", "D"]
        options = {}
        correct_key = "A"
        distractor_map = {}

        for idx, (text, is_corr, misc) in enumerate(options_pool):
            k = keys[idx]
            options[k] = text
            if is_corr:
                correct_key = k
            elif misc:
                distractor_map[k] = misc

        q_dict = {
            "id": f"gen_heat_{uuid.uuid4().hex[:6]}",
            "concept_id": "c9_joules_heating",
            "difficulty": difficulty,
            "text": f"A current of {i} A flows through a resistor of {r} Ω for {t} second(s). Calculate the heat produced.",
            "options": options,
            "correct_option": correct_key,
            "explanation": f"According to Joule's Law of Heating, H = I^2 * R * t = ({i})^2 * {r} * {t} = {heat} J.",
            "hints": [
                "Recall Joule's Law: H = I^2 * R * t.",
                f"Square the current {i}^2 before multiplying by R and t."
            ],
            "misconception_distractors": distractor_map
        }

        self.verify_question(q_dict, target_value=heat, formula=lambda: (i ** 2) * r * t)
        return q_dict

    def verify_question(self, question: dict, target_value: float, formula) -> bool:
        """
        Automated verification:
        1. Confirms 4 unique options
        2. Validates mathematical correctness of target calculation against correct option text
        3. Confirms non-empty explanation and hints
        """
        options = question.get("options", {})
        if len(options) != 4 or len(set(options.values())) != 4:
            raise ValueError("Verification failed: Options must contain 4 distinct values.")

        correct_key = question.get("correct_option")
        if correct_key not in options:
            raise ValueError(f"Verification failed: Correct option {correct_key} not in options.")

        expected_val = formula()
        if abs(expected_val - target_value) > 1e-4:
            raise ValueError(f"Verification failed: Computed value {expected_val} differs from target {target_value}.")

        correct_str = options[correct_key]
        if str(round(target_value, 2)) not in correct_str and str(int(target_value)) not in correct_str:
            raise ValueError(f"Verification failed: Target value {target_value} not in chosen correct option string '{correct_str}'.")

        return True
