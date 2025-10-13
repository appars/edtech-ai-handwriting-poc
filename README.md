# EdTech AI Handwriting – Demo (Frontend + Backend)

A minimal, demo‑friendly practice & exam app for Grades **8** and **12** across **Mathematics** and **Physics**.
Students select **Subject → Chapter → Level**, practice on a canvas, enter a final numeric answer, and submit.
The exam page includes a handwriting **workpad** with **Undo / Redo / Clear**.

---

## ✨ Features

- **Practice flow**: Dashboard → Start Practice → Select (Subject/Chapter/Level) → Exam → Results
- **Questions**: Bundled in `public/questions.json` (Class 8 & 12, Math & Physics, 3 chapters each, 3 levels)
- **Exam Workpad**:
  - Drawing canvas with a subtle grid (`components/InkCanvas.js`)
  - **Undo**, **Redo**, **Clear** (per-question, persists while navigating)
  - Keyboard shortcuts: Undo `Ctrl/⌘+Z`, Redo `Ctrl/⌘+Shift+Z` (or `Ctrl/⌘+Y`), Clear `Ctrl/⌘+Backspace`
- **Session persistence** in `localStorage` (key: `ed.v3.session`)
- **Recent setups** chips for quick re-selection on the Start Practice page
- **Dashboard** KPIs & charts (demo-friendly look & feel)

---

## 🗃️ Repo Structure

```
.
├─ frontend-next/                 # Next.js app (UI)
│  ├─ pages/
│  │  ├─ dashboard.js
│  │  ├─ exam.js                  # Exam page (uses InkCanvas; bottom-left Undo/Redo/Clear)
│  │  └─ practice/
│  │     └─ new.js                # Start Practice (subject/chapter/level selector)
│  ├─ components/
│  │  └─ InkCanvas.js             # Canvas with Undo/Redo stacks + Clear
│  ├─ public/
│  │  └─ questions.json           # All questions
│  ├─ tailwind.config.js          # Tailwind (ensure content globs include pages/components)
│  └─ ...
└─ backend/                       # API server (evaluate, results, auth, etc.)
   ├─ .env.example
   ├─ src/
   │  ├─ index.(js|ts)            # HTTP server entry
   │  ├─ routes/
   │  │  ├─ health.ts
   │  │  └─ evaluate.ts           # (Optional) numeric evaluation endpoint
   │  └─ ...
   └─ package.json (or requirements.txt if Python)
```

> If your backend is Python instead of Node, adapt the backend steps accordingly.
> The frontend works offline using `public/questions.json` and client-side flow.

---

## 🧰 Prerequisites

- **Node.js** ≥ 18.x and **npm** ≥ 9
- (If backend is Node) Node.js ≥ 18 in `/backend`
- (If backend is Python) Python 3.10+ & `pip`

Verify:
```bash
node -v
npm -v
```

---

## 🚀 Quick Start (Development)

### 1) Frontend

```bash
cd frontend-next
npm install
npm run dev
# App on http://localhost:3000
```

If you see `sh: next: command not found`:
```bash
npm install next react react-dom
npm run dev
```

### 2) Backend (choose your stack)

**Node/Express (example)**
```bash
cd backend
cp .env.example .env      # fill values if needed
npm install
npm run dev
# Server on http://localhost:4000
```

**Python/FastAPI (example)**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn src.index:app --reload --port 4000
```

If the frontend needs to call the backend, set in `frontend-next/.env.local`:
```bash
NEXT_PUBLIC_API_BASE="http://localhost:4000"
```

---

## ⚙️ Configuration

### Frontend (`frontend-next/.env.local`)
```bash
# Example
NEXT_PUBLIC_APP_NAME="EdTech AI Demo"
NEXT_PUBLIC_API_BASE="http://localhost:4000"  # only if using backend endpoints
```

### Backend (`backend/.env`)
```bash
# Example
PORT=4000
CORS_ORIGIN=http://localhost:3000
```

---

## 📦 Data: `public/questions.json`

- **Location**: `frontend-next/public/questions.json`
- **Shape** (sample):
```json
{
  "id": "M8-RN-E-1",
  "chapter": "Rational Numbers",
  "level": "Easy",
  "prompt": "Add 3/7 and 4/7.",
  "answer_type": "numeric",
  "numeric_expected": 1,
  "tolerance": 0.01,
  "expected": "1",
  "subject": "Mathematics",
  "standard": 8
}
```
- **Coverage in Demo**
  - **Class 8 – Math**: Rational Numbers, Linear Equations in One Variable, Exponents & Powers  
  - **Class 8 – Physics**: Motion, Force & Pressure, Work & Energy  
  - **Class 12 – Math**: Algebra – Polynomials & Expressions, Quadratic Equations, Matrices & Determinants  
  - **Class 12 – Physics**: Electrostatics, Current Electricity, Ray Optics  
  - Levels: **Easy / Medium / Hard** (≈5 per combination in the demo set)

You can freely add new questions or subjects—Start Practice auto-reads the file.

---

## 🧭 App Flow

1. **Dashboard** → click **Start New Practice**  
2. **/practice/new**  
   - Select **Subject → Chapter → Level**  
   - (Optional) Pick from **Recent** quick picks  
   - Saves session to `localStorage` key **`ed.v3.session`**
3. **/exam**  
   - Shows the selected questions (default 10)  
   - **Workpad** (InkCanvas) to write steps
   - **Bottom-left controls**: **Undo**, **Redo**, **Clear**  
     - Clear asks for confirmation and **does not** change the Final Answer box
   - Navigate via **Q1…Qn** chips or **Prev/Next**
4. **Results/Dashboard**

---

## 🖊️ InkCanvas (Workpad) API

File: `frontend-next/components/InkCanvas.js`

Exposed via `ref`:
- `clear()` — clear canvas and reset redo stack
- `undo()` — undo last stroke
- `redo()` — redo last undone stroke
- `toDataURL()` / `fromDataURL(dataURL)` — snapshot/restore (used for persistence/export)

Implementation details:
- Vector stroke history with a **redo stack**
- New stroke **clears the redo stack** (standard editor behavior)
- Subtle grid background

---

## 🔧 Common Issues & Fixes

- **Start Practice does nothing / jumps to Dashboard**  
  Ensure `/practice/new` saves a session to `localStorage` key `ed.v3.session` with:
  ```jsonc
  {
    subject, standard, chapter, level,
    questions: [ /* non-empty array */ ]
  }
  ```
  The exam page redirects to `/dashboard` if this is missing or empty.

- **“next: command not found”**  
  Install Next.js and React:
  ```bash
  npm install next react react-dom
  ```

- **Tailwind classes not applying**  
  Check `tailwind.config.js` content globs include `./pages/**/*.{js,jsx,ts,tsx}` and `./components/**/*.{js,jsx,ts,tsx}`. Restart `npm run dev` after edits.

- **Undo/Redo disabled**  
  The buttons enable when `InkCanvas` exposes `undo()`/`redo()` (already implemented here). If still disabled, ensure your `exam.js` uses the correct ref and renders the same `InkCanvas.js` from this repo.

---

## 🧪 Running a Demo

1. Start the frontend: `npm run dev` in `frontend-next`  
2. (Optional) Start the backend if you’re using endpoints  
3. Open `http://localhost:3000`  
4. Dashboard → **Start New Practice** → pick a setup → **Start**  
5. In the exam, draw a few strokes → **Undo / Redo / Clear** → Submit / Next

---

## 📄 License

MIT (or your preferred license).

---

## 🙌 Credits

Built for quick classroom & showcase demos.  
Thanks to everyone who contributed content and UX polish!
