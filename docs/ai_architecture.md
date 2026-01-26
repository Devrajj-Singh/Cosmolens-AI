# CosmoLens AI Engine Architecture

## Overview

The AI Engine of CosmoLens is responsible for generating intelligent responses
about space objects such as galaxies, nebulae, and planets.

The system uses:
- Structured space data (JSON)
- Prompt templates
- A Language Model API (LLM)

to produce factual and educational answers.

---

## High Level Flow

1. User asks a question in the AI Explorer UI
2. Frontend sends request to backend API
3. Backend forwards request to AI Engine
4. AI Engine performs:
   - Load space object data
   - Load prompt template
   - Build AI context
   - Call LLM API
5. AI Engine returns response to backend
6. Backend sends response to frontend UI

---

## Folder Responsibilities

backend/ai/data/
- Stores space object information in JSON format

backend/ai/prompts/
- Stores prompt templates for explanation, comparison, notes, and timelines

backend/ai/engine/
- Contains AI logic such as:
  - Context builder
  - LLM API handler
  - Response formatter

backend/core/
- Handles API routes and passes requests to AI engine

---

## Benefits of This Design

- Clean separation between AI and backend logic
- Easy to update space data
- Easy to modify prompts
- Scalable for future ML models
- Avoids merge conflicts

---

## Future Expansion

Later, the AI Engine can include:
- Real ML models
- Embeddings for similarity search
- Caching for faster responses
