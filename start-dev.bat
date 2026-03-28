@echo off
echo Starting CosmoLens AI...

start "Backend" cmd /k "cd /d C:\Users\Devraj\Cosmolens-AI && python -m uvicorn backend.main:app --port 18010 --reload"

start "Firebase" cmd /k "cd /d C:\Users\Devraj\Cosmolens-AI && firebase emulators:start --only auth --project cosmolens-ai-local"

timeout /t 5

start "Frontend" cmd /k "cd /d C:\Users\Devraj\Cosmolens-AI\frontend && set NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-cosmolens && set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true && set NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:18010 && npx next dev --hostname 127.0.0.1 --port 3101"

echo All services starting...