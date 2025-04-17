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

        const totalCasesElement = document.getElementById("totalCasesCount");
        if (totalCasesElement) {
            totalCasesElement.innerText = data.total_cases;
        }

        const highestAgeGroupElement = document.getElementById("highestAgeGroup");
        if (highestAgeGroupElement) {
            highestAgeGroupElement.innerText = data.highest_age_group;
        }

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

/// Update fetchFilteredData to include education
async function fetchFilteredData(ageGroups, genders, educations) {
    try {
        const response = await fetch(`${API_BASE}/data/filter`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
                age_groups: ageGroups, 
                genders: genders,
                educations: educations 
            }),
        });

        const data = await response.json();

        // Only update total cases if the element exists (to avoid errors)
        const totalCasesElement = document.getElementById("totalCasesCount");
        if (totalCasesElement) {
            totalCasesElement.innerText = data.total_cases;
        }

    } catch (error) {
        console.error("Error fetching filtered data:", error);
    }
}

// Update event listeners to include education checkboxes
document.querySelectorAll("#age-filters input, #sex-filters input, #education-filters input").forEach(checkbox => {
    checkbox.addEventListener("change", function () {
        let selectedAgeGroups = Array.from(document.querySelectorAll("#age-filters input:checked"))
                                    .map(cb => cb.value);
        let selectedGenders = Array.from(document.querySelectorAll("#sex-filters input:checked"))
                                  .map(cb => cb.value);
        let selectedEducations = Array.from(document.querySelectorAll("#education-filters input:checked"))
                                    .map(cb => cb.value);
        
        fetchFilteredData(selectedAgeGroups, selectedGenders, selectedEducations);
    });
});

document.addEventListener("DOMContentLoaded", function () {
    fetchSummaryData();
});