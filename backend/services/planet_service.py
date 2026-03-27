"""
planet_service.py
-----------------
CosmoLens AI — Planet AI Backend Service

Location: backend/services/planet_service.py

Responsibilities:
  - Load the trained ML model from ml/models/habitability_model.pkl
  - Accept raw planet/stellar parameters from the API route
  - Derive the 3 physics-based features (same logic as ml/training/feature_engineering.py)
  - Run prediction and return structured result
"""

import os
import pickle
import numpy as np

# Path: backend/services/ → up 2 levels → ml/models/
MODEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "..", "ml", "models", "habitability_model.pkl"
)

# Cached model — loaded once on first request
_model_payload = None


def _load_model():
    """Load the .pkl model once and cache it in memory."""
    global _model_payload
    if _model_payload is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"Model not found at {MODEL_PATH}. "
                "Please run ml/run_pipeline.py first."
            )
        with open(MODEL_PATH, "rb") as f:
            _model_payload = pickle.load(f)
        print(f"[planet_service] Model loaded from: {MODEL_PATH}")
    return _model_payload


def _derive_features(raw: dict) -> dict:
    """
    Derive the 3 physics-based features from raw inputs.
    Mirrors the logic in ml/training/feature_engineering.py exactly.

    Args:
        raw: dict with keys:
            planet_mass, planet_radius, orbital_period,
            semi_major_axis, stellar_flux, equilibrium_temperature,
            star_temperature

    Returns:
        dict with all 10 features (7 raw + 3 derived)
    """
    stellar_flux          = float(raw["stellar_flux"])
    equilibrium_temp      = float(raw["equilibrium_temperature"])
    planet_mass           = float(raw["planet_mass"])
    planet_radius         = float(raw["planet_radius"])

    # Feature 1: greenhouse_factor
    greenhouse_factor = 1.0 + 0.3 * np.log10(stellar_flux + 1)

    # Feature 2: surface_temperature (K)
    surface_temperature = equilibrium_temp * greenhouse_factor

    # Feature 3: atmospheric_pressure (Earth units)
    safe_radius = max(planet_radius, 0.1)
    atmospheric_pressure = planet_mass / (safe_radius ** 2)

    return {
        "planet_mass":             planet_mass,
        "planet_radius":           planet_radius,
        "orbital_period":          float(raw["orbital_period"]),
        "semi_major_axis":         float(raw["semi_major_axis"]),
        "stellar_flux":            stellar_flux,
        "equilibrium_temperature": equilibrium_temp,
        "star_temperature":        float(raw["star_temperature"]),
        "greenhouse_factor":       round(greenhouse_factor, 6),
        "surface_temperature":     round(surface_temperature, 4),
        "atmospheric_pressure":    round(atmospheric_pressure, 6),
    }


def predict_habitability(raw_input: dict) -> dict:
    """
    Main prediction function called by routes/planet.py.

    Args:
        raw_input: dict with 7 raw parameters from the frontend:
            {
                "planet_mass": float,           # Earth masses
                "planet_radius": float,         # Earth radii
                "orbital_period": float,        # days
                "semi_major_axis": float,       # AU
                "stellar_flux": float,          # Earth flux units
                "equilibrium_temperature": float, # Kelvin
                "star_temperature": float       # Kelvin
            }

    Returns:
        {
            "predicted_class": "Habitable" | "Potentially Habitable" | "Non-Habitable",
            "confidence": 0.0 - 1.0,
            "all_probabilities": {
                "Non-Habitable": float,
                "Potentially Habitable": float,
                "Habitable": float
            },
            "derived_features": {
                "greenhouse_factor": float,
                "surface_temperature": float,
                "atmospheric_pressure": float
            },
            "input_summary": { ...raw_input... }
        }
    """
    payload = _load_model()
    model        = payload["model"]
    feature_cols = payload["feature_cols"]
    class_names  = payload["class_names"]

    # Derive all 10 features
    features = _derive_features(raw_input)

    # Build feature vector in correct order
    X = np.array([[features[col] for col in feature_cols]])

    # Predict
    label_idx = int(model.predict(X)[0])
    probas    = model.predict_proba(X)[0]

    predicted_class = class_names[label_idx]
    confidence      = round(float(probas[label_idx]), 4)

    all_probabilities = {
        name: round(float(p), 4)
        for name, p in zip(class_names, probas)
    }

    return {
        "predicted_class": predicted_class,
        "confidence": confidence,
        "all_probabilities": all_probabilities,
        "derived_features": {
            "greenhouse_factor":    features["greenhouse_factor"],
            "surface_temperature":  features["surface_temperature"],
            "atmospheric_pressure": features["atmospheric_pressure"],
        },
        "input_summary": raw_input,
    }