import pandas as pd

# Load the dataset
file_path = "../data/diabetes_012_health_indicators_BRFSS2015.csv"
df = pd.read_csv(file_path)

# Remove columns with excessive missing values
df_cleaned = df.dropna(axis=1)

# Convert categorical columns to appropriate formats
df_cleaned["Diabetes_012"] = df_cleaned["Diabetes_012"].astype(int)  # Ensure diabetes status is integer
df_cleaned["Sex"] = df_cleaned["Sex"].astype(int)  # Convert gender to integer
df_cleaned["Education"] = df_cleaned["Education"].astype(int)  # Convert education to integer
df_cleaned["Income"] = df_cleaned["Income"].astype(int)  # Convert income to integer
df_cleaned["Age"] = df_cleaned["Age"].astype(int)  # Ensure Age is numeric

# Convert general health (GenHlth) to categorical for easy visualization
df_cleaned["GenHlth"] = df_cleaned["GenHlth"].astype(int)

# Ensure all remaining columns used for correlation analysis are numeric
numeric_cols = df_cleaned.select_dtypes(include=["int64", "float64"]).columns
df_cleaned = df_cleaned[numeric_cols]

# Save the cleaned dataset
cleaned_file_path = "../data/diabetes_cleaned.csv"
df_cleaned.to_csv(cleaned_file_path, index=False)

print(f"Cleaned dataset saved at: {cleaned_file_path}")
