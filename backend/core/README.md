# Backend Core

This folder contains the **core backend logic** for CosmoLens AI.

## Responsibilities

The `core` module is responsible for:
- Authentication (login, signup, guest access)
- Database models and queries
- API routes
- Business logic
- Session and user management

## Folder Structure

core/
├── routes/     # API routes (auth, users, etc.)
├── db/         # Database schemas and connections
├── services/   # Business logic and helpers
└── README.md

## Development Rules

- Only backend developers should work in this folder
- Do NOT add AI or ML logic here
- Keep routes clean and modular
- No hard-coded secrets

## Notes

AI-related functionality will be handled separately inside `backend/ai/`
