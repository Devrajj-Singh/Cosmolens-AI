"""
planet_validator.py
-------------------
CosmoLens AI — Planet AI Input Validator

Location: backend/validators/planet_validator.py

Validates all 7 raw planet/stellar parameters before they reach
the ML model. Returns clean typed values or raises ValueError.
"""

# Physical bounds for each input parameter
# Based on the NASA Exoplanet Archive dataset ranges + scientific limits
PARAM_BOUNDS = {
    "planet_mass": {
        "min": 0.01,
        "max": 250000.0,
        "unit": "Earth masses",
        "hint": "e.g. Earth = 1.0, Jupiter = 317.8",
    },
    "planet_radius": {
        "min": 0.1,
        "max": 100.0,
        "unit": "Earth radii",
        "hint": "e.g. Earth = 1.0, Jupiter = 11.2",
    },
    "orbital_period": {
        "min": 0.1,
        "max": 1000000.0,
        "unit": "days",
        "hint": "e.g. Earth = 365.25",
    },
    "semi_major_axis": {
        "min": 0.001,
        "max": 1000.0,
        "unit": "AU",
        "hint": "e.g. Earth = 1.0, Mars = 1.52",
    },
    "stellar_flux": {
        "min": 0.0,
        "max": 50000.0,
        "unit": "Earth flux units",
        "hint": "e.g. Earth = 1.0",
    },
    "equilibrium_temperature": {
        "min": 30.0,
        "max": 5000.0,
        "unit": "Kelvin",
        "hint": "e.g. Earth = 255K",
    },
    "star_temperature": {
        "min": 400.0,
        "max": 60000.0,
        "unit": "Kelvin",
        "hint": "e.g. Sun = 5778K",
    },
}

REQUIRED_PARAMS = list(PARAM_BOUNDS.keys())


def validate_planet_input(data: dict) -> dict:
    """
    Validate and sanitize incoming planet parameters.

    Args:
        data: raw dict from request body

    Returns:
        cleaned dict with all values as floats

    Raises:
        ValueError: with a descriptive message if any field is invalid
    """
    if not isinstance(data, dict):
        raise ValueError("Request body must be a JSON object.")

    cleaned = {}
    errors  = []

    for param in REQUIRED_PARAMS:
        # Check presence
        if param not in data:
            errors.append(f"Missing required parameter: '{param}'")
            continue

        # Check type / coercibility
        try:
            value = float(data[param])
        except (TypeError, ValueError):
            errors.append(
                f"'{param}' must be a number, got: {repr(data[param])}"
            )
            continue

        # Check NaN / Inf
        if not np.isfinite(value) if _is_numpy(value) else (
            value != value or value == float("inf") or value == float("-inf")
        ):
            errors.append(f"'{param}' must be a finite number.")
            continue

        # Check bounds
        bounds = PARAM_BOUNDS[param]
        if value < bounds["min"] or value > bounds["max"]:
            errors.append(
                f"'{param}' = {value} is out of range "
                f"[{bounds['min']}, {bounds['max']}] {bounds['unit']}. "
                f"Hint: {bounds['hint']}"
            )
            continue

        cleaned[param] = value

    if errors:
        raise ValueError(" | ".join(errors))

    return cleaned


def _is_numpy(value):
    try:
        import numpy as np
        return isinstance(value, (np.floating, np.integer))
    except ImportError:
        return False


def get_param_schema() -> dict:
    """Return parameter schema — useful for frontend sliders/tooltips."""
    return PARAM_BOUNDS