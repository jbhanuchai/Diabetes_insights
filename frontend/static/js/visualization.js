async function fetchChartData() {
    try {
        const response = await fetch("http://127.0.0.1:5000/data/sample"); // Use the correct API
        const data = await response.json();
        console.log("Fetched Data:", data);
        
        if (!Array.isArray(data)) {
            throw new Error("Expected an array but received an object");
        }
        
        renderChart(data);
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function renderChart(data) {
    if (!Array.isArray(data)) {
        console.error("renderChart expected an array, received:", data);
        return;
    }

    const width = 600, height = 300;
    
    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const xScale = d3.scaleBand().domain(data.map(d => d.Age)).range([50, width - 50]).padding(0.2);
    const yScale = d3.scaleLinear().domain([0, d3.max(data, d => d.BMI)]).range([height - 50, 50]);

    svg.append("g").attr("transform", `translate(0, ${height - 50})`).call(d3.axisBottom(xScale));
    svg.append("g").attr("transform", "translate(50, 0)").call(d3.axisLeft(yScale));

    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.Age))
        .attr("y", d => yScale(d.BMI))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - 50 - yScale(d.BMI))
        .attr("fill", "#1abc9c");
}

document.addEventListener("DOMContentLoaded", () => {
    fetchChartData();
});
