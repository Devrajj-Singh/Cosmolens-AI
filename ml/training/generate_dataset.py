import numpy as np
import pandas as pd

"""
Planet Habitability Dataset Generator

This script generates a physics-inspired synthetic dataset
for training the Planet Habitability ML model.

The dataset simulates planetary systems with realistic
astronomical parameter ranges.
"""

N_SAMPLES_PER_CLASS = 1500


def generate_planet():
    """Generate a random planetary system."""
    return {
        "planet_mass": np.random.uniform(0.1, 10),
        "planet_radius": np.random.uniform(0.5, 3),
        "surface_temperature": np.random.uniform(150, 500),
        "atmospheric_pressure": np.random.uniform(0.01, 100),
        "greenhouse_factor": np.random.uniform(0, 1),
        "semi_major_axis": np.random.uniform(0.05, 5),
        "orbital_period": np.random.uniform(10, 3000),
        "stellar_flux": np.random.uniform(0.1, 3),
        "star_temperature": np.random.uniform(2500, 8000),
        "star_luminosity": np.random.uniform(0.01, 50),
    }


def classify_habitability(planet):
    """
    Rule-based habitability classifier inspired by
    habitable zone and planetary conditions.
    """

    flux = planet["stellar_flux"]
    temp = planet["surface_temperature"]
    pressure = planet["atmospheric_pressure"]

    # Habitable
    if 0.8 <= flux <= 1.3 and 260 <= temp <= 320 and 0.5 <= pressure <= 5:
        return 2

    # Potentially Habitable
    if 0.5 <= flux <= 2.0 and 200 <= temp <= 400:
        return 1

    # Non-Habitable
    return 0


dataset = []

counts = {0: 0, 1: 0, 2: 0}

target_per_class = N_SAMPLES_PER_CLASS

while min(counts.values()) < target_per_class:

    planet = generate_planet()

    label = classify_habitability(planet)

    if counts[label] < target_per_class:

        planet["habitability_class"] = label
        dataset.append(planet)

        counts[label] += 1


df = pd.DataFrame(dataset)

df.to_csv("ml/data/exoplanet_training.csv", index=False)

print("Dataset generated successfully.")
print("Class distribution:")
print(df["habitability_class"].value_counts())