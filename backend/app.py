from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load dataset (Make sure this path is correct)
DATA_PATH = "../data/diabetes_cleaned.csv"
df = pd.read_csv(DATA_PATH)

@app.route("/")
def home():
    return jsonify({"message": "Diabetes Insights API is running!"})

# Mapping Age 1-13 to actual age groups
AGE_GROUPS = {
    1: "18-24",
    2: "25-29",
    3: "30-34",
    4: "35-39",
    5: "40-44",
    6: "45-49",
    7: "50-54",
    8: "55-59",
    9: "60-64",
    10: "65-69",
    11: "70-74",
    12: "75-79",
    13: "80+"
}

EDUCATION_LEVELS = {
    1: "No Formal Education",
    2: "Elementary (Grades 1-8)",
    3: "Some High School (Grades 9-11)",
    4: "High School Graduate",
    5: "Some College, No Degree",
    6: "Associate Degree",
    7: "Bachelor's Degree",
    8: "Graduate Degree (Master's/PhD)"
}

@app.route("/data/summary")
def get_summary():
    total_cases = df["Diabetes_012"].count()
    highest_age_group_num = df["Age"].value_counts().idxmax()  # Most common age group (1-13)
    highest_age_group = AGE_GROUPS.get(highest_age_group_num, "Unknown")  # Convert to readable format
    top_risk_factor = df.drop(columns=["Diabetes_012"]).corrwith(df["Diabetes_012"]).abs().idxmax()

    summary = {
        "total_cases": int(total_cases),
        "highest_age_group": highest_age_group,  # Now returns "55-59" instead of 8
        "top_risk_factor": top_risk_factor
    }
    return jsonify(summary)

@app.route("/data/filter", methods=["POST"])
def get_cases_by_filters():
    data = request.json
    age_groups = data.get("age_groups", [])
    genders = data.get("genders", [])
    
    # Start with the full dataset
    filtered_df = df
    
    # Apply age filter if age groups are selected
    if age_groups:
        age_group_nums = [next((key for key, value in AGE_GROUPS.items() if value == age_group), None) for age_group in age_groups]
        age_group_nums = [num for num in age_group_nums if num is not None]  # Remove None values
        filtered_df = filtered_df[filtered_df["Age"].isin(age_group_nums)]
    
    # Apply gender filter if genders are selected
    if genders:
        # Convert gender values from string to integer
        gender_nums = [int(gender) for gender in genders]
        filtered_df = filtered_df[filtered_df["Sex"].isin(gender_nums)]
    
    # Calculate total cases
    total_cases = filtered_df["Diabetes_012"].count()
    
    return jsonify({"total_cases": int(total_cases)})

if __name__ == "__main__":
    app.run(debug=True)