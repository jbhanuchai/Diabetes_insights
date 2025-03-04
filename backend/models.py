import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.decomposition import PCA

# Load Dataset
DATA_PATH = "../data/diabetes_012_health_indicators_BRFSS2015.csv"
df = pd.read_csv(DATA_PATH)

# Handling Missing Data (if any)
df.dropna(inplace=True)

# Standardizing Continuous Features
scaler = StandardScaler()
continuous_features = ["BMI", "MentHlth", "PhysHlth"]
df[continuous_features] = scaler.fit_transform(df[continuous_features])

# Encoding Categorical Variables
categorical_features = ["Sex", "Smoker", "HighBP", "HighChol", "AnyHealthcare", "GenHlth", "Education", "Income"]
encoder = LabelEncoder()
for feature in categorical_features:
    df[feature] = encoder.fit_transform(df[feature])

# Applying PCA for Dimensionality Reduction
pca = PCA(n_components=2)  # Reduce to 2 components for visualization
pca_features = pca.fit_transform(df.drop(columns=["Diabetes_012"]))  # Exclude target variable
df["PCA1"], df["PCA2"] = pca_features[:, 0], pca_features[:, 1]

# Save Preprocessed Data
df.to_csv("../data/preprocessed_data.csv", index=False)

print("Data Preprocessing Complete. Preprocessed dataset saved.")
