from backend.schemas.planet import PlanetInput


def _compute_prediction(values: dict) -> dict:
    temp_score = 1 if 200 <= values["temperature"] <= 350 else 0.5 if 150 <= values["temperature"] <= 400 else 0
    mass_score = 1 if 0.5 <= values["mass"] <= 5 else 0.5 if 0.1 <= values["mass"] <= 10 else 0
    radius_score = 1 if 0.5 <= values["radius"] <= 2.5 else 0.5 if 0.3 <= values["radius"] <= 5 else 0
    flux_score = 1 if 0.3 <= values["stellar_flux"] <= 1.7 else 0.5 if 0.1 <= values["stellar_flux"] <= 3 else 0
    axis_score = 1 if 0.7 <= values["semi_major_axis"] <= 1.5 else 0.5 if 0.3 <= values["semi_major_axis"] <= 5 else 0
    star_temp_score = 1 if 4000 <= values["star_temp"] <= 7000 else 0.5 if 3000 <= values["star_temp"] <= 10000 else 0
    period_score = 1 if 200 <= values["orbital_period"] <= 500 else 0.5 if 50 <= values["orbital_period"] <= 2000 else 0
    pressure_score = 1 if 0.5 <= values["pressure"] <= 2 else 0.5 if 0.1 <= values["pressure"] <= 10 else 0
    greenhouse_score = 1 if 0.1 <= values["greenhouse"] <= 0.5 else 0.5 if 0 <= values["greenhouse"] <= 1 else 0
    luminosity_score = 1 if 0.5 <= values["star_luminosity"] <= 2 else 0.5 if 0.1 <= values["star_luminosity"] <= 10 else 0

    total_score = (
        temp_score * 0.20
        + mass_score * 0.12
        + radius_score * 0.12
        + flux_score * 0.12
        + axis_score * 0.08
        + star_temp_score * 0.08
        + period_score * 0.08
        + pressure_score * 0.08
        + greenhouse_score * 0.06
        + luminosity_score * 0.06
    )

    if total_score >= 0.7:
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

    features = [
        {"label": "Surface Temperature", "importance": temp_score * 20},
        {"label": "Stellar Flux", "importance": flux_score * 12},
        {"label": "Planet Mass", "importance": mass_score * 12},
        {"label": "Planet Radius", "importance": radius_score * 12},
        {"label": "Semi-Major Axis", "importance": axis_score * 8},
        {"label": "Star Temperature", "importance": star_temp_score * 8},
        {"label": "Orbital Period", "importance": period_score * 8},
        {"label": "Atmospheric Pressure", "importance": pressure_score * 8},
        {"label": "Greenhouse Factor", "importance": greenhouse_score * 6},
        {"label": "Star Luminosity", "importance": luminosity_score * 6},
    ]
    top_features = sorted(features, key=lambda item: item["importance"], reverse=True)[:3]
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
    }


def _compute_derived_metrics(values: dict) -> dict:
    surface_gravity = values["mass"] / (values["radius"] * values["radius"])
    escape_velocity = (values["mass"] / values["radius"]) ** 0.5 * 11.2
    gravity_factor = min(surface_gravity / 0.5, 1)
    temp_factor = 1 if values["temperature"] < 500 else 0.5 if values["temperature"] < 800 else 0.1
    pressure_factor = min(values["pressure"] / 1, 1) if values["pressure"] > 0.01 else 0
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


def analyze_planet(body: PlanetInput) -> dict:
    values = body.model_dump()
    prediction = _compute_prediction(values)
    derived_metrics = _compute_derived_metrics(values)
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
