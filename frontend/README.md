 # 🎨 Frontend — CosmoLens AI

This folder contains the full user interface for CosmoLens AI.

It includes:
- Login & authentication screens
- Homepage
- AI Explorer dashboard
- 3D model viewer
- Theme system (Dark, Nebula, Space Purple, Light)
- Sidebar & chat system

---

## 🛠 Tech Stack
- React / Next.js
- Tailwind CSS
- Three.js (3D viewer)
- WebGL
- Zustand / Context (state)

---

## 🎯 Your Responsibility
You are responsible for:
- UI components
- Pages & routing
- Styling & themes
- Frontend API calls

Do NOT write backend or ML code here.

---

## 🧪 Testing
All UI must be:
- Responsive
- Bug-free
- Smooth animations
- Pixel-perfect

---

## 🔄 How to Work
1. Pull latest changes
2. Install frontend dependencies with `npm install` inside `/frontend`
3. Start the local stack with `npm run dev`
4. `npm run dev` starts frontend, backend, and Firebase emulators together and stops them together
5. Use `npm run dev:app` only when you need the frontend by itself
6. Work only inside `/frontend`
7. Push your updates
8. Inform team lead

---

## 💻 Local Setup
- `npm run dev` works on Linux, macOS, and Windows
- Frontend setup for all platforms:
  `cd frontend && npm install`
- Backend setup on Linux or macOS:
  `python3 -m venv .venv && . .venv/bin/activate && pip install -r backend/requirements.txt`
- Backend setup on Windows PowerShell:
  `py -m venv .venv; .\.venv\Scripts\Activate.ps1; pip install -r backend/requirements.txt`
