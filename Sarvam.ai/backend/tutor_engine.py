import json
import logging
import re
from typing import Dict, Any, List, Optional
from backend.sarvam_client import SarvamClient

logger = logging.getLogger("tutor_engine")

PERSONAS = {
    "priya": {
        "name": "Prof. Priya Sharma",
        "title": "Senior STEM & Physics Educator",
        "speaker": "meera",
        "language_code": "hi-IN",
        "style": "Warm, encouraging, uses vivid real-world analogies and visual whiteboard demonstrations."
    },
    "aryan": {
        "name": "Dr. Aryan Patel",
        "title": "Computer Science & AI Specialist",
        "speaker": "amartya",
        "language_code": "en-IN",
        "style": "Analytical, structured, uses code visualizers and interactive algorithm animations."
    },
    "anushka": {
        "name": "Tutor Anushka Rao",
        "title": "Pure Mathematics & Calculus Mentor",
        "speaker": "anushka",
        "language_code": "hi-IN",
        "style": "Energetic, intuitive, breaks complex geometry and equations into step-by-step visual proofs."
    },
    "shubh": {
        "name": "Mentor Shubh Verma",
        "title": "Indian History & Multilingual Scholar",
        "speaker": "shubh",
        "language_code": "hi-IN",
        "style": "Storyteller, engaging cultural context, connects past events to modern technology."
    }
}

DEMO_KNOWLEDGE_BASE = {
    "projectile": {
        "title": "Projectile Motion (प्रक्षेप्य गति)",
        "spoken_text": "प्रक्षेप्य गति में कोई भी वस्तु गुरुत्वाकर्षण बल के प्रभाव में एक परवलयाकार (Parabolic) पथ पर गति करती है। जब आप गेंद को किसी कोण थीटा पर फेंकते हैं, तो क्षैतिज वेग स्थिर रहता है जबकि ऊर्ध्वाधर वेग गुरुत्वाकर्षण त्वरण g के कारण बदलता है। आइए इसे व्हाइटबोर्ड पर लाइव सिमुलेशन से देखते हैं!",
        "avatar_gesture": "point_whiteboard",
        "avatar_emotion": "enthusiastic",
        "whiteboard": {
            "title": "Projectile Motion & Kinematics",
            "notes": [
                "क्षैतिज गति (Horizontal motion): Vx = u * cos(θ) [स्थिर वेग, no acceleration]",
                "ऊर्ध्वाधर गति (Vertical motion): Vy = u * sin(θ) - g*t",
                "अधिकतम ऊंचाई (Max Height): H = (u² * sin²(θ)) / (2g)",
                "क्षैतिज परास (Horizontal Range): R = (u² * sin(2θ)) / g (अधिकतम 45° पर)"
            ],
            "math_latex": "R = \\frac{u^2 \\sin(2\\theta)}{g}, \\quad H = \\frac{u^2 \\sin^2(\\theta)}{2g}",
            "diagram_mermaid": "graph LR\n  A[Launch (u, θ)] --> B[Peak (Vy=0)]\n  B --> C[Impact Ground]\n  style A fill:#38bdf8,stroke:#0284c7\n  style B fill:#f59e0b,stroke:#d97706\n  style C fill:#10b981,stroke:#059669",
            "interactive_demo": "projectile"
        },
        "adaptive_quiz": {
            "question": "यदि किसी प्रक्षेप्य को अधिकतम क्षैतिज दूरी (Maximum Range) तक भेजना हो, तो प्रक्षेपण कोण (θ) कितना होना चाहिए?",
            "options": ["30°", "45°", "60°", "90°"],
            "correct_index": 1,
            "hint": "sin(2θ) का मान अधिकतम 1 तब होता है जब 2θ = 90° हो।",
            "difficulty": "foundation"
        },
        "progress_update": {
            "concept_learned": "Projectile Motion Equations & Range",
            "mastery_delta": 15
        }
    },
    "trigonometry": {
        "title": "Pythagoras Theorem & Trigonometry (त्रिकोणमिति)",
        "spoken_text": "त्रिकोणमिति समकोण त्रिभुज की भुजाओं और कोणों के बीच का संबंध है। पाइथागोरस प्रमेय के अनुसार, कर्ण का वर्ग अन्य दो भुजाओं के वर्गों के योग के बराबर होता है। साथ ही साइन, कॉस और टैन इन्हीं अनुपातों को दर्शाते हैं।",
        "avatar_gesture": "explain",
        "avatar_emotion": "encouraging",
        "whiteboard": {
            "title": "Pythagoras & Fundamental Trigonometry",
            "notes": [
                "समकोण त्रिभुज (Right-Angled Triangle): हाइपोटेन्यूज़ (h), लम्ब (p), आधार (b)",
                "पाइथागोरस सूत्र: h² = p² + b²",
                "sin(θ) = p / h (लम्ब / कर्ण)",
                "cos(θ) = b / h (आधार / कर्ण)",
                "tan(θ) = p / b = sin(θ) / cos(θ)"
            ],
            "math_latex": "a^2 + b^2 = c^2, \\quad \\sin^2(\\theta) + \\cos^2(\\theta) = 1",
            "diagram_mermaid": "graph TD\n  Hypotenuse[Hypotenuse c] --> Base[Base a]\n  Hypotenuse --> Perpendicular[Perpendicular b]\n  style Hypotenuse fill:#a855f7,stroke:#9333ea\n  style Base fill:#3b82f6,stroke:#2563eb\n  style Perpendicular fill:#ec4899,stroke:#db2777",
            "interactive_demo": "trigonometry"
        },
        "adaptive_quiz": {
            "question": "यदि किसी समकोण त्रिभुज का आधार 3 सेमी और लम्ब 4 सेमी है, तो कर्ण (Hypotenuse) की लंबाई क्या होगी?",
            "options": ["5 सेमी", "6 सेमी", "7 सेमी", "8 सेमी"],
            "correct_index": 0,
            "hint": "सूत्र लगाइए: h² = 3² + 4² = 9 + 16 = 25.",
            "difficulty": "foundation"
        },
        "progress_update": {
            "concept_learned": "Pythagorean Triples & Trig Ratios",
            "mastery_delta": 20
        }
    },
    "binary_search": {
        "title": "Binary Search Algorithm (बाइनरी सर्च)",
        "spoken_text": "बाइनरी सर्च एक बहुत ही तेज़ सर्च एल्गोरिथम है जो 'डिवाइड एंड कॉन्कर' सिद्धांत पर काम करता है। यह हमेशा एक सॉर्टेड ऐरे पर चलता है और हर कदम में सर्च स्पेस को आधा कर देता है। इसकी टाइम कॉम्प्लेक्सिटी केवल O(log N) होती है!",
        "avatar_gesture": "point_whiteboard",
        "avatar_emotion": "enthusiastic",
        "whiteboard": {
            "title": "Binary Search - Divide & Conquer",
            "notes": [
                "पूर्वापेक्षा: ऐरे हमेशा सॉर्टेड (Sorted) होना चाहिए",
                "प्रक्रिया: मध्य तत्व (mid = (low + high) // 2) की जांच करें",
                "यदि Target == Mid: तत्व मिल गया!",
                "यदि Target < Mid: high = mid - 1 (बाएं आधे में खोजें)",
                "यदि Target > Mid: low = mid + 1 (दाएं आधे में खोजें)",
                "टाइम कॉम्प्लेक्सिटी: Best O(1), Average & Worst O(log N)"
            ],
            "math_latex": "T(n) = T(n/2) + O(1) \\implies T(n) = O(\\log_2 n)",
            "diagram_mermaid": "graph TD\n  Start[Array Range: Low to High] --> Mid[Find Mid Index]\n  Mid --> Check{Target == Mid?}\n  Check -- Yes --> Found[Element Found!]\n  Check -- Smaller --> Left[Search Left Half: High = Mid - 1]\n  Check -- Greater --> Right[Search Right Half: Low = Mid + 1]\n  style Found fill:#22c55e,stroke:#16a34a\n  style Check fill:#f59e0b,stroke:#d97706",
            "interactive_demo": "binary_search"
        },
        "adaptive_quiz": {
            "question": "यदि 1024 तत्वों की एक सॉर्टेड लिस्ट में बाइनरी सर्च किया जाए, तो अधिकतम कितनी तुलनाओं (Comparisons) में तत्व मिल जाएगा?",
            "options": ["10", "100", "512", "1024"],
            "correct_index": 0,
            "hint": "log₂(1024) = ? क्योंकि 2¹⁰ = 1024 होता है।",
            "difficulty": "application"
        },
        "progress_update": {
            "concept_learned": "Binary Search & Logarithmic Complexity",
            "mastery_delta": 20
        }
    },
    "gravity_orbit": {
        "title": "Universal Gravitation & Planetary Orbits (गुरुत्वाकर्षण)",
        "spoken_text": "न्यूटन के सार्वभौमिक गुरुत्वाकर्षण नियम के अनुसार, ब्रह्मांड का हर कण दूसरे कण को अपनी ओर आकर्षित करता है। यही बल ग्रहों को सूर्य के चारों ओर अंडाकार कक्षाओं में बांधे रखता है। आइए इसे इंटरएक्टिव ऑर्बिटल सिमुलेटर में देखें!",
        "avatar_gesture": "point_whiteboard",
        "avatar_emotion": "enthusiastic",
        "whiteboard": {
            "title": "Newton's Universal Gravitation & Kepler's Laws",
            "notes": [
                "गुरुत्वाकर्षण बल द्रव्यमानों के गुणनफल के समानुपाती होता है: F ∝ (m₁ * m₂)",
                "दूरी के वर्ग के व्युत्क्रमानुपाती होता है (Inverse Square Law): F ∝ 1 / r²",
                "सार्वभौमिक स्थिरांक: G = 6.674 × 10⁻¹¹ N·m²/kg²",
                "केप्लर का प्रथम नियम: सभी ग्रह सूर्य के चारों ओर दीर्घवृत्ताकार (Elliptical) कक्षा में घूमते हैं"
            ],
            "math_latex": "F = G \\frac{m_1 m_2}{r^2}, \\quad v_{orbit} = \\sqrt{\\frac{G M}{r}}",
            "diagram_mermaid": "graph LR\n  Sun((Sun - M)) -- Gravitational Pull --> Planet((Planet - m))\n  Planet -- Velocity V --> Tangent[Orbital Path]\n  style Sun fill:#f59e0b,stroke:#d97706\n  style Planet fill:#3b82f6,stroke:#2563eb",
            "interactive_demo": "gravity_orbit"
        },
        "adaptive_quiz": {
            "question": "यदि दो वस्तुओं के बीच की दूरी को दोगुना (Double) कर दिया जाए, तो उनके बीच का गुरुत्वाकर्षण बल कितना हो जाएगा?",
            "options": ["दोगुना", "आधा", "एक-चौथाई (1/4)", "अपरिवर्तित"],
            "correct_index": 2,
            "hint": "बल दूरी के वर्ग के व्युत्क्रमानुपाती होता है: F ∝ 1/r².",
            "difficulty": "foundation"
        },
        "progress_update": {
            "concept_learned": "Gravitational Inverse Square Law & Orbital Velocity",
            "mastery_delta": 20
        }
    }
}


class TutorEngine:
    """
    Socratic Adaptive AI Tutor Engine powered by Sarvam AI.
    Generates synchronized:
    - Spoken lesson (for Sarvam Bulbul TTS)
    - Avatar physical gestures & facial expressions
    - Visual Whiteboard (KaTeX Math, Mermaid Diagrams, Chalk Notes)
    - Interactive Mini-Simulations
    - Adaptive Assessment & Progressive Hints
    """

    def __init__(self, sarvam_client: Optional[SarvamClient] = None):
        self.sarvam = sarvam_client or SarvamClient()

    def _build_system_prompt(self, persona_key: str, language_code: str) -> str:
        persona = PERSONAS.get(persona_key, PERSONAS["priya"])
        return f"""You are {persona['name']}, a world-class AI Avatar Tutor ({persona['title']}).
Teaching Style: {persona['style']}
Target Language: {language_code} (Respond in this language or natural code-mixing like Hinglish/Tanglish appropriate for students in India).

Your role is to teach visually, expressively, and adaptively.
For every student query or lesson step, you must return a valid JSON object matching the following structure:
{{
  "spoken_text": "Expressive, spoken educational explanation (concise, 2-4 sentences, spoken directly to student).",
  "avatar_gesture": "point_whiteboard" | "nod" | "thinking" | "celebrate" | "explain",
  "avatar_emotion": "enthusiastic" | "encouraging" | "curious" | "proud",
  "whiteboard": {{
    "title": "Topic or Concept Title",
    "notes": [
      "Key bullet point 1",
      "Key bullet point 2",
      "Key bullet point 3"
    ],
    "math_latex": "LaTeX mathematical equation (e.g. E = mc^2 or KaTeX formula) or null",
    "diagram_mermaid": "Valid Mermaid.js graph string (e.g. graph TD\\n  A-->B) or null",
    "interactive_demo": "projectile" | "trigonometry" | "binary_search" | "gravity_orbit" | null
  }},
  "adaptive_quiz": {{
    "question": "A multiple choice diagnostic question to check understanding",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "hint": "Gentle nudge or clue if student is stuck",
    "difficulty": "foundation" | "application" | "mastery"
  }},
  "progress_update": {{
    "concept_learned": "Name of concept",
    "mastery_delta": 15
  }}
}}

CRITICAL: Return ONLY valid JSON. No conversational preamble before or after the JSON.
"""

    async def generate_lesson(
        self,
        student_query: str,
        persona_key: str = "priya",
        language_code: str = "hi-IN",
        history: Optional[List[Dict[str, str]]] = None,
        context_document: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete multimodal lesson package.
        """
        persona = PERSONAS.get(persona_key, PERSONAS["priya"])
        
        # Check if student query matches any interactive demo keywords
        lower_q = student_query.lower()
        matched_demo_key = None
        if any(w in lower_q for w in ["projectile", "motion", "प्रक्षेप्य", "throw", "physics"]):
            matched_demo_key = "projectile"
        elif any(w in lower_q for w in ["pythagoras", "triangle", "trig", "त्रिकोणमिति", "math", "sin", "cos"]):
            matched_demo_key = "trigonometry"
        elif any(w in lower_q for w in ["binary search", "search", "algorithm", "बाइनरी", "code", "array"]):
            matched_demo_key = "binary_search"
        elif any(w in lower_q for w in ["gravity", "orbit", "planet", "गुरुत्वाकर्षण", "newton", "kepler"]):
            matched_demo_key = "gravity_orbit"

        # If Sarvam API key is available, call Sarvam-105B LLM
        if self.sarvam.has_api_key:
            try:
                system_prompt = self._build_system_prompt(persona_key, language_code)
                messages = [{"role": "system", "content": system_prompt}]
                
                if context_document:
                    messages.append({
                        "role": "system",
                        "content": f"Student uploaded reference material/notes:\n{context_document[:3000]}"
                    })

                if history:
                    messages.extend(history[-6:])

                messages.append({"role": "user", "content": student_query})

                logger.info("Calling Sarvam-105B LLM for lesson generation...")
                res = await self.sarvam.chat_completion(messages=messages, model="sarvam-105b")
                content = res.get("content", "")
                
                # Parse JSON from LLM response
                lesson_data = self._extract_json(content)
                if lesson_data and "spoken_text" in lesson_data:
                    # Synthesize speech using Sarvam Bulbul TTS
                    tts_res = await self.sarvam.text_to_speech(
                        text=lesson_data["spoken_text"],
                        target_language_code=language_code,
                        speaker=persona["speaker"],
                        model="bulbul:v1"
                    )
                    lesson_data["audio_base64"] = tts_res.get("audio_base64")
                    lesson_data["speaker"] = persona["speaker"]
                    lesson_data["language_code"] = language_code
                    lesson_data["persona"] = persona
                    lesson_data["is_live_sarvam"] = True
                    return lesson_data
            except Exception as e:
                logger.warning(f"Sarvam LLM call failed, falling back to rich knowledge base: {str(e)}")

        # Fallback to rich structured knowledge base (or matched demo)
        base_template = DEMO_KNOWLEDGE_BASE.get(matched_demo_key or "projectile")
        lesson_data = dict(base_template)
        
        # If user asked a custom question not in demo, tailor the spoken text
        if not matched_demo_key:
            lesson_data["spoken_text"] = f"नमस्ते! आपने पूछा: '{student_query}'. आइए इस विषय को व्हाइटबोर्ड पर डायग्राम और स्टेप-बाय-स्टेप कॉन्सेप्ट के साथ समझते हैं।"
            lesson_data["whiteboard"]["title"] = f"Lesson: {student_query.strip().capitalize()}"
        
        # Attempt TTS with Sarvam Bulbul if key is available
        if self.sarvam.has_api_key:
            try:
                tts_res = await self.sarvam.text_to_speech(
                    text=lesson_data["spoken_text"],
                    target_language_code=language_code,
                    speaker=persona["speaker"],
                    model="bulbul:v1"
                )
                lesson_data["audio_base64"] = tts_res.get("audio_base64")
                lesson_data["is_live_sarvam"] = True
            except Exception as e:
                logger.error(f"TTS error: {str(e)}")
                lesson_data["audio_base64"] = None
                lesson_data["is_live_sarvam"] = False
        else:
            lesson_data["audio_base64"] = None
            lesson_data["is_live_sarvam"] = False

        lesson_data["speaker"] = persona["speaker"]
        lesson_data["language_code"] = language_code
        lesson_data["persona"] = persona
        return lesson_data

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        """Extract JSON block safely from LLM output."""
        try:
            # Direct parse
            return json.loads(text.strip())
        except Exception:
            pass

        # Try regex search for ```json ... ```
        match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass

        # Try finding outer braces
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(text[start:end+1])
            except Exception:
                pass

        return None
