const API_BASE = "http://127.0.0.1:5000";  // Backend API URL

async function fetchSummaryData() {
    try {
        console.log("Fetching summary data...");

        const response = await fetch(`${API_BASE}/data/summary`);
        const data = await response.json();

        console.log("Fetched Summary Data:", data);

        animateCounter("totalCases", data.total_cases);
        animateCounter("highestAgeGroup", data.highest_age_group);
        document.querySelector(".risk-text").innerHTML = `<b>${data.top_risk_factor}</b>`;

        // Add tooltips
        document.getElementById("totalCasesCard").setAttribute("data-tooltip", "Total number of recorded diabetes cases.");
        document.getElementById("highestAgeGroupCard").setAttribute("data-tooltip", "Age group with the highest diabetes cases.");
        document.getElementById("topRiskFactorCard").setAttribute("data-tooltip", "The most common risk factor for diabetes.");
    } catch (error) {
        console.error("Error fetching summary data:", error);
    }
}

function animateCounter(elementId, targetNumber) {
    let count = 0;
    let increment = Math.ceil(targetNumber / 100);

    function updateCounter() {
        if (count < targetNumber) {
            count += increment;
            document.getElementById(elementId).querySelector(".count").innerText = count;
            setTimeout(updateCounter, 10);
        } else {
            document.getElementById(elementId).querySelector(".count").innerText = targetNumber;
        }
    }

    updateCounter();
}

document.addEventListener("DOMContentLoaded", function () {
    fetchSummaryData();
});
