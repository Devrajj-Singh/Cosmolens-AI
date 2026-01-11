# CosmoLens AI – Project Plan

## 1. What are we building?
CosmoLens AI is a web-based space exploration platform where users can search
for celestial objects and receive AI-driven insights along with interactive
3D visualizations.

The goal is to build a clean, modular, and explainable AI system rather than
a feature-heavy application.

---

## 2. What is NOT the goal?
- Not a social media app
- Not a real-time simulation
- Not a fully scientific research tool
- Not a production-scale system

This is an academic, end-to-end AI project.

---

## 3. High-level system flow
User Search → Frontend UI → Backend API → (Mock AI Data initially)
→ Structured Response → UI Update

ML and real APIs will be integrated later.

---

## 4. Development Phases

### Phase 1 – Structure & UI (Current)
- GitHub repository setup
- Folder structure
- UI & design lock
- Sidebar, layout, placeholders

### Phase 2 – Backend Skeleton
- Flask/FastAPI setup
- `/analyze` endpoint
- Mock JSON responses

### Phase 3 – Frontend ↔ Backend Integration
- API calls from frontend
- Real data flow
- Error & loading states

### Phase 4 – Data & AI
- CSV dataset
- Preprocessing & feature engineering
- ML model training
- API-based data cleaning

### Phase 5 – Testing & Finalization
- Bug fixing
- Documentation
- Submission preparation
