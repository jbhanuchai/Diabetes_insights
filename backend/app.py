from flask import Flask, jsonify, request
import pandas as pd
from flask_cors import CORS
from flask_cors import cross_origin

app = Flask(__name__)
CORS(app, supports_credentials=True, origins="*")

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

@app.route("/data/education_gender_diabetes")
def education_gender_diabetes():
    # Filter for diabetic only
    diabetic_df = df[df["Diabetes_012"] == 2]

    # Education mapping
    education_labels = {
        1: "No Education", 2: "Elementary School", 3: "High School",
        4: "College", 5: "Under Graduate", 6: "Post Graduate"
    }

    # Group by education and gender, then count
    grouped = diabetic_df.groupby(["Education", "Sex"]).size().reset_index(name="count")

    # Total per education for percentage
    total_per_education = grouped.groupby("Education")["count"].sum().to_dict()

    # Format response with type conversion
    results = []
    for _, row in grouped.iterrows():
        education = education_labels.get(int(row["Education"]), "Unknown")
        gender = "Male" if int(row["Sex"]) == 1 else "Female"
        count = int(row["count"])
        total = int(total_per_education.get(row["Education"], 1))
        percent = round((count / total) * 100, 2)

        results.append({
            "education": education,
            "gender": gender,
            "count": count,
            "percent": percent
        })

    return jsonify(results)

if __name__ == "__main__":
    app.run(debug=True)
