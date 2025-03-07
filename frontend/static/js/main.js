const API_BASE = "http://127.0.0.1:5000"; 

// Animate only the number for Total Diabetes Cases
function animateCounter(elementId, targetNumber) {
    let count = 0;
    let increment = Math.ceil(targetNumber / 100);
    
    function updateCounter() {
        if (count < targetNumber) {
            count += increment;
            document.getElementById(elementId).innerText = count;
            setTimeout(updateCounter, 10);
        } else {
            document.getElementById(elementId).innerText = targetNumber;
        }
    }
    updateCounter();
}

// Fetch and update summary data
async function fetchSummaryData() {
    try {
        console.log("Fetching summary data...");
        const response = await fetch(`${API_BASE}/data/summary`);
        const data = await response.json();

        document.getElementById("totalCasesCount").innerText = data.total_cases;
        document.getElementById("highestAgeGroup").innerText = data.highest_age_group;

    } catch (error) {
        console.error("Error fetching summary data:", error);
    }
}

function showFilter(type) {
    console.log(`Filter selected: ${type}`);
    
    document.querySelectorAll('.filter-group').forEach(div => div.style.display = 'none');
    
    document.getElementById(`${type}-filters`).style.display = 'flex';
    
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    document.querySelector(`button[onclick="showFilter('${type}')"]`).classList.add('active');
}

document.addEventListener("DOMContentLoaded", function () {
    fetchSummaryData();
});

document.querySelectorAll("#education-filters input").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        let selectedEducation = Array.from(document.querySelectorAll("#education-filters input:checked"))
                                    .map(cb => cb.value);
        console.log("Selected Education Levels:", selectedEducation);
    });
});
