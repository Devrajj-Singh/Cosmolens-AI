"""
train_model.py
--------------
CosmoLens AI — Planet Habitability Prediction System
Step 4: Train, evaluate, calibrate, and serialize the ML model.

Location: ml/training/train_model.py

Covers GitHub issues #19–#24 in EPIC-4.
"""

import pandas as pd
import numpy as np
import pickle
import os
import json

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    accuracy_score,
    f1_score,
)

_BASE          = os.path.join(os.path.dirname(__file__), "..")
LABELED_DATA_PATH = os.path.join(_BASE, "data",   "exoplanet_labeled.csv")
MODEL_PATH        = os.path.join(_BASE, "models", "habitability_model.pkl")
METRICS_PATH      = os.path.join(_BASE, "models", "training_metrics.json")
FEATURES_PATH     = os.path.join(_BASE, "models", "feature_importance.json")

# 10 features: 7 raw NASA + 3 derived
FEATURE_COLS = [
    "planet_mass",
    "planet_radius",
    "orbital_period",
    "semi_major_axis",
    "stellar_flux",
    "equilibrium_temperature",
    "star_temperature",
    "greenhouse_factor",
    "surface_temperature",
    "atmospheric_pressure",
]

TARGET_COL   = "habitability_label"
CLASS_NAMES  = ["Non-Habitable", "Potentially Habitable", "Habitable"]

RF_PARAMS = {
    "n_estimators": 200,
    "max_depth": 15,
    "min_samples_split": 5,
    "min_samples_leaf": 2,
    "class_weight": "balanced",
    "random_state": 42,
    "n_jobs": -1,
}


def load_data(path: str = LABELED_DATA_PATH):
    df = pd.read_csv(path)
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values
    print(f"[train_model] Loaded {X.shape[0]} samples, {X.shape[1]} features")
    return X, y, df


def train(X, y):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"[train_model] Train: {len(X_train)} | Test: {len(X_test)}")

    rf = RandomForestClassifier(**RF_PARAMS)

    # Issue #21: probability calibration via Platt scaling
    calibrated_model = CalibratedClassifierCV(rf, method="sigmoid", cv=5)
    calibrated_model.fit(X_train, y_train)
    print("[train_model] Trained with probability calibration (Platt/sigmoid)")

    # Issue #22: evaluation metrics
    y_pred = calibrated_model.predict(X_test)
    accuracy    = accuracy_score(y_test, y_pred)
    f1_macro    = f1_score(y_test, y_pred, average="macro")
    f1_weighted = f1_score(y_test, y_pred, average="weighted")
    cm          = confusion_matrix(y_test, y_pred)

    print(f"\n[train_model] ── Evaluation ──")
    print(f"  Accuracy      : {accuracy:.4f}")
    print(f"  F1 (macro)    : {f1_macro:.4f}")
    print(f"  F1 (weighted) : {f1_weighted:.4f}")
    print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

    cv_scores = cross_val_score(rf, X, y, cv=5, scoring="f1_macro")
    print(f"  5-Fold CV F1  : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    metrics = {
        "accuracy":     round(float(accuracy), 4),
        "f1_macro":     round(float(f1_macro), 4),
        "f1_weighted":  round(float(f1_weighted), 4),
        "cv_f1_mean":   round(float(cv_scores.mean()), 4),
        "cv_f1_std":    round(float(cv_scores.std()), 4),
        "train_size":   int(len(X_train)),
        "test_size":    int(len(X_test)),
        "confusion_matrix": cm.tolist(),
    }
    return calibrated_model, metrics


# Issue #23: feature importance
def extract_feature_importance(model, feature_names):
    importances = np.mean(
        [clf.estimator.feature_importances_ for clf in model.calibrated_classifiers_],
        axis=0
    )
    ranked = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)

    print("\n[train_model] ── Feature Importance ──")
    for i, (name, score) in enumerate(ranked, 1):
        bar = "█" * int(score * 40)
        print(f"  {i:2d}. {name:30s}: {score:.4f}  {bar}")

    return {name: round(float(score), 6) for name, score in ranked}


# Issue #24: serialize model
def save_model(model, path: str = MODEL_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    payload = {
        "model":        model,
        "feature_cols": FEATURE_COLS,
        "class_names":  CLASS_NAMES,
        "label_map":    {0: "Non-Habitable", 1: "Potentially Habitable", 2: "Habitable"},
    }
    with open(path, "wb") as f:
        pickle.dump(payload, f)
    print(f"\n[train_model] Model saved: {path}")


def save_metrics(metrics, path: str = METRICS_PATH):
    with open(path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[train_model] Metrics saved: {path}")


def save_feature_importance(importance, path: str = FEATURES_PATH):
    with open(path, "w") as f:
        json.dump(importance, f, indent=2)
    print(f"[train_model] Feature importance saved: {path}")


# Inference helper used by backend/services/planet_service.py
def load_model(path: str = MODEL_PATH):
    with open(path, "rb") as f:
        return pickle.load(f)


def predict(model_payload: dict, input_features: dict) -> dict:
    model        = model_payload["model"]
    feature_cols = model_payload["feature_cols"]
    class_names  = model_payload["class_names"]

    X = np.array([[input_features[col] for col in feature_cols]])
    label_idx = model.predict(X)[0]
    probas    = model.predict_proba(X)[0]

    return {
        "predicted_class": class_names[label_idx],
        "confidence": round(float(probas[label_idx]), 4),
        "all_probabilities": {
            name: round(float(p), 4)
            for name, p in zip(class_names, probas)
        },
    }


if __name__ == "__main__":
    X, y, df = load_data()
    model, metrics = train(X, y)
    importance = extract_feature_importance(model, FEATURE_COLS)
    save_model(model)
    save_metrics(metrics)
    save_feature_importance(importance)
    print("\n[train_model] Done.")
