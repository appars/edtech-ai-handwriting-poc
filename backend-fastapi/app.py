# backend-fastapi/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fractions import Fraction

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000","http://localhost:3001",
        "http://127.0.0.1:3000","http://127.0.0.1:3001",
    ],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

class Submission(BaseModel):
    answer: str
    answer_type: str | None = None
    expected: float | int | None = None
    numeric_expected: float | int | None = None
    expected_fraction: str | None = None
    tolerance: float | None = 0.0
    ratio_expected: str | None = None         # e.g. "4:1"
    categorical_expected: str | None = None   # e.g. "yes" or "both"

def _parse_number(s: str):
    try:
        return float(s)
    except Exception:
        return None

def _equal_fraction(user: str, expected_fraction: str, numeric_expected: float, tol: float):
    try:
        # Accept "1", "1/1", "2/2", etc.
        if "/" in user:
            u = float(Fraction(user.replace(" ", "")))
        else:
            u = float(user)
        return abs(u - float(numeric_expected)) <= (tol or 0.0)
    except Exception:
        return False

def _equal_ratio(user: str, expected: str):
    # Normalize a:b → reduced form and compare
    def norm(r: str):
        a, b = r.replace(" ", "").split(":")
        f = Fraction(int(a), int(b))
        return f.numerator, f.denominator
    try:
        ua, ub = norm(user)
        ea, eb = norm(expected)
        return ua == ea and ub == eb
    except Exception:
        return False

@app.post("/check")
def check(sub: Submission):
    at = (sub.answer_type or "").lower()
    ans = (sub.answer or "").strip()

    # numeric
    if at == "numeric":
        if sub.expected is None and sub.numeric_expected is None:
            return {"correct": False, "feedback": "No expected value provided."}
        target = sub.numeric_expected if sub.numeric_expected is not None else sub.expected
        user = _parse_number(ans)
        ok = (user is not None) and abs(user - float(target)) <= (sub.tolerance or 0.0)
        return {"correct": ok, "feedback": "Good job!" if ok else "Try again."}

    # numeric fraction ok
    if at == "numeric_fraction_ok":
        if sub.numeric_expected is None:
            return {"correct": False, "feedback": "No numeric_expected provided."}
        ok = _equal_fraction(ans, sub.expected_fraction or "", sub.numeric_expected, sub.tolerance or 0.0)
        return {"correct": ok, "feedback": "Good job!" if ok else "Try again."}

    # categorical (yes/no/both/onto/…)
    if at == "categorical":
        if sub.categorical_expected is None:
            return {"correct": False, "feedback": "No expected category provided."}
        ok = ans.lower() == sub.categorical_expected.lower()
        return {"correct": ok, "feedback": "Good job!" if ok else "Try again."}

    # ratio (e.g., "4:1")
    if at == "ratio":
        if sub.ratio_expected is None:
            return {"correct": False, "feedback": "No expected ratio provided."}
        ok = _equal_ratio(ans, sub.ratio_expected)
        return {"correct": ok, "feedback": "Good job!" if ok else "Try again."}

    # default / unsupported
    return {"correct": False, "feedback": f"Unsupported type: {sub.answer_type}"}

