# 🤖 Machine Learning — CosmoLens AI

This folder contains the complete Machine Learning pipeline for the Planet Habitability Prediction System.

It is strictly separated from the backend API layer to maintain modular architecture.

The ML layer is responsible for:

- Dataset preparation
- Feature engineering
- Model training
- Model evaluation
- Model serialization
- Inference logic

The backend only loads trained models and calls inference functions.

---

## 📂 Folder Structure

ml/
├── data/              → Raw & processed datasets
├── notebooks/         → Experiments and research
├── training/          → Model training scripts
├── inference/         → Prediction logic (used by backend)
├── models/            → Serialized trained models (.pkl / .joblib)
└── README.md

---

## 🧠 Architecture Principle

Frontend → Backend API → ML Inference → Trained Model

- ML training logic MUST NOT exist inside backend/
- Backend must only import inference functions
- Model files must be loaded from ml/models/

---

## 🎯 Responsibilities

ML Engineer must:

- Clean and preprocess datasets
- Implement feature engineering
- Train and validate models
- Tune hyperparameters
- Evaluate model performance (Accuracy, F1, ROC-AUC)
- Serialize final trained model
- Maintain reproducible training scripts

---

## 📊 Model Requirements

The Planet AI model must:

- Support multi-class classification:
  - Non-Habitable
  - Potentially Habitable
  - Habitable

- Provide:
  - Prediction label
  - Probability distribution
  - Feature importance ranking

---

## 🚫 Rules

- Never push large raw datasets (>100MB)
- Never commit temporary notebook checkpoints
- Do not hardcode file paths
- Do not mix training logic with API logic
- Trained models must be versioned properly

---

## 🔄 Workflow

1. Prepare dataset in `data/`
2. Experiment in `notebooks/`
3. Move stable logic to `training/`
4. Train final model
5. Save model to `models/`
6. Implement prediction logic in `inference/`
7. Backend imports inference function only

---

## 🧩 Integration Rule

Backend must import like:

from ml.inference.predict import predict_habitability

Backend should NEVER contain model training code.