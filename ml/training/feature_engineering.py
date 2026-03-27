"""
feature_engineering.py
-----------------------
CosmoLens AI — Planet Habitability Prediction System
Step 2: Derive physics-based features.

Location: ml/training/feature_engineering.py

Derived features:
  greenhouse_factor    = 1 + 0.3 * log10(stellar_flux + 1)
  surface_temperature  = equilibrium_temperature * greenhouse_factor
  atmospheric_pressure = planet_mass / planet_radius^2
"""

import pandas as pd
import numpy as np
import os

_BASE = os.path.join(os.path.dirname(__file__), "..")
CLEAN_DATA_PATH      = os.path.join(_BASE, "data", "exoplanet_clean.csv")
ENGINEERED_DATA_PATH = os.path.join(_BASE, "data", "exoplanet_engineered.csv")


def derive_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # greenhouse_factor: log10 compresses wide flux range into usable scale
    df["greenhouse_factor"] = 1.0 + 0.3 * np.log10(df["stellar_flux"] + 1)

    # surface_temperature: equilibrium temp adjusted for greenhouse warming
    df["surface_temperature"] = df["equilibrium_temperature"] * df["greenhouse_factor"]

    # atmospheric_pressure: surface gravity proxy (mass / radius^2), Earth = 1.0
    safe_radius = df["planet_radius"].clip(lower=0.1)
    df["atmospheric_pressure"] = df["planet_mass"] / (safe_radius ** 2)

    print(f"[feature_engineering] Derived 3 features for {len(df)} rows")
    print(f"  greenhouse_factor   : {df['greenhouse_factor'].min():.3f} – {df['greenhouse_factor'].max():.3f}")
    print(f"  surface_temperature : {df['surface_temperature'].min():.1f}K – {df['surface_temperature'].max():.1f}K")
    print(f"  atmospheric_pressure: {df['atmospheric_pressure'].min():.4f} – {df['atmospheric_pressure'].max():.1f}")
    return df


def save_engineered(df: pd.DataFrame, path: str = ENGINEERED_DATA_PATH) -> None:
    df.to_csv(path, index=False)
    print(f"[feature_engineering] Saved: {path}")


if __name__ == "__main__":
    df = pd.read_csv(CLEAN_DATA_PATH)
    df = derive_features(df)
    save_engineered(df)
