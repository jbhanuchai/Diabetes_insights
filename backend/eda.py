import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import math

# Load dataset
file_path = "../data/diabetes_012_health_indicators_BRFSS2015.csv"
df = pd.read_csv(file_path)

print("Dataset Shape before dropping:", df.shape)
# Drop Duplicates
df_cleaned = df.drop_duplicates()

# 1. Basic Info
print("Dataset Shape:", df_cleaned.shape)
print("\nColumn Data Types:")
print(df_cleaned.dtypes)
print("\nMissing Values:")
print(df_cleaned.isnull().sum().sum())

# 2. Summary Statistics
print("\nSummary Statistics:")
print(df_cleaned.describe())

# Save the cleaned dataset
cleaned_file_path = "../data/diabetes_cleaned.csv"
df_cleaned.to_csv(cleaned_file_path, index=False)

print(f"Cleaned dataset saved at: {cleaned_file_path}")
