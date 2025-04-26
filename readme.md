# Diabetes Insights – An Interactive Dashboard for Public Health Analytics

## Project Overview
The Diabetes Insights dashboard visualizes patterns of diabetes prevalence across different demographic groups and health behaviors.Users can explore how factors such as age, gender, education level, BMI, smoking status, physical activity, and healthcare access impact diabetes risk. It is intended to serve healthcare professionals, researchers, policymakers, and general users interested in understanding diabetes trends and risk factors.

The dashboard is designed following the key information visualization principles:

- Clarity and simplicity
- Interactive exploration
- Detail on demand
- Consistency and cognitive load reduction

# 1. Features

## Multi-page Dashboard:
- Overview Page: General diabetes insights.
- Demographic Analysis: Explore prevalence by age, gender, education.
- Health Factors: Analyze BMI, physical health, smoking, physical activity, healthcare access.
- Social Gradient: Visualize how income and education disparities impact diabetes rates.
## Interactive Visualizations:
- Brushing and linking across scatterplots and donut charts.
- Hover tooltips for detailed information.
- Dropdown filters for diabetes classes and gender categories.
- Responsive layout for different screen sizes.
## Data-Driven Insights:
- Clearly labeled and color-coded visual elements.
- Supports exploration of health disparities and social determinants of diabetes risk.

## 2. Prerequisites

Before running the project ensure you have the following installed 

- A modern web browser (such as Google Chrome, Mozilla Firefox, or Microsoft Edge) for viewing and interacting with the dashboard.
- A **virtual environment (venv)** set up
- Python 3.x installed - (Needed only if you want to run the backend server for dynamic data loading.)
- Required Python libraries

## **3. Setting Up the Virtual Environment**

To maintain dependencies and avoid conflicts, create and activate a virtual environment:

### **Windows**
```bash
python -m venv venv
venv\Scripts\activate
```

### **Mac/Linux**
```bash
python3 -m venv venv
source venv/bin/activate
```

Ensure that all necessary Python packages are installed before proceeding.


## 4. Technologies Used

- HTML / CSS / JavaScript
- D3.js (for dynamic and interactive visualizations)
- Chart.js (for supporting simple chart structures)
- Pandas and Flask (for data preparation and API, if running locally)

## 5. Clone the Repository


```python
! git clone https://github.com/jbhanuchai/Diabetes_insights.git
! cd Diabetes_insights

```

    Cloning into 'Diabetes_insights'...
    remote: Enumerating objects: 472, done.
    remote: Counting objects: 100% (120/120), done.
    remote: Compressing objects: 100% (72/72), done.
    remote: Total 472 (delta 64), reused 86 (delta 39), pack-reused 352 (from 1)
    Receiving objects: 100% (472/472), 10.62 MiB | 11.43 MiB/s, done.
    Resolving deltas: 100% (270/270), done.


## 6. Project Structure 

- backend/ – Python backend scripts (app.py, eda.py, preprocessing.py) and data files
- frontend/ – All dashboard code:
- static/ → CSS, JavaScript (D3.js), and optional images
- .html files → Main dashboard pages (index.html, diabetes_trends.html, etc)
- requirements.txt – Python dependencies (for backend use)
- package.json – npm setup (for running live-server)
- README.md – Project documentation

## 7. Running the Project 

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
