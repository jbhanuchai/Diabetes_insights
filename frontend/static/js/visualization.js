let currentScale = 'auto';

async function fetchChartData() {
    try {
        d3.select("#chart-container").html("");
        document.getElementById("chart-error").style.display = "none";

        const selectedAges = Array.from(document.querySelectorAll('#age-filters input:checked')).map(cb => cb.value);
        const selectedGenders = Array.from(document.querySelectorAll('#sex-filters input:checked')).map(cb => cb.value);
        const selectedEducations = Array.from(document.querySelectorAll('#education-filters input:checked')).map(cb => cb.value);

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
        
        const validatedData = rawData.map(item => ({
            Age_Group: item.Age_Group,
            Prevalence: item.Prevalence,
            Total: item.total_cases,
            Diabetic: item.diabetes_cases
        })).sort((a, b) => {
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

    const width = 800, height = 400;
    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const tooltip = d3.select("#tooltip");

    // Create SVG first
    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height);

    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.Age_Group))
        .range([margin.left, width - margin.right])
        .padding(0.2);

    const yMax = currentScale === 'fixed' ? 100 : d3.max(data, d => d.Prevalence) || 100;
    const yScale = d3.scaleLinear()
        .domain([0, yMax])
        .range([height - margin.bottom, margin.top])
        .nice();

    // Draw line
    const line = d3.line()
        .x(d => xScale(d.Age_Group) + xScale.bandwidth() / 2)
        .y(d => yScale(d.Prevalence))
        .curve(d3.curveMonotoneX);

    svg.append("path")
        .datum(data)
        .attr("class", "chart-line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "#e43f5a")
        .attr("stroke-width", 3);

    // Add data points
    svg.selectAll(".data-point")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xScale(d.Age_Group) + xScale.bandwidth() / 2)
        .attr("cy", d => yScale(d.Prevalence))
        .attr("r", 4)
        .attr("fill", "#e43f5a")
        .on("mouseover", (event, d) => {
            tooltip
                .html(`
                    <strong>Age Group: ${d.Age_Group}</strong><br>
                    Prevalence: ${d.Prevalence}%<br>
                    Diabetic Cases: ${d.Diabetic}<br>
                `)
                .style("opacity", 1)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => {
            tooltip.style("opacity", 0);
        });

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
        .call(d3.axisLeft(yScale).ticks(10).tickFormat(d => `${d}%`));

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
        .text("Prevalence (%)");
}

// Scale toggle handlers
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