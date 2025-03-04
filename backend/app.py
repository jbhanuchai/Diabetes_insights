from flask import Flask, jsonify
import pandas as pd
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load dataset (Make sure this path is correct)
DATA_PATH = "../data/preprocessed_data.csv"
df = pd.read_csv(DATA_PATH)

@app.route("/")
def home():
    return jsonify({"message": "Diabetes Insights API is running!"})

@app.route("/data/summary")
def get_summary():
    total_cases = df["Diabetes_012"].count()
    highest_age_group = df["Age"].value_counts().idxmax()
    top_risk_factor = df.drop(columns=["Diabetes_012"]).corrwith(df["Diabetes_012"]).abs().idxmax()

    summary = {
        "total_cases": int(total_cases),
        "highest_age_group": int(highest_age_group),
        "top_risk_factor": top_risk_factor
    }
    return jsonify(summary)

if __name__ == "__main__":
    app.run(debug=True)
