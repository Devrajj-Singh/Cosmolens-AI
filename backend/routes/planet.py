"""
routes/planet.py
----------------
CosmoLens AI — Planet AI API Routes

Location: backend/routes/planet.py

Endpoints:
  POST /api/planet/predict   → run habitability prediction
  GET  /api/planet/schema    → return input parameter schema for frontend
  GET  /api/planet/health    → check model is loaded and ready
"""

from flask import Blueprint, request, jsonify
import sys
import os

# Ensure backend/ is on the path for service/validator imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from services.planet_service import predict_habitability
from validators.planet_validator import validate_planet_input, get_param_schema

planet_bp = Blueprint("planet", __name__)


# ── POST /api/planet/predict ─────────────────────────────────────────────────
@planet_bp.route("/predict", methods=["POST"])
def predict():
    """
    Predict planetary habitability from input parameters.

    Request body (JSON):
    {
        "planet_mass": 1.0,
        "planet_radius": 1.0,
        "orbital_period": 365.25,
        "semi_major_axis": 1.0,
        "stellar_flux": 1.0,
        "equilibrium_temperature": 255.0,
        "star_temperature": 5778.0
    }

    Response (JSON):
    {
        "success": true,
        "result": {
            "predicted_class": "Potentially Habitable",
            "confidence": 0.87,
            "all_probabilities": {
                "Non-Habitable": 0.05,
                "Potentially Habitable": 0.87,
                "Habitable": 0.08
            },
            "derived_features": {
                "greenhouse_factor": 1.09,
                "surface_temperature": 278.0,
                "atmospheric_pressure": 1.0
            },
            "input_summary": { ...original input... }
        }
    }
    """
    try:
        data = request.get_json(force=True)
        if data is None:
            return jsonify({
                "success": False,
                "error": "Request body must be valid JSON."
            }), 400

        # Step 1: Validate inputs
        validated = validate_planet_input(data)

        # Step 2: Run ML prediction
        result = predict_habitability(validated)

        return jsonify({
            "success": True,
            "result": result
        }), 200

    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 422

    except FileNotFoundError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 503

    except Exception as e:
        return jsonify({
            "success": False,
            "error": f"Prediction failed: {str(e)}"
        }), 500


# ── GET /api/planet/schema ───────────────────────────────────────────────────
@planet_bp.route("/schema", methods=["GET"])
def schema():
    """
    Return parameter bounds and hints for the frontend sliders.
    Frontend uses this to configure input ranges dynamically.
    """
    return jsonify({
        "success": True,
        "schema": get_param_schema()
    }), 200


# ── GET /api/planet/health ───────────────────────────────────────────────────
@planet_bp.route("/health", methods=["GET"])
def health():
    """Check that the model file exists and is loadable."""
    try:
        from services.planet_service import _load_model
        _load_model()
        return jsonify({
            "success": True,
            "status": "model loaded and ready"
        }), 200
    except FileNotFoundError as e:
        return jsonify({
            "success": False,
            "status": "model not found",
            "error": str(e)
        }), 503
    except Exception as e:
        return jsonify({
            "success": False,
            "status": "error",
            "error": str(e)
        }), 500