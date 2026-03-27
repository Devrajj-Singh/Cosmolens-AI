from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

from backend.schemas.planet import PlanetInput


REPO_ROOT = Path(__file__).resolve().parents[2]
MODEL_PATH = REPO_ROOT / "ml" / "models" / "habitability_model.pkl"
FEATURE_IMPORTANCE_PATH = REPO_ROOT / "ml" / "models" / "feature_importance.json"

FEATURE_LABELS = {
    "planet_mass": "Planet Mass",
    "planet_radius": "Planet Radius",
    "orbital_period": "Orbital Period",
    "semi_major_axis": "Semi-Major Axis",
    "stellar_flux": "Stellar Flux",
    "equilibrium_temperature": "Equilibrium Temperature",
    "star_temperature": "Star Temperature",
    "greenhouse_factor": "Greenhouse Factor",
    "surface_temperature": "Surface Temperature",
    "atmospheric_pressure": "Atmospheric Pressure",
}

CLASSIFICATION_MAP = {
    "Habitable": "habitable",
    "Potentially Habitable": "potentially-habitable",
    "Non-Habitable": "non-habitable",
}


def _compute_derived_metrics(values: dict[str, float]) -> dict[str, Any]:
    surface_gravity = values["mass"] / (values["radius"] * values["radius"])
    escape_velocity = (values["mass"] / values["radius"]) ** 0.5 * 11.2
    gravity_factor = min(surface_gravity / 0.5, 1)
    temp_factor = 1 if values["temperature"] < 500 else 0.5 if values["temperature"] < 800 else 0.1
    pressure_factor = min(values["pressure"], 1) if values["pressure"] > 0.01 else 0
    atmosphere_retention = round(min(1, gravity_factor * temp_factor * pressure_factor) * 100)
    habitable_zone = "Inside" if 0.2 <= values["stellar_flux"] <= 2.0 else "Outside"
    temp_deviation = abs(values["temperature"] - 288) / 288
    greenhouse_deviation = abs(values["greenhouse"] - 0.3)
    temperature_stability = round(max(0, (1 - temp_deviation * 0.8 - greenhouse_deviation * 0.5)) * 100)

    return {
        "surface_gravity": round(surface_gravity, 2),
        "escape_velocity": round(escape_velocity, 1),
        "atmosphere_retention": atmosphere_retention,
        "habitable_zone": habitable_zone,
        "temperature_stability": temperature_stability,
    }


def _heuristic_prediction(values: dict[str, float]) -> dict[str, Any]:
    temp_score = 1 if 200 <= values["temperature"] <= 350 else 0.5 if 150 <= values["temperature"] <= 400 else 0
    mass_score = 1 if 0.5 <= values["mass"] <= 5 else 0.5 if 0.1 <= values["mass"] <= 10 else 0
    radius_score = 1 if 0.5 <= values["radius"] <= 2.5 else 0.5 if 0.3 <= values["radius"] <= 5 else 0
    flux_score = 1 if 0.3 <= values["stellar_flux"] <= 1.7 else 0.5 if 0.1 <= values["stellar_flux"] <= 3 else 0
    axis_score = 1 if 0.7 <= values["semi_major_axis"] <= 1.5 else 0.5 if 0.3 <= values["semi_major_axis"] <= 5 else 0
    star_temp_score = 1 if 4000 <= values["star_temp"] <= 7000 else 0.5 if 3000 <= values["star_temp"] <= 10000 else 0
    period_score = 1 if 200 <= values["orbital_period"] <= 500 else 0.5 if 50 <= values["orbital_period"] <= 2000 else 0
    pressure_score = 1 if 0.5 <= values["pressure"] <= 2 else 0.5 if 0.1 <= values["pressure"] <= 10 else 0
    greenhouse_score = 1 if 0.1 <= values["greenhouse"] <= 0.5 else 0.5 if 0 <= values["greenhouse"] <= 1 else 0

    total_score = (
        temp_score * 0.24
        + mass_score * 0.14
        + radius_score * 0.14
        + flux_score * 0.14
        + axis_score * 0.08
        + star_temp_score * 0.08
        + period_score * 0.08
        + pressure_score * 0.06
        + greenhouse_score * 0.04
    )

    if total_score >= 0.68:
        habitable = 60 + total_score * 30
        potential = 100 - habitable - (5 + (1 - total_score) * 10)
        non_habitable = 100 - habitable - potential
    elif total_score >= 0.4:
        potential = 40 + total_score * 30
        habitable = total_score * 25
        non_habitable = 100 - habitable - potential
    else:
        non_habitable = 60 + (1 - total_score) * 30
        potential = (100 - non_habitable) * 0.6
        habitable = 100 - non_habitable - potential

    habitable = max(1, min(95, round(habitable * 10) / 10))
    potential = max(1, min(95, round(potential * 10) / 10))
    non_habitable = max(1, round((100 - habitable - potential) * 10) / 10)

    feature_scores = [
        {"label": "Surface Temperature", "importance": temp_score * 24},
        {"label": "Stellar Flux", "importance": flux_score * 14},
        {"label": "Planet Mass", "importance": mass_score * 14},
        {"label": "Planet Radius", "importance": radius_score * 14},
        {"label": "Semi-Major Axis", "importance": axis_score * 8},
        {"label": "Star Temperature", "importance": star_temp_score * 8},
        {"label": "Orbital Period", "importance": period_score * 8},
        {"label": "Atmospheric Pressure", "importance": pressure_score * 6},
        {"label": "Greenhouse Factor", "importance": greenhouse_score * 4},
    ]

    top_features = sorted(feature_scores, key=lambda item: item["importance"], reverse=True)[:3]
    max_importance = max((item["importance"] for item in top_features), default=0)

    classification = (
        "habitable"
        if habitable > potential and habitable > non_habitable
        else "potentially-habitable"
        if potential > non_habitable
        else "non-habitable"
    )

    return {
        "classification": classification,
        "score": round(total_score, 3),
        "confidence": round(max(habitable, potential, non_habitable) / 100, 4),
        "probabilities": {
            "habitable": habitable,
            "potential": potential,
            "non_habitable": non_habitable,
        },
        "top_features": [
            {
                "label": item["label"],
                "importance": round((item["importance"] / max_importance) * 100) if max_importance else 0,
            }
            for item in top_features
        ],
        "engine": "heuristic-fallback",
    }


def _to_model_features(values: dict[str, float]) -> dict[str, float]:
    return {
        "planet_mass": values["mass"],
        "planet_radius": values["radius"],
        "orbital_period": values["orbital_period"],
        "semi_major_axis": values["semi_major_axis"],
        "stellar_flux": values["stellar_flux"],
        "equilibrium_temperature": values["temperature"],
        "star_temperature": values["star_temp"],
        "greenhouse_factor": values["greenhouse"],
        "surface_temperature": values["temperature"],
        "atmospheric_pressure": values["pressure"],
    }


@lru_cache(maxsize=1)
def _load_feature_importance() -> dict[str, float]:
    if not FEATURE_IMPORTANCE_PATH.exists():
        return {}
    return json.loads(FEATURE_IMPORTANCE_PATH.read_text())


@lru_cache(maxsize=1)
def _load_ml_helpers():
    if not MODEL_PATH.exists():
        return None

    from ml.training.train_model import load_model, predict

    return {
        "model_payload": load_model(str(MODEL_PATH)),
        "predict": predict,
    }


def _ml_prediction(values: dict[str, float]) -> dict[str, Any] | None:
    helpers = _load_ml_helpers()
    if helpers is None:
        return None

    model_features = _to_model_features(values)
    result = helpers["predict"](helpers["model_payload"], model_features)
    raw_probabilities = result["all_probabilities"]
    importance = _load_feature_importance()

    top_features = [
        {
            "label": FEATURE_LABELS.get(name, name),
            "importance": round(score * 100),
        }
        for name, score in sorted(importance.items(), key=lambda item: item[1], reverse=True)[:3]
    ]

    return {
        "classification": CLASSIFICATION_MAP.get(result["predicted_class"], "non-habitable"),
        "score": round(result["confidence"], 4),
        "confidence": result["confidence"],
        "probabilities": {
            "habitable": round(raw_probabilities.get("Habitable", 0) * 100, 1),
            "potential": round(raw_probabilities.get("Potentially Habitable", 0) * 100, 1),
            "non_habitable": round(raw_probabilities.get("Non-Habitable", 0) * 100, 1),
        },
        "top_features": top_features,
        "engine": "trained-ml-model",
    }


def analyze_planet(body: PlanetInput) -> dict[str, Any]:
    values = body.model_dump()
    derived_metrics = _compute_derived_metrics(values)

    try:
        prediction = _ml_prediction(values) or _heuristic_prediction(values)
    except Exception:
        prediction = _heuristic_prediction(values)

    top_feature_labels = ", ".join(item["label"] for item in prediction["top_features"])

    return {
        "input": body,
        "prediction": prediction,
        "derived_metrics": derived_metrics,
        "summary": (
            f"This configuration is {prediction['classification']} with score {prediction['score']}. "
            f"Top factors: {top_feature_labels}. "
            f"Surface gravity is {derived_metrics['surface_gravity']} g and the orbit is "
            f"{derived_metrics['habitable_zone'].lower()} the habitable zone."
        ),
    }
