
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from math import isclose
from sympy import sympify, simplify

app = FastAPI(title="EdTech v3 Evaluate API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Meta(BaseModel):
    answer_type: str = Field(default="numeric")
    expected: Optional[str] = None
    expected_numeric: Optional[float] = None
    tolerance: Optional[float] = 0.0

class EvalIn(BaseModel):
    questionId: str
    answer: str
    meta: Meta

class EvalOut(BaseModel):
    correct: Optional[bool]
    feedback: str
    normalized_answer: Optional[str] = None
    tags: List[str] = []

def parse_numeric(s: str) -> Optional[float]:
    try:
        v = float(sympify(s))
        return float(v)
    except Exception:
        return None

@app.get("/health")
def health():
    return {"ok": True}

@app.post("/evaluate", response_model=EvalOut)
def evaluate(payload: EvalIn):
    t = (payload.meta.tolerance or 0.0)
    atype = (payload.meta.answer_type or "numeric").lower()
    exp_str = payload.meta.expected
    exp_num = payload.meta.expected_numeric

    if atype in ("numeric", "numeric_fraction_ok", "ratio"):
        student_val = parse_numeric(payload.answer)
        if student_val is None and ":" in payload.answer:
            try:
                a,b = payload.answer.split(":")
                student_val = parse_numeric(f"({a})/({b})")
            except Exception:
                student_val = None

        if exp_num is None and exp_str:
            exp_num = parse_numeric(exp_str)

        if student_val is None or exp_num is None:
            return EvalOut(correct=False, feedback="Invalid numeric input.", tags=["invalid_input"])

        if isclose(student_val, exp_num, abs_tol=t if t else 0.0):
            fb = "Correct within tolerance." if t else "Correct."
            return EvalOut(correct=True, feedback=fb, normalized_answer=str(student_val), tags=["numeric"])
        else:
            diff = abs(student_val - exp_num)
            if t and diff <= (t*2):
                return EvalOut(correct=False, feedback="Close—check rounding.", normalized_answer=str(student_val), tags=["rounding"])
            return EvalOut(correct=False, feedback="Incorrect. Recheck your steps.", normalized_answer=str(student_val), tags=["numeric"])

    elif atype in ("algebraic", "algebra"):
        try:
            se = sympify(payload.answer)
            ee = sympify(exp_str) if exp_str else None
            if ee is None:
                return EvalOut(correct=False, feedback="No expected expression provided.", tags=["config_error"])
            eq = simplify(se - ee)
            if eq == 0:
                return EvalOut(correct=True, feedback="Correct.", normalized_answer=str(se), tags=["algebraic"])
            return EvalOut(correct=False, feedback="Not equivalent. Try simplifying.", normalized_answer=str(se), tags=["algebraic"])
        except Exception:
            return EvalOut(correct=False, feedback="Invalid algebraic input.", tags=["invalid_input"])

    elif atype in ("text","categorical"):
        s = (payload.answer or "").strip().lower()
        e = (exp_str or "").strip().lower()
        if not s:
            return EvalOut(correct=False, feedback="Answer required.", tags=["empty"])
        ok = s==e or (all(k in s for k in e.split()[:3]) if e else False)
        return EvalOut(correct=ok, feedback="Good." if ok else "Not matching definition.", normalized_answer=s, tags=["text"])

    return EvalOut(correct=False, feedback=f"Unsupported type: {atype}", tags=["unsupported"])
