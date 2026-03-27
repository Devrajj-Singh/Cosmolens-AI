"""
run_pipeline.py
---------------
CosmoLens AI - Planet Habitability Prediction System

Master script: runs all 4 pipeline steps in sequence.

Place this file at:  ml/run_pipeline.py
All pipeline scripts must be in:  ml/training/

Usage (from inside the ml/ folder):
    python run_pipeline.py

Steps:
    1. preprocessing.py       → data/exoplanet_clean.csv
    2. feature_engineering.py → data/exoplanet_engineered.csv
    3. label_creator.py       → data/exoplanet_labeled.csv
    4. train_model.py         → models/habitability_model.pkl
                                models/training_metrics.json
                                models/feature_importance.json
"""

import sys
import os

# Add ml/training/ to path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "training"))

from preprocessing import load_and_clean, save_clean
from feature_engineering import derive_features, save_engineered
from label_creator import assign_labels, save_labeled
from train_model import train, extract_feature_importance
from train_model import save_model, save_metrics, save_feature_importance
from train_model import FEATURE_COLS

print("=" * 60)
print("  CosmoLens AI — ML Pipeline")
print("=" * 60)

# Step 1: Preprocess
print("\n── Step 1: Preprocessing ──")
df_clean = load_and_clean()
save_clean(df_clean)

# Step 2: Feature engineering
print("\n── Step 2: Feature Engineering ──")
df_eng = derive_features(df_clean)
save_engineered(df_eng)

# Step 3: Label creation
print("\n── Step 3: Label Creation ──")
df_labeled = assign_labels(df_eng)
save_labeled(df_labeled)

# Step 4: Train model
print("\n── Step 4: Model Training ──")
X = df_labeled[FEATURE_COLS].values
y = df_labeled["habitability_label"].values
print(f"[run_pipeline] Training on {len(X)} samples, {len(FEATURE_COLS)} features")

calibrated_model, metrics = train(X, y)
importance = extract_feature_importance(calibrated_model, FEATURE_COLS)

save_model(calibrated_model)
save_metrics(metrics)
save_feature_importance(importance)

print("\n" + "=" * 60)
print("  Pipeline complete!")
print(f"  Accuracy  : {metrics['accuracy']}")
print(f"  F1 (macro): {metrics['f1_macro']}")
print("  Model saved to: ml/models/habitability_model.pkl")
print("=" * 60)
