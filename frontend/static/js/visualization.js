let currentScale = 'auto'; 
async function fetchChartData() {
    try {
        // Clear previous elements
        d3.select("#chart-container").html("");
        document.getElementById("chart-error").style.display = "none";

        // Get active filters
        const selectedAges = Array.from(document.querySelectorAll('#age-filters input:checked'))
                                .map(cb => cb.value);
        const selectedGenders = Array.from(document.querySelectorAll('#sex-filters input:checked'))
                                  .map(cb => cb.value);
        const selectedEducations = Array.from(document.querySelectorAll('#education-filters input:checked'))
                                    .map(cb => cb.value);

        // Fetch data
        const response = await fetch("http://127.0.0.1:5000/data/age-prevalence", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                age_groups: selectedAges,
                genders: selectedGenders,
                educations: selectedEducations
            })
        });

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const rawData = await response.json();
        
        // Validate and format data
        const validatedData = rawData.map(item => ({
            Age_Group: item.Age_Group,
            Prevalence: Math.min(Math.max(Number(item.Prevalence) || 0, 0), 100) // Clamp to 0-100%
        })).sort((a, b) => {
            // Sort by numeric age value
            const ageA = parseInt(a.Age_Group.split('-')[0]);
            const ageB = parseInt(b.Age_Group.split('-')[0]);
            return ageA - ageB;
        });

        renderChart(validatedData);

    } catch (error) {
        showChartError(`Failed to load data: ${error.message}`);
        console.error("Fetch error:", error);
    }
}

function renderChart(data) {
    const container = d3.select("#chart-container");
    container.html("");

    if (!data || data.length === 0) {
        container.append("div")
            .classed("no-data", true)
            .text("No data available for current filters");
        return;
    }

    // Chart dimensions
    const width = 800, height = 400;
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };

    // Create SVG
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // X-axis scale
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.Age_Group))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    // Y-axis scale configuration
    
    const yMax = currentScale === 'fixed' ? 100 : d3.max(data, d => d.Prevalence) || 100;
    // Y-axis scale (0-100%)
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height - margin.bottom, margin.top])
        .nice();

    // Line generator
    const line = d3.line()
        .x(d => xScale(d.Age_Group) + xScale.bandwidth() / 2)
        .y(d => yScale(d.Prevalence))
        .curve(d3.curveMonotoneX);

    // Draw line
    svg.append("path")
        .datum(data)
        .attr("class", "chart-line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#e43f5a")
        .attr("stroke-width", 3);

    // Add axes
    svg.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.5em")
            .attr("transform", "rotate(-45)");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d}%`)); // Show 10 ticks (0-100%)

    // Add labels
    svg.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height - 10)
        .text("Age Group");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 10)
        .attr("x", -height / 2)
        .text("Diabetes Prevalence (%)");
}

// Replace the scale toggle handlers section with:
document.getElementById('auto-scale').addEventListener('click', function() {
    currentScale = 'auto';
    document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    fetchChartData();
});

document.getElementById('fixed-scale').addEventListener('click', function() {
    currentScale = 'fixed';
    document.querySelectorAll('.scale-btn').forEach(btn => btn.classList.remove('active'));
    this.classList.add('active');
    fetchChartData();
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    fetchChartData();
    document.querySelectorAll(".filter-group input").forEach(checkbox => {
        checkbox.addEventListener("change", fetchChartData);
    });
});