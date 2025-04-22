export function updateDonutCharts(data) {
    const chartConfigs = [
        { id: "smokerChart", field: "Smoker", label: "Smoker" },
        { id: "activityChart", field: "PhysActivity", label: "Physical Activity" },
        { id: "healthcareChart", field: "AnyHealthcare", label: "Any Healthcare" },
        { id: "docCostChart", field: "NoDocbcCost", label: "No Doc Due to Cost" },
    ];

    chartConfigs.forEach(config => {
        const counts = d3.rollup(
            data,
            v => v.length,
            d => d[config.field]
        );

        const values = [counts.get(0) || 0, counts.get(1) || 0];
        const labels = ["No", "Yes"];

        drawDonut(`#${config.id}`, labels, values, config.label);
    });

    d3.select("#patientCount").text(`Total Patients: ${data.length}`);
}

function drawDonut(containerSelector, labels, values, title) {
    const width = 360;
    const height = 180;
    const radius = 50;
    const total = values[0] + values[1];

    if (total === 0) {
        d3.select(containerSelector).html(
            `<div style="text-align:center; font-size: 12px;">No Data</div>`
        );
        return;
    }

    const color = d3.scaleOrdinal()
        .domain(["No", "Yes"])
        .range(["#bdbdbd", "#43a2ca"]);

    d3.select(containerSelector).selectAll("*").remove();

    const svg = d3.select(containerSelector)
        .append("svg")
        .attr("width", width)
        .attr("height", height + 30);

   // Legend at top (dots spaced horizontally)
const legend = svg.append("g")
    .attr("transform", `translate(${width / 2}, 15)`);  // center top

const legendSpacing = 80;  // distance between dots

labels.forEach((label, i) => {
    const xOffset = (i - 0.5) * legendSpacing;

    // Dot
    legend.append("circle")
        .attr("cx", xOffset)
        .attr("cy", 0)
        .attr("r", 5)
        .attr("fill", color(label));

    // Label
    legend.append("text")
        .attr("x", xOffset + 8)
        .attr("y", 4)
        .style("font-size", "11px")
        .text(label);
});


    // Chart group (centered donut below legend)
    const chartGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2 + 20})`);

    const donutData = [
        { label: "No", value: values[0] },
        { label: "Yes", value: values[1] }
    ].filter(d => d.value > 0);

    const pie = d3.pie().sort(null).value(d => d.value);
    const arc = d3.arc().innerRadius(30).outerRadius(radius);
    const outerArc = d3.arc().innerRadius(radius + 8).outerRadius(radius + 8);

    const arcs = chartGroup.selectAll("arc")
        .data(pie(donutData))
        .enter()
        .append("g");

    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => color(d.data.label))
        .attr("stroke", "white")
        .style("stroke-width", "2px");

    arcs.append("polyline")
        .attr("points", d => {
            const posA = arc.centroid(d);
            const posB = outerArc.centroid(d);
            const posC = [...posB];
            posC[0] = (posB[0] > 0) ? posB[0] + 20 : posB[0] - 20;
            return [posA, posB, posC];
        })
        .style("fill", "none")
        .style("stroke", "gray")
        .style("stroke-width", 1)
        .style("opacity", 0.6);

    arcs.append("text")
        .text(d => {
            const count = d.data.value;
            const percent = ((count / total) * 100).toFixed(1);
            return `${count} (${percent}%)`;
        })
        .attr("transform", d => {
            const pos = outerArc.centroid(d);
            const offset = (pos[0] > 0) ? 20 : -20;
            return `translate(${pos[0] + offset}, ${pos[1]})`;
        })
        .style("text-anchor", d => (outerArc.centroid(d)[0] > 0 ? "start" : "end"))
        .style("font-size", "11px")
        .style("font-weight", "bold");

    svg.append("text")
        .attr("x", width / 2 - 30)
        .attr("y", height + 15)
        .attr("text-anchor", "middle")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .text(title);
}
