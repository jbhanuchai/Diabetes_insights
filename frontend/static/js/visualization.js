async function fetchChartData() {
    try {
        const response = await fetch(`${API_BASE}/data/sample`); // Use the correct API
        
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

let showPercentage = true;
let selectedGender = "All";

// Create tooltip once
let tooltip = d3.select("body").select(".tooltip");
if (tooltip.empty()) {
  tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "rgba(255, 255, 0, 0.95)")
    .style("border", "1px solid red")
    .style("color", "#000")
    .style("padding", "8px 12px")
    .style("font-size", "13px")
    .style("font-family", "Poppins, sans-serif")
    .style("border-radius", "6px")
    .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("z-index", 10000)
    .style("max-width", "260px")
    .style("white-space", "normal")
    .style("word-wrap", "break-word");
}

async function renderGenderEducationStackedBar() {
  const data = await fetch(`${API_BASE}/data/education_gender_diabetes`).then(res => res.json());

  const filteredData = selectedGender === "All" ? data : data.filter(d => d.gender === selectedGender);
  const groupedData = d3.group(filteredData, d => d.education);
  const educationLevels = Array.from(groupedData.keys());
  const genders = ["Male", "Female"];

  const transformed = educationLevels.map(edu => {
    const entry = { education: edu };
    genders.forEach(g => {
      const row = groupedData.get(edu)?.find(d => d.gender === g);
      entry[g] = showPercentage ? (row?.percent || 0) : (row?.count || 0);
      entry[`${g}_raw`] = row?.count || 0;
    });
    return entry;
  });

  const margin = { top: 40, right: 30, bottom: 100, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  d3.select("#chart-education-gender").html("");

  const svg = d3.select("#chart-education-gender")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 60)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(educationLevels).range([0, width]).padding(0.2);
  const yMax = showPercentage ? 100 : d3.max(transformed, d => d.Male + d.Female);
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);

  const color = d3.scaleOrdinal().domain(genders).range(["#377eb8", "#e41a1c"]);
  const stack = d3.stack().keys(genders);
  const series = stack(transformed);

  const yAxis = svg.selectAll(".y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis");

  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  const xAxisGroup = svg.append("g")
    .attr("transform", `translate(0, ${height})`)
    .attr("class", "x-axis")
    .call(d3.axisBottom(x));
  xAxisGroup.selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  const layer = svg.selectAll("g.layer")
    .data(series, d => d.key)
    .join("g")
    .attr("class", "layer")
    .attr("fill", d => color(d.key));

  const bars = layer.selectAll("rect")
    .data(d => d)
    .join("rect")
    .attr("x", d => x(d.data.education))
    .attr("width", x.bandwidth())
    .attr("y", d => y(0))
    .attr("height", 0)
    .on("mouseover", function (event, d) {
        const gender = this.parentNode.__data__.key;
        const edu = d.data.education;
        const percent = d[1] - d[0];
        const raw = d.data[`${gender}_raw`];
      
        tooltip.transition().duration(150).style("opacity", 1);
      
        tooltip
          .html(`
            <strong>Education:</strong> ${edu}<br/>
            <strong>Gender:</strong> ${gender}<br/>
            <strong>${showPercentage ? "Diabetes %" : "Count"}:</strong> 
            ${showPercentage ? percent.toFixed(2) + "%" : raw}
          `);
      })
      
    .on("mousemove", (event) => {
      const tooltipWidth = tooltip.node().offsetWidth;
      const tooltipHeight = tooltip.node().offsetHeight;
      const pageWidth = window.innerWidth;
      const pageHeight = window.innerHeight;

      let left = event.pageX + 10;
      let top = event.pageY - 40;

      if (left + tooltipWidth > pageWidth - 10) {
        left = pageWidth - tooltipWidth - 10;
      }
      if (top < 0) {
        top = event.pageY + 20;
      }

      tooltip
        .style("left", `${left}px`)
        .style("top", `${top}px`);
    })
    .on("mouseout", () => {
      tooltip.transition().duration(200).style("opacity", 0);
    });

  // Animate bars
  bars.transition()
    .duration(1000)
    .attr("y", d => y(d[1]))
    .attr("height", d => y(d[0]) - y(d[1]));

  // Legend
  const legend = svg.append("g").attr("transform", `translate(0, ${height + 50})`);
  genders.forEach((g, i) => {
    legend.append("rect")
      .attr("x", i * 100).attr("y", 0)
      .attr("width", 16).attr("height", 16)
      .attr("fill", color(g));
    legend.append("text")
      .attr("x", i * 100 + 22).attr("y", 13)
      .text(g);
  });
  // Y Axis Label
svg.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("transform", `rotate(-90)`)
.attr("x", -height / 2)
.attr("y", -50)
.style("font-weight", "bold")
.text(showPercentage ? "Diabetes Rate (%)" : "Diabetes Count");

// X Axis Label
svg.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height + 80)
.style("font-weight", "bold")
.text("Education Level");

}

// Initial load
document.addEventListener("DOMContentLoaded", () => {
  renderGenderEducationStackedBar();
  renderIncomeGroupedBar();

  document.getElementById("gender-filter").addEventListener("change", e => {
    selectedGender = e.target.value;
    renderGenderEducationStackedBar();
    renderIncomeGroupedBar();
  });

  document.getElementById("toggleScaleSwitch").addEventListener("change", (e) => {
    showPercentage = e.target.checked;
    document.getElementById("scaleLabel").textContent = showPercentage ? "Percentage" : "Count";
    renderGenderEducationStackedBar();
    renderIncomeGroupedBar();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("gender-filter").value = "All";
    selectedGender = "All";
    showPercentage = true;
    document.getElementById("toggleScaleSwitch").checked = true;
    document.getElementById("scaleLabel").textContent = "Percentage";
    renderGenderEducationStackedBar();
    renderIncomeGroupedBar();
  });

  document.getElementById("darkModeToggle").addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
  });
});

async function renderIncomeGroupedBar() {
  const gender = selectedGender;
  const response = await fetch(`${API_BASE}/data/income_diabetes?gender=${gender}`);
  const raw = await response.json();

  const diabetesTypes = ["No Diabetes", "Pre-Diabetes", "Diabetes"];
  const incomeGroups = Array.from(new Set(raw.map(d => d.income))).sort();

  const grouped = d3.group(raw, d => d.income);
  const totals = Object.fromEntries(
    incomeGroups.map(inc => {
      const total = grouped.get(inc)?.reduce((sum, d) => sum + d.count, 0) || 1;
      return [inc, total];
    })
  );

  const transformed = incomeGroups.map(income => {
    const entry = { income };
    diabetesTypes.forEach(type => {
      const found = grouped.get(income)?.find(d => d.diabetes === type);
      const value = showPercentage
        ? ((found?.count || 0) / totals[income] * 100)
        : (found?.count || 0);
      entry[type] = +value.toFixed(2);
    });
    return entry;
  });

  const margin = { top: 40, right: 30, bottom: 100, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  d3.select("#grouped-bar-income").html("");

  const svg = d3.select("#grouped-bar-income")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom + 60)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(incomeGroups).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(diabetesTypes).range([0, x0.bandwidth()]).padding(0.05);
  const yMax = d3.max(transformed, d => d3.max(diabetesTypes, k => d[k]));
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);

  const color = d3.scaleOrdinal().domain(diabetesTypes).range(["#66c2a5", "#fc8d62", "#8da0cb"]);

  // Smoothed Y Axis Transition
  const yAxis = svg.selectAll(".y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis");

  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  const xAxis = svg.selectAll(".x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x0));

  xAxis.selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  const groups = svg.selectAll("g.income-group")
    .data(transformed)
    .join("g")
    .attr("class", "income-group")
    .attr("transform", d => `translate(${x0(d.income)},0)`);

  groups.selectAll("rect")
    .data(d => diabetesTypes.map(type => ({
      key: type,
      value: d[type],
      income: d.income
    })))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    .attr("fill", d => color(d.key))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(`
        <strong>Income:</strong> ${d.income}<br/>
        <strong>Diabetes:</strong> ${d.key}<br/>
        <strong>${showPercentage ? "Percentage" : "Count"}:</strong> ${d.value}${showPercentage ? "%" : ""}
      `)
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY - 40}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
    .transition()
    .duration(1000)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

  // Legend
  const legend = svg.append("g").attr("transform", `translate(0, ${height + 50})`);
  diabetesTypes.forEach((type, i) => {
    legend.append("rect")
      .attr("x", i * 140).attr("width", 16).attr("height", 16)
      .attr("fill", color(type));
    legend.append("text")
      .attr("x", i * 140 + 22).attr("y", 13)
      .text(type);
  });
  // Y Axis Label
svg.append("text")
.attr("class", "y-axis-label")
.attr("text-anchor", "middle")
.attr("transform", `rotate(-90)`)
.attr("x", -height / 2)
.attr("y", -50)
.style("font-weight", "bold")
.text(showPercentage ? "Diabetes Rate (%)" : "Diabetes Count");

// X Axis Label
svg.append("text")
.attr("class", "x-axis-label")
.attr("text-anchor", "middle")
.attr("x", width / 2)
.attr("y", height + 80)
.style("font-weight", "bold")
.text("Income Group");

}
