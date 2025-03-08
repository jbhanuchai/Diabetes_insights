import pandas as pd

# Load the dataset
file_path = "../data/diabetes_012_health_indicators_BRFSS2015.csv"  # Update the path if necessary
df = pd.read_csv(file_path)

# Remove columns with missing values
df_cleaned = df.dropna(axis=1)

# Save the cleaned dataset
cleaned_file_path = "../data/diabetes_cleaned.csv"
df_cleaned.to_csv(cleaned_file_path, index=False)

print(f"Cleaned dataset saved at: {cleaned_file_path}")
