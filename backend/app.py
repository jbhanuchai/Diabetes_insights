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

INCOME_LEVELS = {
  1: "Less than $10,000",
  2: "$10,000 - $14,999",
  3: "$15,000 - $19,999",
  4: "$20,000 - $24,999",
  5: "$25,000 - $34,999",
  6: "$35,000 - $49,999",
  7: "$50,000 - $74,999",
  8: "$75,000 or more"
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

@app.route("/data/income_diabetes")
def income_diabetes():
    gender_filter = request.args.get("gender", "All")

    diabetes_labels = {
        0: "No Diabetes",
        1: "Pre-Diabetes",
        2: "Diabetes"
    }

    gender_map = {
        1: "Male",
        0: "Female"
    }

    df_filtered = df.copy()
    if gender_filter in gender_map.values():
        gender_code = [k for k, v in gender_map.items() if v == gender_filter][0]
        df_filtered = df_filtered[df_filtered["Sex"] == gender_code]

    grouped = df_filtered.groupby(["Income", "Diabetes_012"]).size().reset_index(name="count")

    total_per_income = grouped.groupby("Income")["count"].sum().to_dict()

    results = []
    for _, row in grouped.iterrows():
        income = INCOME_LEVELS.get(int(row["Income"]), str(row["Income"]))
        diabetes = diabetes_labels.get(int(row["Diabetes_012"]), "Unknown")
        count = int(row["count"])
        total = total_per_income.get(row["Income"], 1)
        percent = round((count / total) * 100, 2)
        results.append({
            "income": income,
            "diabetes": diabetes,
            "count": count,
            "percent": percent
        })

    return jsonify(results)

@app.route("/data/gender_split_diabetic")
def gender_split_diabetic():
    diabetic_df = df[df["Diabetes_012"] == 2]

    gender_counts = diabetic_df["Sex"].value_counts().to_dict()
    total = sum(gender_counts.values())

    # Map 1 → Male, 0 → Female
    gender_map = {1: "Male", 0: "Female"}
    result = []
    for gender_code, count in gender_counts.items():
        label = gender_map.get(gender_code, "Unknown")
        percent = round((count / total) * 100, 2)
        result.append({
            "gender": label,
            "count": count,
            "percent": percent
        })

    return jsonify(result)

@app.route("/data/mobility_by_diabetes")
def mobility_by_diabetes():
    filter_type = request.args.get("filter", "income")  # income or education
    if filter_type not in ["income", "education"]:
        return jsonify([])

    group_col = "Income" if filter_type == "income" else "Education"
    
    results = []
    for diabetes_status in [0, 1, 2]:
        subset = df[df["Diabetes_012"] == diabetes_status]
        grouped = subset.groupby(group_col)
        
        for group_val, group_df in grouped:
            total = len(group_df)
            count_diff = group_df["DiffWalk"].sum()
            percent = round((count_diff / total) * 100, 2) if total > 0 else 0
            
            results.append({
                "group": INCOME_LEVELS.get(int(group_val), str(group_val)) if group_col == "Income" else EDUCATION_LEVELS.get(int(group_val), str(group_val))
,                "diabetes": diabetes_status,
                "count": int(count_diff),
                "total": int(total),
                "percent": percent
            })


    return jsonify(results)


@app.route("/data/diabetes_by_age_group", methods=["POST"])
def diabetes_by_age_group():
    data = request.json
    genders = data.get("genders", [])
    educations = data.get("educations", [])
    diabetes_status = data.get("diabetes_status", None)

    filtered_df = df.copy()

    # Apply filters
    if genders:
        gender_nums = [int(g) for g in genders]
        filtered_df = filtered_df[filtered_df["Sex"].isin(gender_nums)]

    if educations:
        education_nums = [key for key, value in EDUCATION_LEVELS.items() if value in educations]
        filtered_df = filtered_df[filtered_df["Education"].isin(education_nums)]

    result = []
    for age_num, label in AGE_GROUPS.items():
        group = filtered_df[filtered_df["Age"] == age_num]
        total = len(group)
        match_count = len(group[group["Diabetes_012"] == diabetes_status]) if diabetes_status is not None else 0
        percentage = round((match_count / total) * 100, 2) if total > 0 else 0
        result.append({"age_group": label, "percentage": percentage, "count": match_count})

    return jsonify(result)

@app.route("/data/diabetes_by_education", methods=["POST"])
def diabetes_by_education():
    data = request.json
    genders = data.get("genders", [])
    ages = data.get("ages", [])

    filtered_df = df.copy()

    if genders:
        gender_nums = [int(g) for g in genders]
        filtered_df = filtered_df[filtered_df["Sex"].isin(gender_nums)]

    if ages:
        age_nums = [key for key, value in AGE_GROUPS.items() if value in ages]
        filtered_df = filtered_df[filtered_df["Age"].isin(age_nums)]

    result = []

    for edu_num, edu_label in EDUCATION_LEVELS.items():
        edu_group = filtered_df[filtered_df["Education"] == edu_num]
        total = len(edu_group)

        for status in [0, 1, 2]:
            count = len(edu_group[edu_group["Diabetes_012"] == status])
            percentage = round((count / total) * 100, 2) if total > 0 else 0
            result.append({
                "education": edu_label,
                "status": status,
                "percentage": percentage,
                "count": count
            })

    return jsonify(result)

@app.route("/data/heatmap_age_income", methods=["POST"])
def heatmap_age_income():
    data = request.json
    genders = data.get("genders", [])
    educations = data.get("educations", [])
    age_groups = data.get("age_groups", [])
    diabetes_status = data.get("diabetes_status", None)

    filtered_df = df.copy()

    if genders:
        gender_nums = [int(g) for g in genders]
        filtered_df = filtered_df[filtered_df["Sex"].isin(gender_nums)]

    if educations:
        edu_nums = [key for key, val in EDUCATION_LEVELS.items() if val in educations]
        filtered_df = filtered_df[filtered_df["Education"].isin(edu_nums)]

    if age_groups:
        age_nums = [key for key, val in AGE_GROUPS.items() if val in age_groups]
        filtered_df = filtered_df[filtered_df["Age"].isin(age_nums)]
    else:
        age_nums = filtered_df["Age"].unique()

    result = []
    for age_num in sorted(age_nums):
        age_label = AGE_GROUPS.get(age_num, "Unknown")

        for income_level in sorted(filtered_df["Income"].unique()):
            subset = filtered_df[(filtered_df["Age"] == age_num) & (filtered_df["Income"] == income_level)]

            if diabetes_status is not None:
                subset = subset[subset["Diabetes_012"] == diabetes_status]

            total = len(subset)
            diabetic = len(subset[subset["Diabetes_012"] == 2])
            percentage = round((diabetic / total) * 100, 2) if total > 0 else 0

            result.append({
                "age_group": age_label,
                "income_level": str(income_level),
                "percentage": percentage,
                "count": diabetic
            })

    return jsonify(result)

@app.route("/data/scatter")
def get_scatter_data():
    try:
        # Return full dataset
        scatter_data = df[["BMI", "PhysHlth", "Diabetes_012"]].to_dict(orient="records")
        return jsonify(scatter_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
if __name__ == "__main__":
    app.run(debug=True)
