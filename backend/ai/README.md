# AI Engine – CosmoLens AI

This folder contains the **AI / ML engine** for the CosmoLens AI project.

⚠️ This folder is owned and maintained by the **AI/ML Lead**.

## Responsibilities

The AI Engine is responsible for:
- Interacting with LLM APIs (e.g., OpenAI)
- Managing AI prompt templates
- Injecting space knowledge into AI context
- Generating explanations, timelines, comparisons, and notes
- Ensuring factual and consistent AI responses

## Folder Structure

ai/
├── data/        # Static space data (JSON / CSV)
├── prompts/     # Prompt templates for AI
├── engine/      # AI logic (context builder, API calls)
└── README.md

## Important Rules

- No backend authentication logic here
- No database logic here
- AI engine should be callable via backend APIs
- Keep prompts and logic modular

## Goal

Build a clean, explainable, and extensible AI system that:
- Feels intelligent
- Is easy to integrate
- Can be expanded later with real ML models
