const API_BASE = "http://127.0.0.1:5000";

// Debounce function to limit update frequency
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Fetch scatterplot data from API
async function fetchScatterData() {
    try {
        console.log("Fetching scatterplot data from", `${API_BASE}/data/scatter`);
        const response = await fetch(`${API_BASE}/data/scatter`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log(`Fetched ${data.length} records. Sample:`, data.slice(0, 3));
        
        // Parse numeric fields and filter out invalid entries
        const validData = data
            .map(d => ({
                BMI: +d.BMI,
                PhysHlth: +d.PhysHlth,
                Diabetes_012: +d.Diabetes_012
            }))
            .filter(d => {
                const isValid = !isNaN(d.BMI) && !isNaN(d.PhysHlth) && !isNaN(d.Diabetes_012);
                if (!isValid) {
                    console.warn("Skipping invalid data point:", d);
                }
                return isValid;
            });

        // Map Diabetes Status
        const statusMap = { 0: "No Diabetes", 1: "Pre-Diabetes", 2: "Diabetes" };
        validData.forEach(d => d.DiabetesLabel = statusMap[d.Diabetes_012]);

        console.log(`After filtering invalid data, ${validData.length} records remain.`);
        return validData;
    } catch (error) {
        console.error("Error fetching scatterplot data:", error);
        return [];
    }
}

// Initialize scatterplot
function renderScatterplot(data) {
    const margin = { top: 20, right: 30, bottom: 50, left: 60 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Setup canvas
    const canvas = d3.select("#scatterplot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background", "transparent");

    const context = canvas.node().getContext("2d");

    // Setup SVG overlay for axes and legend
    const container = d3.select("#chart-container .bg-white.p-4.rounded-lg.shadow-md.flex-1");
    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("position", "absolute")
        .style("left", canvas.node().offsetLeft + "px")
        .style("top", canvas.node().offsetTop + "px")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(["No Diabetes", "Pre-Diabetes", "Diabetes"])
        .range(["#1f77b4", "#ff7f0e", "#2ca02c"]);

    // Add axis group containers
    const xAxisGroup = svg.append("g")
        .attr("class", "x-axis-group")
        .attr("transform", `translate(0,${height})`);

    const yAxisGroup = svg.append("g")
        .attr("class", "y-axis-group");

    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width - 120}, 10)`);

    ["No Diabetes", "Pre-Diabetes", "Diabetes"].forEach((label, i) => {
        legend.append("circle")
            .attr("cx", 0)
            .attr("cy", i * 20)
            .attr("r", 5)
            .attr("fill", colorScale(label));
        legend.append("text")
            .attr("x", 10)
            .attr("y", i * 20 + 5)
            .text(label)
            .attr("font-size", "12px");
    });

    return {
        canvas, context, svg,
        xScale, yScale, colorScale,
        width, height, margin,
        xAxisGroup, yAxisGroup
    };
}

// Update scatterplot with filtered data and precompute jittered positions
function updatePlot(data, chart, pointSize, bmiMin, bmiMax, physMin, physMax, selectedCategory) {
    const {
        canvas, context, xScale, yScale, colorScale,
        width, height, margin,
        xAxisGroup, yAxisGroup
    } = chart;

    // Apply filter first
    const filtered = data.filter(d =>
        d.BMI >= bmiMin &&
        d.BMI <= bmiMax &&
        d.PhysHlth >= physMin &&
        d.PhysHlth <= physMax
    );

    // Apply jitter to filtered data and store in the data objects
    const jitterAmount = 1; // Fixed jitter amount
    const random = d3.randomNormal.source(d3.randomLcg(42))(0, jitterAmount);
    filtered.forEach(d => {
        d.BMI_jitter = Math.max(0, d.BMI + random());
        d.PhysHlth_jitter = Math.max(0, d.PhysHlth + random());
    });

    // Determine scale domains from jittered data
    const jitteredBMIs = filtered.map(d => d.BMI_jitter);
    const jitteredPhys = filtered.map(d => d.PhysHlth_jitter);

    const bmiJitterMin = d3.min(jitteredBMIs) || 0;
    const bmiJitterMax = d3.max(jitteredBMIs) || 100;
    const physJitterMin = d3.min(jitteredPhys) || 0;
    const physJitterMax = d3.max(jitteredPhys) || 30;

    // Set axis domains based on jittered range
    xScale.domain([Math.floor(bmiJitterMin - 1), Math.ceil(bmiJitterMax + 1)]);
    yScale.domain([Math.floor(physJitterMin - 1), Math.ceil(physJitterMax + 1)]);

    // Clear canvas
    context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.attr("width"), canvas.attr("height"));

    // Redraw X Axis
    xAxisGroup.selectAll("*").remove();
    xAxisGroup.call(d3.axisBottom(xScale));
    xAxisGroup.append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("BMI");

    // Redraw Y Axis
    yAxisGroup.selectAll("*").remove();
    yAxisGroup.call(d3.axisLeft(yScale));
    yAxisGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -40)
        .attr("fill", "black")
        .attr("text-anchor", "middle")
        .text("Physically Unhealthy Days");

    // Draw points using precomputed jittered positions
    filtered.forEach(d => {
        const x = xScale(d.BMI_jitter) + margin.left;
        const y = yScale(d.PhysHlth_jitter) + margin.top;

        if (isNaN(x) || isNaN(y)) return;
        if (x < 0 || x > canvas.attr("width") || y < 0 || y > canvas.attr("height")) return;

        context.beginPath();
        context.arc(x, y, pointSize / 5, 0, 2 * Math.PI);
        context.fillStyle = colorScale(d.DiabetesLabel);
        context.globalAlpha = selectedCategory[0]
            ? (d.DiabetesLabel === selectedCategory[0] ? 1 : 0.3)
            : 1;
        context.fill();
        context.strokeStyle = "black";
        context.lineWidth = 0.1;
        context.stroke();
    });

    context.globalAlpha = 1;

    // Return filtered data with jittered positions for brushing
    return filtered;
}

// Setup enhanced brushing with drag support
function setupBrushing(data, chart, pointSize, bmiMin, bmiMax, physMin, physMax, selectedCategory) {
    const { svg, xScale, yScale, width, height, margin, colorScale, context, canvas } = chart;

    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start brush end", function(event) {
            const selection = event.selection;
            
            // Filter data based on slider settings
            const filteredData = data.filter(d => 
                d.BMI >= bmiMin && 
                d.BMI <= bmiMax && 
                d.PhysHlth >= physMin && 
                d.PhysHlth <= physMax
            );

            // Clear canvas
            context.clearRect(0, 0, canvas.attr("width"), canvas.attr("height"));
            context.fillStyle = "white";
            context.fillRect(0, 0, canvas.attr("width"), canvas.attr("height"));

            // Redraw points using precomputed jittered positions
            let renderedCount = 0;
            filteredData.forEach(d => {
                const x = xScale(d.BMI_jitter) + margin.left;
                const y = yScale(d.PhysHlth_jitter) + margin.top;

                // Skip if coordinates are invalid or out of bounds
                if (isNaN(x) || isNaN(y)) return;
                if (x < 0 || x > canvas.attr("width") || y < 0 || y > canvas.attr("height")) return;

                // Check if the point is within the brushed area
                let inBrush = true;
                if (selection) {
                    const [[x0, y0], [x1, y1]] = selection;
                    inBrush = x >= x0 + margin.left && x <= x1 + margin.left && y >= y0 + margin.top && y <= y1 + margin.top;
                }

                context.beginPath();
                context.arc(x, y, pointSize / 5, 0, 2 * Math.PI);
                context.fillStyle = colorScale(d.DiabetesLabel);
                context.globalAlpha = (selectedCategory[0] 
                    ? (d.DiabetesLabel === selectedCategory[0] ? 1 : 0.3)
                    : 1) * (inBrush ? 1 : 0.3);
                context.fill();
                context.strokeStyle = "black";
                context.lineWidth = 0.1;
                context.stroke();

                renderedCount++;
            });

            console.log(`Total points rendered during brushing: ${renderedCount}`);
            context.globalAlpha = 1;
        });

    // Enable moving the brush selection
    brush.on("start", function(event) {
        if (event.sourceEvent && event.sourceEvent.type === "mousedown") {
            d3.select(this).call(brush.move, null); // Clear existing selection on new brush start
        }
    });

    svg.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, null); // Initialize with no selection
}

// Setup tooltips and click interactions
function setupInteractions(data, chart, pointSize, bmiMin, bmiMax, physMin, physMax, selectedCategory) {
    const { canvas, xScale, yScale, colorScale, margin } = chart;

    canvas.on("mousemove", function(event) {
        const [mouseX, mouseY] = d3.pointer(event);
        const filteredData = data.filter(d => 
            d.BMI >= bmiMin && 
            d.BMI <= bmiMax && 
            d.PhysHlth >= physMin && 
            d.PhysHlth <= physMax
        );

        // Find nearest point
        let closest = null;
        let minDist = Infinity;
        filteredData.forEach(d => {
            const x = xScale(d.BMI_jitter) + margin.left;
            const y = yScale(d.PhysHlth_jitter) + margin.top;
            const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
            if (dist < minDist && dist < 20) {
                minDist = dist;
                closest = d;
            }
        });

        const tooltip = d3.select(".tooltip");
        if (closest) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`BMI: ${closest.BMI.toFixed(2)}<br>PhysHlth: ${closest.PhysHlth.toFixed(2)}<br>Diabetes: ${closest.DiabetesLabel}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        } else {
            tooltip.transition().duration(500).style("opacity", 0);
        }
    });

    canvas.on("click", function(event) {
        event.preventDefault(); // Prevent default to avoid unwanted behavior
        const [mouseX, mouseY] = d3.pointer(event);
        const filteredData = data.filter(d => 
            d.BMI >= bmiMin && 
            d.BMI <= bmiMax && 
            d.PhysHlth >= physMin && 
            d.PhysHlth <= physMax
        );

        let closest = null;
        let minDist = Infinity;
        filteredData.forEach(d => {
            const x = xScale(d.BMI_jitter) + margin.left;
            const y = yScale(d.PhysHlth_jitter) + margin.top;
            const dist = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
            if (dist < minDist && dist < 20) {
                minDist = dist;
                closest = d;
            }
        });

        if (closest) {
            console.log(`Selected category: ${closest.DiabetesLabel}`);
            selectedCategory[0] = selectedCategory[0] === closest.DiabetesLabel ? null : closest.DiabetesLabel; // Toggle selection
            updatePlot(data, chart, pointSize, bmiMin, bmiMax, physMin, physMax, selectedCategory);
        }
    });
}

// Setup sliders and event listeners
function setupSliders(data, chart, selectedCategory) {
    const sliders = {
        pointSize: document.getElementById("pointSize")
    };

    // Setup dual-range noUiSliders
    const bmiSlider = document.getElementById("bmiRangeSlider");
    const physSlider = document.getElementById("physRangeSlider");

    const bmiMinVal = 0;
    const bmiMaxVal = Math.ceil(d3.max(data, d => d.BMI)) || 100;
    const physMinVal = 0;
    const physMaxVal = Math.ceil(d3.max(data, d => d.PhysHlth)) || 30;

    noUiSlider.create(bmiSlider, {
        start: [bmiMinVal, bmiMaxVal],
        connect: true,
        step: 1,
        range: {
            min: bmiMinVal,
            max: bmiMaxVal
        }
    });

    noUiSlider.create(physSlider, {
        start: [physMinVal, physMaxVal],
        connect: true,
        step: 1,
        range: {
            min: physMinVal,
            max: physMaxVal
        }
    });

    const debouncedUpdate = debounce(() => {
        const [bmiMin, bmiMax] = bmiSlider.noUiSlider.get().map(Number);
        const [physMin, physMax] = physSlider.noUiSlider.get().map(Number);

        document.getElementById("pointSizeValue").innerText = sliders.pointSize.value;
        document.getElementById("bmiRangeValue").innerText = `[${bmiMin}, ${bmiMax}]`;
        document.getElementById("physRangeValue").innerText = `[${physMin}, ${physMax}]`;

        const filteredData = updatePlot(
            data,
            chart,
            +sliders.pointSize.value,
            bmiMin,
            bmiMax,
            physMin,
            physMax,
            selectedCategory
        );

        // Update brushing with the filtered data using chart.svg
        chart.svg.select(".brush").remove();
        setupBrushing(
            filteredData,
            chart,
            +sliders.pointSize.value,
            bmiMin,
            bmiMax,
            physMin,
            physMax,
            selectedCategory
        );
    }, 200);

    // Add event listeners
    sliders.pointSize.addEventListener("input", debouncedUpdate);
    bmiSlider.noUiSlider.on("update", debouncedUpdate);
    physSlider.noUiSlider.on("update", debouncedUpdate);

    // Initial render
    debouncedUpdate();
}

// Main initialization
document.addEventListener("DOMContentLoaded", async () => {
    const data = await fetchScatterData();
    if (data.length === 0) {
        console.error("No data to render. Check API endpoint and dataset.");
        return;
    }

    const chart = renderScatterplot(data);
    const selectedCategory = [null];
    setupInteractions(
        data,
        chart,
        25,
        d3.min(data, d => d.BMI) || 0,
        d3.max(data, d => d.BMI) || 100,
        d3.min(data, d => d.PhysHlth) || 0,
        d3.max(data, d => d.PhysHlth) || 30,
        selectedCategory
    );
    setupSliders(data, chart, selectedCategory);
});