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

// Fetch data for combined filters (age and gender)
async function fetchFilteredData(ageGroups, genders) {
    try {
        const response = await fetch(`${API_BASE}/data/filter`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ age_groups: ageGroups, genders: genders }),
        });
        const data = await response.json();
        
        // Update the UI with the fetched data
        document.getElementById("totalCasesCount").innerText = data.total_cases;
    } catch (error) {
        console.error("Error fetching filtered data:", error);
    }
}

// Add event listeners for age and gender checkboxes
document.querySelectorAll("#age-filters input, #sex-filters input").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        let selectedAgeGroups = Array.from(document.querySelectorAll("#age-filters input:checked"))
                                    .map(cb => cb.value);
        let selectedGenders = Array.from(document.querySelectorAll("#sex-filters input:checked"))
                                  .map(cb => cb.value);
        
        // Fetch data for combined filters
        fetchFilteredData(selectedAgeGroups, selectedGenders);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    fetchSummaryData();
});