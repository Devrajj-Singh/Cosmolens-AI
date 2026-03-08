import numpy as np

# Physical constants
G = 6.67430e-11
EARTH_MASS = 5.972e24
EARTH_RADIUS = 6.371e6
BOLTZMANN = 1.380649e-23
PROTON_MASS = 1.6726219e-27


def compute_surface_gravity(mass_earth, radius_earth):
    """
    Surface gravity relative to Earth.
    """
    mass = mass_earth * EARTH_MASS
    radius = radius_earth * EARTH_RADIUS
    gravity = G * mass / (radius ** 2)
    return gravity


def compute_escape_velocity(mass_earth, radius_earth):
    """
    Escape velocity in m/s.
    """
    mass = mass_earth * EARTH_MASS
    radius = radius_earth * EARTH_RADIUS
    velocity = np.sqrt((2 * G * mass) / radius)
    return velocity


def compute_equilibrium_temperature(stellar_flux):
    """
    Approximate planetary equilibrium temperature.
    Earth reference = 255K
    """
    return 255 * (stellar_flux ** 0.25)


def compute_habitable_zone_flag(stellar_flux):
    """
    Returns 1 if flux is inside rough habitable zone.
    """
    if 0.75 <= stellar_flux <= 1.5:
        return 1
    return 0


def compute_atmosphere_retention(escape_velocity, temperature):
    """
    Estimate atmosphere retention ability.
    """
    thermal_velocity = np.sqrt((3 * BOLTZMANN * temperature) / PROTON_MASS)
    return escape_velocity / thermal_velocity


def generate_derived_features(row):
    """
    Generate all physics-based derived features.
    Input: dictionary containing planet parameters.
    """

    gravity = compute_surface_gravity(
        row["planet_mass"], row["planet_radius"]
    )

    escape_velocity = compute_escape_velocity(
        row["planet_mass"], row["planet_radius"]
    )

    equilibrium_temp = compute_equilibrium_temperature(
        row["stellar_flux"]
    )

    habitable_zone = compute_habitable_zone_flag(
        row["stellar_flux"]
    )

    atmosphere_score = compute_atmosphere_retention(
        escape_velocity, row["surface_temperature"]
    )

    return {
        "surface_gravity": gravity,
        "escape_velocity": escape_velocity,
        "equilibrium_temperature": equilibrium_temp,
        "habitable_zone_flag": habitable_zone,
        "atmosphere_retention_score": atmosphere_score
    }