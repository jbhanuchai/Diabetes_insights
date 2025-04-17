const API_BASE = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
    renderLineChart();

    document.getElementById("genderSelect").addEventListener("change", renderLineChart);
    document.getElementById("diabetesTypeSelect").addEventListener("change", renderLineChart);
    document.getElementById("fixedYAxis").addEventListener("change", renderLineChart);
});

async function renderLineChart() {
    const gender = document.getElementById("genderSelect").value;
    const diabetesStatus = document.getElementById("diabetesTypeSelect").value;
    const fixedY = document.getElementById("fixedYAxis").checked;

    const genders = gender === "all" ? [] : [gender];
    const statuses = diabetesStatus === "all" ? [0, 1, 2] : [+diabetesStatus];

    const statusLabels = {
        0: "No Diabetes",
        1: "Pre-Diabetes",
        2: "Diabetes"
    };

    const statusColors = {
        0: "#9b59b6",   // purple
        1: "#2ecc71",   // green
        2: "#e91e63"    // pink
    };

    // Fetch data for each status
    const datasets = await Promise.all(
        statuses.map(async (status) => {
            const response = await fetch(`${API_BASE}/data/diabetes_by_age_group`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ genders, educations: [], diabetes_status: status })
            });
            const data = await response.json();
            return { status, data };
        })
    );

    d3.select("#line-chart").selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 60, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#line-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const ageGroups = datasets[0].data.map(d => d.age_group);
    const x = d3.scalePoint().domain(ageGroups).range([0, width]).padding(0.6);

    const allPoints = datasets.flatMap(d => d.data);
    const y = d3.scaleLinear()
        .domain([0, fixedY ? 100 : d3.max(allPoints, d => d.percentage) * 1.1])
        .range([height, 0]);

    // Persistent axis groups
    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis");

    // Animate axis ticks
    xAxisGroup.transition().duration(800).call(d3.axisBottom(x));
    yAxisGroup.transition().duration(800).call(d3.axisLeft(y));

    // Axis labels
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 70)
    .style("font-size", "14px")
    .style("opacity", 0)
    .text("Age Group")
    .transition()
    .duration(750)
    .attr("y", height + 50)
    .style("opacity", 1);

    // Animated Y-axis label
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -65)
    .style("font-size", "14px")
    .style("opacity", 0)
    .text("Diabetes Prevalence (%)")
    .transition()
    .duration(750)
    .attr("y", -45)
    .style("opacity", 1);


    const line = d3.line()
        .x(d => x(d.age_group))
        .y(d => y(d.percentage));

    const tooltip = d3.select("#line-chart")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background-color", "white")
        .style("padding", "6px")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none");

    datasets.forEach(({ status, data }) => {
        const color = statusColors[status];

        // Animate line drawing
        const path = svg.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2)
            .attr("d", line);

        const totalLength = path.node().getTotalLength();
        path
            .attr("stroke-dasharray", `${totalLength} ${totalLength}`)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(1200)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);

        // Animate circles
        svg.selectAll(`.circle-${status}`)
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => x(d.age_group))
            .attr("cy", d => y(d.percentage))
            .attr("r", 0)
            .attr("fill", color)
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.age_group}</strong><br/>
                           Status: ${statusLabels[status]}<br/>
                           Diabetes: ${d.percentage}%<br/>
                           Count: ${d.count}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
            })
            .transition()
            .duration(800)
            .attr("r", 5);
    });
}
