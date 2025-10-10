# Frontend (Exam Portal) – Clean Scaffold

School-style white + blue theme · Login/Setup → Exam workspace (Stepper + Grid Navigator)
Handwriting canvas, Submit/Skip/Next flow · LocalStorage persistence (session + attempts)

## Run
```
npm install
echo 'NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000' > .env.local
npm run dev
```
Start at `/` to create a session; it will navigate to `/exam`.
