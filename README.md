# 🌌 CosmoLens AI

CosmoLens AI is a full-stack Space Intelligence System that combines machine learning, backend APIs, and interactive 3D visualization to explore and analyze astronomical objects.

The system is built using a modular architecture to clearly separate frontend, backend, and ML responsibilities.

---

## 🧠 System Overview

CosmoLens AI consists of two primary modules:

### 1️⃣ AI Explorer
- Explore galaxies, nebulae, and celestial objects
- Interactive 3D visualization
- AI-powered object insights
- Timeline and research notes

### 2️⃣ Planet Habitability Analyzer (ML-Based)
- Predict planetary habitability using machine learning
- Multi-class classification:
  - Non-Habitable
  - Potentially Habitable
  - Habitable
- Probability distribution output
- Feature importance ranking
- Physics-informed feature engineering

---

## 🏗️ Architecture

The project follows a modular full-stack architecture:

Frontend → Backend API → ML Inference → Trained Model

Each layer is isolated and independently maintainable.

---

## 📁 Repository Structure

cosmolens-ai/
│
├── frontend/ → Web UI (React / Next.js)
├── backend/ → API Layer (Routes, Services, Validators)
├── ml/ → ML Pipeline (Training & Inference)
├── docs/ → Architecture & API documentation
├── project_plan.md
└── README.md

---

## 🧑‍🚀 Team Responsibilities

Each member works only in their assigned module:

- Frontend Developers → `/frontend`
- Backend Developers → `/backend`
- ML Engineer → `/ml`
- Team Lead → Architecture review & GitHub management

Do NOT modify folders outside your responsibility without discussion.

---

## 🔄 Development Workflow

1. Pull latest changes
2. Work in your assigned folder
3. Create feature branch
4. Commit with clear messages
5. Push branch
6. Open Pull Request
7. Team Lead reviews & merges

---

## 💻 Local Development

Run these commands from the repository root:

```bash
npm install --prefix frontend
npm run dev
```

`npm run dev` starts the frontend, backend, and Firebase emulators together and stops all of them together on Linux, macOS, and Windows.

Useful variants:

- `npm run dev:app` starts only the frontend app
- `npm run dev:web-only` starts only the frontend app without the local stack wrapper

Backend setup still requires the Python virtual environment in `/.venv` with `backend/requirements.txt` installed.

---

## 🔐 Repository Policy

- This is a private development repository.
- Do not share outside the team.
- Do not commit large datasets or temporary files.
- Keep commits structured and meaningful.

---

## 🎯 Current Phase

We are transitioning from API-based logic to a true ML-driven planetary prediction system with proper model training and evaluation.

---

Maintained by Team CosmoLens AI.
