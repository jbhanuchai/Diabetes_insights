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

        // Update only the number inside the span
        document.getElementById("totalCasesCount").innerText = data.total_cases;
        document.getElementById("highestAgeGroup").innerText = data.highest_age_group;

    } catch (error) {
        console.error("Error fetching summary data:", error);
    }
}


// Show the correct filter and highlight the selected button
function showFilter(type) {
    console.log(`Filter selected: ${type}`);
    
    // Hide all filter groups first
    document.querySelectorAll('.filter-group').forEach(div => div.style.display = 'none');
    
    // Show only the selected filter group
    document.getElementById(`${type}-filters`).style.display = 'flex';
    
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to the selected filter button
    document.querySelector(`button[onclick="showFilter('${type}')"]`).classList.add('active');
}

// Ensure JavaScript runs after DOM content is loaded
document.addEventListener("DOMContentLoaded", function () {
    fetchSummaryData();
});
