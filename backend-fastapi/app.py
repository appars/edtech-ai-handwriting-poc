
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Submission(BaseModel):
    answer: str

@app.post("/check")
def check_answer(sub: Submission):
    try:
        val = float(sub.answer)
        correct = (abs(val - 3.14) < 0.01)
    except:
        correct = False
    return {"correct": correct, "feedback": "Good job!" if correct else "Try again."}
