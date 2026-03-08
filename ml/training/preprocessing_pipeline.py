import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

from feature_engineering import generate_derived_features


DATA_PATH = "ml/data/exoplanet_training.csv"


def load_dataset():
    """
    Load training dataset.
    """
    df = pd.read_csv(DATA_PATH)
    return df


def add_derived_features(df):
    """
    Compute physics-based derived features for each planet.
    """

    derived_rows = []

    for _, row in df.iterrows():

        derived = generate_derived_features(row)

        derived_rows.append(derived)

    derived_df = pd.DataFrame(derived_rows)

    df = pd.concat([df, derived_df], axis=1)

    return df


def split_features_target(df):
    """
    Separate input features and target label.
    """

    X = df.drop(columns=["habitability_class"])
    y = df["habitability_class"]

    return X, y


def build_preprocessing_pipeline():
    """
    Create sklearn preprocessing pipeline.
    """

    pipeline = Pipeline(
        steps=[
            ("scaler", StandardScaler())
        ]
    )

    return pipeline


if __name__ == "__main__":

    df = load_dataset()

    df = add_derived_features(df)

    X, y = split_features_target(df)

    pipeline = build_preprocessing_pipeline()

    X_scaled = pipeline.fit_transform(X)

    print("Dataset shape:", X_scaled.shape)
    print("Preprocessing pipeline ready.")