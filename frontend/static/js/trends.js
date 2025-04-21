
const INCOME_LEVELS = {
    1: "Less than $10,000",
    2: "$10,000 - $14,999",
    3: "$15,000 - $19,999",
    4: "$20,000 - $24,999",
    5: "$25,000 - $34,999",
    6: "$35,000 - $49,999",
    7: "$50,000 - $74,999",
    8: "$75,000 or more"
};

const API_BASE = "http://127.0.0.1:5000";

const statusLabels = {
    0: "No Diabetes",
    1: "Pre-Diabetes",
    2: "Diabetes"
};

const statusColors = {
    0: "#9b59b6",  // Purple
    1: "#2ecc71",  // Green
    2: "#e91e63"   // Pink
};

document.addEventListener("DOMContentLoaded", () => {
    renderLineChart();
    renderGroupedBarChart();
    fetchHeatmapAgeIncome();
    document.getElementById("genderSelect").addEventListener("change", renderLineChart);
    document.getElementById("diabetesTypeSelect").addEventListener("change", renderLineChart);
    document.getElementById("fixedYAxis").addEventListener("change", renderLineChart);
    document.getElementById("genderSelect").addEventListener("change", renderGroupedBarChart);
    document.getElementById("ageGroupSelect").addEventListener("change", renderGroupedBarChart);
    document.getElementById("fixedYAxis").addEventListener("change", renderGroupedBarChart);
    document.getElementById("diabetesTypeSelect").addEventListener("change", renderGroupedBarChart);
    document.getElementById("ageGroupSelect").addEventListener("change", renderLineChart);
});

async function renderLineChart() {
    const gender = document.getElementById("genderSelect").value;
    const selectedAge = document.getElementById("ageGroupSelect").value;
    const diabetesStatus = document.getElementById("diabetesTypeSelect").value;
    const fixedY = document.getElementById("fixedYAxis").checked;

    const genders = gender === "all" ? [] : [gender];
    const statuses = diabetesStatus === "all" ? [0, 1, 2] : [+diabetesStatus];

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

    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis");

    xAxisGroup.transition().duration(800).call(d3.axisBottom(x));
    yAxisGroup.transition().duration(800).call(d3.axisLeft(y));
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width / 2)
    .attr("y", height + 70)
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("opacity", 0)
    .text("Age Group")
    .transition()
    .duration(750)
    .attr("y", height + 50)
    .style("opacity", 1);

    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -65)
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("opacity", 0)
    .text("Diabetes Prevalence (%)")
    .transition()
    .duration(750)
    .attr("y", -45)
    .style("opacity", 1);


    const line = d3.line()
        .x(d => x(d.age_group))
        .y(d => y(d.percentage));
        
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
    tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip");
    }


    datasets.forEach(({ status, data }) => {
        const color = statusColors[status];
        data.forEach(d => d.status = status);
        if (selectedAge === "all") {
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
                .duration(800)
                .ease(d3.easeLinear)
                .attr("stroke-dashoffset", 0);
        }
        
        svg.selectAll(`.circle-${status}`)
            .data(selectedAge === "all" ? data : data.filter(d => d.age_group === selectedAge))
            .enter()
            .append("circle")
            .attr("cx", d => x(d.age_group))
            .attr("cy", d => y(d.percentage))
            .attr("r", 0)
            .attr("fill", color)
            .on("mouseover", function (event, d) {
                tooltip
                  .style("opacity", 1)
                  .html(`
                    <strong>Age Group:</strong> ${d.age_group}<br/>
                    <strong>Status:</strong> ${statusLabels[d.status]}<br/>
                    <strong>Diabetes:</strong> ${d.percentage}%<br/>
                    <strong>Count:</strong> ${d.count}
                  `)
                  .style("left", `${event.pageX + 12}px`)
                  .style("top", `${event.pageY - 28}px`);
            })
            .on("mousemove", (event) => {
                tooltip
                  .style("left", `${event.pageX + 12}px`)
                  .style("top", `${event.pageY - 28}px`);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            })                          
            .transition()
            .duration(800)
            .attr("r", 5);
    });
}

async function renderGroupedBarChart() {
    const gender = document.getElementById("genderSelect").value;
    const age = document.getElementById("ageGroupSelect").value;
    const diabetesStatus = document.getElementById("diabetesTypeSelect").value;
    const fixedY = document.getElementById("fixedYAxis").checked;

    const genders = gender === "all" ? [] : [parseInt(gender)];
    const ages = age === "all" ? [] : [age];
    const subgroups = diabetesStatus === "all" ? [0, 1, 2] : [parseInt(diabetesStatus)];

    const response = await fetch(`${API_BASE}/data/diabetes_by_education`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genders, ages })
    });
    let data = await response.json();

    data = data.filter(d => subgroups.includes(d.status));

    const svgId = "#bar-chart-education";
    d3.select(svgId).selectAll("*").remove();

    const margin = { top: 30, right: 30, bottom: 70, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const educationLevels = [...new Set(data.map(d => d.education))];

    const x0 = d3.scaleBand()
        .domain(educationLevels)
        .range([0, width])
        .paddingInner(0.1);

    const x1 = d3.scaleBand()
        .domain(subgroups)
        .range([0, x0.bandwidth()])
        .padding(0.05);

    const y = d3.scaleLinear()
        .domain([0, fixedY ? 100 : d3.max(data, d => d.percentage) * 1.2])
        .range([height, 0]);

    const xAxisGroup = svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${height})`);

    xAxisGroup.transition()
    .duration(800)
    .call(d3.axisBottom(x0))
    .selection()
    .selectAll("text")
    .style("font-size", "12px")
    .style("text-anchor", "middle");
    const yAxisGroup = svg.append("g")
    .attr("class", "y-axis");

    yAxisGroup.transition()
    .duration(800)
    .call(d3.axisLeft(y));

    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");
    }

    svg.append("g")
        .selectAll("g")
        .data(d3.group(data, d => d.education))
        .join("g")
        .attr("transform", d => `translate(${x0(d[0])},0)`)
        .selectAll("rect")
        .data(d => d[1])
        .join("rect")
        .attr("x", d => x1(d.status))
        .attr("y", y(0))
        .attr("width", x1.bandwidth())
        .attr("height", 0)
        .attr("fill", d => statusColors[d.status])
        .on("mouseover", function (event, d) {
            tooltip.style("opacity", 1)
                .html(`<strong>${d.education}</strong><br/>
                       Status: ${statusLabels[d.status]}<br/>
                       ${d.percentage}% (${d.count} people)`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => tooltip.style("opacity", 0))
        .transition()
        .duration(800)
        .attr("y", d => y(d.percentage))
        .attr("height", d => height - y(d.percentage));
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + 60)
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .text("Education Level")
        .transition()
        .duration(750)
        .attr("y", height + 45)
        .style("opacity", 1);
    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .text("Diabetes Prevalence (%)")
        .transition()
        .duration(750)
        .attr("y", -40)
        .style("opacity", 1);
}

async function fetchHeatmapAgeIncome() {
    const gender = document.getElementById("genderSelect").value;
    const diabetesStatus = document.getElementById("diabetesTypeSelect").value;
    const educationSelect = document.getElementById("educationSelect");
    const ageGroup = document.getElementById("ageGroupSelect").value;

    const educations = educationSelect ? (educationSelect.value === "all" ? [] : [educationSelect.value]) : [];

    const genders = gender === "all" ? [] : [parseInt(gender)];
    const diabetes_status = diabetesStatus === "all" ? null : parseInt(diabetesStatus);
    const age_groups = ageGroup === "all" ? [] : [ageGroup];

    const response = await fetch(`${API_BASE}/data/heatmap_age_income`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genders, educations, age_groups, diabetes_status })
    });

    const data = await response.json();
    data.forEach(d => d.income_level = parseInt(d.income_level));
    renderHeatmapAgeIncome(data, "#heatmap-age-income");
}

function renderHeatmapAgeIncome(data, svgId) {
    d3.select(svgId).selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 60, left: 80 };
    const width = 700 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(svgId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const ageGroups = [...new Set(data.map(d => d.age_group))];
    const incomeLevels = [...new Set(data.map(d => d.income_level))];

    const x = d3.scaleBand().domain(incomeLevels).range([0, width]).padding(0.05);
    const y = d3.scaleBand().domain(ageGroups).range([0, height]).padding(0.05);
    const maxPercentage = d3.max(data, d => d.percentage);
    const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxPercentage]);

    // Axes with animated ticks
    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis");

    xAxisGroup.transition()
        .duration(800)
        .call(d3.axisBottom(x).tickFormat(d => INCOME_LEVELS[d]))
        .selection()
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end")
        .style("font-size", "12px")
        .style("opacity", 0)
        .transition()
        .duration(750)
        .style("opacity", 1);    

    xAxisGroup.selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    yAxisGroup.transition()
        .duration(800)
        .call(d3.axisLeft(y))
        .selection()
        .selectAll("text")
        .style("font-size", "12px")
        .style("opacity", 0)
        .transition()
        .duration(750)
        .style("opacity", 1);

    // Animated axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 65)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .text("Income Level")
        .transition()
        .duration(700)
        .attr("y", height + 45)
        .style("opacity", 1);

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -75)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("opacity", 0)
        .text("Age Group")
        .transition()
        .duration(700)
        .attr("y", -55)
        .style("opacity", 1);

    // Tooltip
    let tooltip = d3.select("body").select(".tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip");
    }

    // Cells
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.income_level))
        .attr("y", d => y(d.age_group))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .style("fill", d => color(d.percentage))
        .style("opacity", 0.85)
        .on("mouseover", function(event, d) {
            d3.select(this).style("stroke", "#222").style("stroke-width", 1.5);
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <strong>Age:</strong> ${d.age_group}<br/>
                <strong>Income:</strong> ${d.income_level}<br/>
                <strong>Diabetes:</strong> ${d.percentage}%<br/>
                <strong>Count:</strong> ${d.count}
            `)
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mousemove", function(event) {
            tooltip.style("left", (event.pageX + 12) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).style("stroke", "none");
            tooltip.transition().duration(300).style("opacity", 0);
        });

    // Color Legend
    const legendWidth = 200;
    const legendHeight = 12;

    const defs = svg.append("defs");
    const linearGradient = defs.append("linearGradient").attr("id", "heatmap-gradient");
    linearGradient.selectAll("stop")
        .data([
            { offset: "0%", color: color(0) },
            { offset: "100%", color: color(maxPercentage) }
        ])
        .enter()
        .append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    svg.append("rect")
        .attr("x", width - legendWidth)
        .attr("y", -25)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)");

    const legendScale = d3.scaleLinear()
        .domain([0, maxPercentage])
        .range([0, legendWidth]);

    svg.append("g")
        .attr("transform", `translate(${width - legendWidth}, -10)`)
        .call(d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => `${d}%`)
            .tickSize(3))
        .selectAll("text")
        .style("font-size", "10px");

    svg.append("text")
        .attr("x", width - legendWidth / 2)
        .attr("y", -35)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .text("Diabetes (%)");
}
