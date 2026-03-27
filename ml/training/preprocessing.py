"""
preprocessing.py
----------------
CosmoLens AI — Planet Habitability Prediction System
Step 1: Load and clean the NASA Exoplanet Archive CSV.

Location: ml/training/preprocessing.py
"""

import pandas as pd
import numpy as np
import os

# ml/training/ → go up one level to ml/ → then into data/
_BASE = os.path.join(os.path.dirname(__file__), "..")
RAW_DATA_PATH   = os.path.join(_BASE, "data", "exoplanet_raw.csv")
CLEAN_DATA_PATH = os.path.join(_BASE, "data", "exoplanet_clean.csv")

NASA_FEATURE_COLS = [
    "pl_bmasse",   # planet mass (Earth masses)
    "pl_rade",     # planet radius (Earth radii)
    "pl_orbper",   # orbital period (days)
    "pl_orbsmax",  # semi-major axis (AU)
    "pl_insol",    # stellar flux (Earth flux units)
    "pl_eqt",      # equilibrium temperature (K)
    "st_teff",     # stellar effective temperature (K)
]

RENAMED_COLS = {
    "pl_bmasse":  "planet_mass",
    "pl_rade":    "planet_radius",
    "pl_orbper":  "orbital_period",
    "pl_orbsmax": "semi_major_axis",
    "pl_insol":   "stellar_flux",
    "pl_eqt":     "equilibrium_temperature",
    "st_teff":    "star_temperature",
}


def load_and_clean(raw_path: str = RAW_DATA_PATH) -> pd.DataFrame:
    print(f"[preprocessing] Loading: {raw_path}")
    df = pd.read_csv(raw_path, comment="#")
    print(f"[preprocessing] Raw dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    df = df[NASA_FEATURE_COLS].copy()

    before = len(df)
    df.dropna(subset=NASA_FEATURE_COLS, inplace=True)
    print(f"[preprocessing] Dropped {before - len(df)} rows with missing values → {len(df)} remaining")

    df.rename(columns=RENAMED_COLS, inplace=True)

    # Sanity filters
    df = df[df["planet_mass"] > 0]
    df = df[df["planet_radius"] > 0]
    df = df[df["orbital_period"] > 0]
    df = df[df["semi_major_axis"] > 0]
    df = df[df["stellar_flux"] >= 0]
    df = df[df["equilibrium_temperature"] > 0]
    df = df[df["star_temperature"] > 0]
    print(f"[preprocessing] After sanity filters: {len(df)} rows")

    df.reset_index(drop=True, inplace=True)
    return df


def save_clean(df: pd.DataFrame, path: str = CLEAN_DATA_PATH) -> None:
    df.to_csv(path, index=False)
    print(f"[preprocessing] Saved: {path}")


if __name__ == "__main__":
    df = load_and_clean()
    save_clean(df)
    print(df.describe().round(3))
