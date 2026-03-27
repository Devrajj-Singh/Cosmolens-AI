"""
app.py
------
CosmoLens AI — Backend Entry Point

Location: backend/app.py

Usage:
    python app.py              # development
    flask run --port 5000      # alternative
"""

from flask import Flask
from flask_cors import CORS

app = Flask(__name__)

# Allow requests from Next.js frontend (localhost:3000)
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:3000"]}})

# ── Register blueprints ───────────────────────────────────────────────────────
# Planet AI — ML prediction (EPIC-4 + EPIC-6 complete)
from routes.planet import planet_bp
app.register_blueprint(planet_bp, url_prefix="/api/planet")

# Explorer — coming in EPIC-7 (routes/explorer.py not yet implemented)
# from routes.explorer import explorer_bp
# app.register_blueprint(explorer_bp, url_prefix="/api/explorer")


# ── Root health check ─────────────────────────────────────────────────────────
@app.route("/")
def index():
    return {"status": "CosmoLens AI backend is running"}, 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)