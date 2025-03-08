from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/data/*": {"origins": "*"}})

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
    1: "No Education",
    2: "Elementary School",
    3: "High School",
    4: "College",
    5: "Under Graduate",
    6: "Post Graduate"
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

@app.route("/data/sample")
def get_sample_data():
    sample_data = df[["Age", "BMI"]].head(10).to_dict(orient="records")
    return jsonify(sample_data)

# Update the /data/filter endpoint
@app.route("/data/filter", methods=["POST"])
def get_cases_by_filters():
    data = request.json
    age_groups = data.get("age_groups", [])
    genders = data.get("genders", [])
    educations = data.get("educations", [])  # New education filter
    
    filtered_df = df
    
    # Age filter
    if age_groups:
        age_group_nums = [key for key, value in AGE_GROUPS.items() if value in age_groups]
        filtered_df = filtered_df[filtered_df["Age"].isin(age_group_nums)]
    
    # Gender filter
    if genders:
        gender_nums = [int(gender) for gender in genders]
        filtered_df = filtered_df[filtered_df["Sex"].isin(gender_nums)]
    
    # Education filter (new)
    if educations:
        education_nums = [key for key, value in EDUCATION_LEVELS.items() if value in educations]
        filtered_df = filtered_df[filtered_df["Education"].isin(education_nums)]
    
    total_cases = filtered_df["Diabetes_012"].count()
    
    return jsonify({"total_cases": int(total_cases)})

@app.route("/data/age-prevalence", methods=["POST"])
def get_age_prevalence():
    try:
        filters = request.json
        filtered_df = df.copy()
        
        # Apply filters
        if filters.get("age_groups"):
            age_codes = [k for k, v in AGE_GROUPS.items() if v in filters["age_groups"]]
            filtered_df = filtered_df[filtered_df["Age"].isin(age_codes)]
        
        if filters.get("genders"):
            filtered_df = filtered_df[filtered_df["Sex"].isin([int(g) for g in filters["genders"]])]
        
        if filters.get("educations"):
            edu_codes = [k for k, v in EDUCATION_LEVELS.items() if v in filters["educations"]]
            filtered_df = filtered_df[filtered_df["Education"].isin(edu_codes)]
        
        # Create base dataframe with all age groups
        all_ages = pd.DataFrame({
            "Age": AGE_GROUPS.keys(),
            "Age_Group": AGE_GROUPS.values()
        })
        
        # Calculate prevalence percentage (0-100%)
        result = filtered_df.groupby("Age")["Diabetes_012"].apply(
            lambda x: round((x == 2.0).mean() * 100, 2)  # Convert to percentage
        ).reset_index()
        
        # Merge with all ages to ensure completeness
        merged = pd.merge(all_ages, result, on="Age", how="left")
        merged["Prevalence"] = merged["Diabetes_012"].fillna(0).clip(0, 100)
        
        return jsonify(
            merged[["Age_Group", "Prevalence"]]
            .to_dict(orient="records")
        )
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)
