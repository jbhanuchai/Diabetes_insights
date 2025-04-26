# Diabetes Insights – An Interactive Dashboard for Public Health Analytics

## Overview

**Diabetes Insights** is an interactive data visualization dashboard designed to explore diabetes prevalence and associated risk factors across different population groups.  
Leveraging publicly available health data, the dashboard enables users to investigate how variables such as:

- Age
- Gender
- Education
- BMI
- Physical Activity
- Smoking Status
- Healthcare Access  

relate to diabetes outcomes.

Built using **HTML**, **CSS**, **JavaScript** (with **D3.js** and **Chart.js**), the dashboard provides an intuitive, responsive, and user-driven exploration experience.  
It includes interactive charts, dynamic filtering, brushing, and detail-on-demand features.  
Optional backend support is available via **Flask** and **Python** for dynamic data processing and API integration.

## Features

- **Interactive Visualizations:** Line graphs, bar charts, heatmaps, scatterplots, and donut charts.
- **Dynamic Filtering:** Filter by demographics, diabetes status, income groups, and more.
- **Brushing & Hover Effects:** Explore specific groups and discover hidden patterns.
- **Responsive Design:** Works smoothly across laptops, tablets, and mobile devices.
- **Real-Time Updates:** Filters update charts immediately without reloading.

## Target Audience

- **Healthcare Professionals** — for population risk analysis and clinical insights.
- **Researchers** — for analyzing behavioral, clinical, and social determinants of health.
- **Policymakers** — for identifying high-risk groups and supporting interventions.
- **General Public** — for improving awareness about diabetes risk factors.

## Technology Stack

- **Frontend:**  
  - HTML5
  - CSS3
  - JavaScript (D3.js, Chart.js)

- **Backend (Optional):**
  - Python (Flask)
  - Pandas (for data processing)

## Project Motivation

Existing dashboards often lacked:
- Interactivity and multi-factor exploration
- Focus on behavioral and social determinants (e.g., income, education)
- Accessibility for non-technical audiences

**Diabetes Insights** bridges these gaps by offering a dynamic, exploratory, and user-friendly platform for analyzing diabetes-related health data.

## Structure

| Page | Description |
|:-----|:------------|
| **Overview** | Home base with quick stats and navigation |
| **Demographic Trends** | Diabetes trends by age, education, and income |
| **Health-Related Factors** | Behavioral risk factors like BMI, smoking, physical health |
| **Health Disparities** | Gender-based, income-based, and education-based disparities |

## Installation (Optional - For Backend)

```bash
# Clone the repository
git clone https://github.com/yourusername/diabetes-insights-dashboard.git

# Navigate into the project directory
cd diabetes-insights-dashboard

# Install Python dependencies
pip install -r requirements.txt

# Run the Flask app
python app.py
```

## Running the Project 

- To run the dashboard (frontend) the user need to install 
   - Node.js
- live-server (via npm) used to serve dashboard locally:

```bash
cd Diabetes_insights/frontend
npx live-server --port=5500
```

- To run the backend 

```bash
cd Diabetes_insights/backend
python3 app.py  
```

Frontend files (index.html, CSS, JS) can be opened directly without Flask unless dynamic APIs are used.

## Folder Structure
```
diabetes-insights-dashboard/
│
├── static/
│   ├── css/
│   └── js/
│
├── templates/
│   └── index.html
│
├── data/
│   └── diabetes_data.csv
│
├── app.py  (optional backend)
├── README.md
└── requirements.txt
```
