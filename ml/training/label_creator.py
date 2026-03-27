"""
label_creator.py
----------------
CosmoLens AI — Planet Habitability Prediction System
Step 3: Assign rule-based habitability labels.

Location: ml/training/label_creator.py

Labels:
  2 = Habitable           (all 4 conditions met)
  1 = Potentially Habitable (2-3 conditions met)
  0 = Non-Habitable       (0-1 conditions met)

Thresholds based on Kopparapu et al. 2013 habitable zone research.
"""

import pandas as pd
import numpy as np
import os

_BASE = os.path.join(os.path.dirname(__file__), "..")
ENGINEERED_DATA_PATH = os.path.join(_BASE, "data", "exoplanet_engineered.csv")
LABELED_DATA_PATH    = os.path.join(_BASE, "data", "exoplanet_labeled.csv")

TEMP_MIN,     TEMP_MAX     = 200.0, 320.0   # surface temperature (K)
FLUX_MIN,     FLUX_MAX     = 0.25,  1.5     # stellar flux (Earth = 1.0)
RADIUS_MIN,   RADIUS_MAX   = 0.5,   2.5     # planet radius (Earth radii)
PRESSURE_MIN, PRESSURE_MAX = 0.1,   10.0    # atmospheric pressure (Earth = 1.0)

LABEL_MAP = {0: "Non-Habitable", 1: "Potentially Habitable", 2: "Habitable"}


def assign_labels(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    temp_ok     = df["surface_temperature"].between(TEMP_MIN, TEMP_MAX)
    flux_ok     = df["stellar_flux"].between(FLUX_MIN, FLUX_MAX)
    radius_ok   = df["planet_radius"].between(RADIUS_MIN, RADIUS_MAX)
    pressure_ok = df["atmospheric_pressure"].between(PRESSURE_MIN, PRESSURE_MAX)

    score = temp_ok.astype(int) + flux_ok.astype(int) + \
            radius_ok.astype(int) + pressure_ok.astype(int)

    df["habitability_label"] = np.select(
        [score == 4, score >= 2],
        [2, 1],
        default=0
    )
    df["habitability_class"] = df["habitability_label"].map(LABEL_MAP)

    total = len(df)
    counts = df["habitability_class"].value_counts()
    print(f"[label_creator] Label distribution ({total} planets):")
    for label in ["Habitable", "Potentially Habitable", "Non-Habitable"]:
        n = counts.get(label, 0)
        print(f"  {label:25s}: {n:5d} ({100*n/total:.1f}%)")

    return df


def save_labeled(df: pd.DataFrame, path: str = LABELED_DATA_PATH) -> None:
    df.to_csv(path, index=False)
    print(f"[label_creator] Saved: {path}")


if __name__ == "__main__":
    df = pd.read_csv(ENGINEERED_DATA_PATH)
    df = assign_labels(df)
    save_labeled(df)
