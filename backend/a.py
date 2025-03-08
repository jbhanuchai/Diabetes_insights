import pandas as pd

# Path to your CSV file
csv_file = "../data/diabetes_cleaned.csv"

# Read CSV file into a DataFrame
df = pd.read_csv(csv_file)

# Assuming age group "18-24" is represented by the number 1 in the 'Age' column
age_group_number = 2  # for age group 18-24

# Filter the DataFrame for the selected age group and count the diabetes cases
total_cases = df[df["Age"] == age_group_number]["Diabetes_012"].count()

print("Total diabetes cases for age 18-24:", total_cases)

# Get total number of rows and columns
total_rows, total_columns = df.shape

print(f"Total number of rows: {total_rows}")
print(f"Total number of columns: {total_columns}")

num_males = (df["Sex"] == 1).sum()
num_females = (df["Sex"] == 0).sum()

# Print results
print(f"Number of Males: {num_males}")
print(f"Number of Females: {num_females}")