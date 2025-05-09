const INCOME_LEVELS = {
  1: "Less than $10,000",
  2: "$10,000 - $14,999",
  3: "$15,000 -  $19,999",
  4: "$20,000 -  $24,999",
  5: "$25,000 - $34,999",
  6: "$35,000 - $49,999",
  7: "$50,000 - $74,999",
  8: "$75,000 or more"
};


function getLegendTextColor() {
  return document.body.classList.contains("dark-mode") ? "#fff" : "#000";
}

// Constants for color mappings
const genderColors = {
  "Male": "#4575b4",       // Soft blue
  "Female": "#d73090"      // Deep magenta
};

const diabetesColors = {
  "No Diabetes": "#1b9e77",     // Teal green
  "Pre-Diabetes": "#ffb74d",   // Amber/Orange
  "Diabetes": "#e74c3c"        // Bright red
};

function getGenderColor(gender) {
  return genderColors[gender] || "#999";
}

function getDiabetesColor(type) {
  return diabetesColors[type] || "#999";
}

async function fetchChartData() {
    try {
        const response = await fetch(`${API_BASE}/data/sample`);
        
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
            .attr("class", "tooltip");
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

  const margin = { top: 40, right: 100, bottom: 40, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 330 - margin.top - margin.bottom;

  d3.select("#chart-education-gender").html("");

  const svg = d3.select("#chart-education-gender")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 150)
    .attr("height", height + margin.top + margin.bottom + 80)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleBand().domain(educationLevels).range([0, width]).padding(0.2);
  const yMax = showPercentage ? 100 : d3.max(transformed, d => d.Male + d.Female);
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);

  const color = d3.scaleOrdinal().domain(genders).range(genders.map(getGenderColor));
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
  //const legend = svg.append("g").attr("transform", `translate(${width - 80}, -43)`);
  const legend = svg.append("g").attr("transform", `translate(${width - 8}, ${height / 2 - 120})`);

genders.forEach((g, i) => {
  const yOffset = i * 24;
  legend.append("rect")
    .attr("x", 0).attr("y", yOffset)
    .attr("width", 16).attr("height", 16)
    .attr("fill", color(g));
  legend.append("text")
    .attr("x", 22).attr("y", yOffset + 13)
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
  renderGenderPieChart();
  renderMobilityByDiabetesBar();

  document.getElementById("mobility-filter").addEventListener("change", () => {
    renderMobilityByDiabetesBar();
  });

  document.getElementById("gender-filter").addEventListener("change", e => {
    selectedGender = e.target.value;
    renderGenderEducationStackedBar();
    renderIncomeGroupedBar();
    renderGenderPieChart();
    renderMobilityByDiabetesBar();
  });
  
  document.getElementById("toggleScaleSwitch").addEventListener("change", (e) => {
    showPercentage = e.target.checked;
    document.getElementById("scaleLabel").textContent = showPercentage ? "Percentage" : "Count";
    renderGenderEducationStackedBar();
    renderIncomeGroupedBar();
    renderMobilityByDiabetesBar();
  });

  document.getElementById("resetFilters").addEventListener("click", () => {
    document.getElementById("gender-filter").value = "All";
    selectedGender = "All";
    showPercentage = true;
    document.getElementById("scaleLabel").textContent = "Percentage";
    renderGenderEducationStackedBar();
    renderIncomeGroupedBar();
    renderGenderPieChart();
    renderMobilityByDiabetesBar();
  });
});

async function renderIncomeGroupedBar() {
  const gender = selectedGender;
  const response = await fetch(`${API_BASE}/data/income_diabetes?gender=${gender}`);
  const raw = await response.json();

  const diabetesTypes = ["No Diabetes", "Pre-Diabetes", "Diabetes"];
  const incomeGroups = Array.from(new Set(raw.map(d => +d.income))).sort((a, b) => a - b);

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

  const margin = { top: 40, right: 30, bottom: 40, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 330 - margin.top - margin.bottom;

  d3.select("#grouped-bar-income").html("");

  const svg = d3.select("#grouped-bar-income")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 150)
    .attr("height", height + margin.top + margin.bottom + 100)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x0 = d3.scaleBand().domain(incomeGroups).range([0, width]).padding(0.2);
  const x1 = d3.scaleBand().domain(diabetesTypes).range([0, x0.bandwidth()]).padding(0.05);
  const yMax = d3.max(transformed, d => d3.max(diabetesTypes, k => d[k]));
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);

  const color = d3.scaleOrdinal().domain(diabetesTypes).range(diabetesTypes.map(getDiabetesColor));

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
    .call(d3.axisBottom(x0).tickFormat(d => INCOME_LEVELS[d] || d));


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
      income: INCOME_LEVELS[d.income] || d.income
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
  const legend = svg.append("g").attr("transform", `translate(${width - 110}, -42)`);
diabetesTypes.forEach((type, i) => {
  const yOffset = i * 24;
  legend.append("rect")
    .attr("x", 0).attr("y", yOffset)
    .attr("width", 16).attr("height", 16)
    .attr("fill", color(type));
  legend.append("text")
    .attr("x", 22).attr("y", yOffset + 13)
    .text(type)
    .style("fill", getLegendTextColor());
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

async function renderGenderPieChart() {
  const data = await fetch(`${API_BASE}/data/gender_split_diabetic`).then(res => res.json());

  d3.select("#pie-gender").html(""); // Clear previous chart
  const width = 650, height = 330, radius = Math.min(width, height) / 2;

  const svg = d3.select("#pie-gender")
    .append("svg")
    .attr("width", width)
    .attr("height", height + 80)
    .append("g")
    .attr("transform", `translate(${width / 2 - 60}, ${height / 2})`);

  const color = d3.scaleOrdinal().domain(data.map(d => d.gender)).range(data.map(d => getGenderColor(d.gender)));

  const pie = d3.pie().value(d => d.count).sort(null);
  const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius - 10);
  const hoverArc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius + 5);

  const paths = svg.selectAll("path")
    .data(pie(data))
    .enter()
    .append("path")
    .attr("fill", d => color(d.data.gender))
    .attr("stroke", "white")
    .style("stroke-width", "2px")
    .attr("d", d => {
      const start = { startAngle: 0, endAngle: 0 };
      return arc(start);
    })
    .transition()
    .duration(1000)
    .attrTween("d", function(d) {
      const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return t => arc(i(t));
    });

  // Re-select after transition for interactivity
  svg.selectAll("path")
    .data(pie(data))
    .on("mouseover", function(event, d) {
      d3.select(this).transition().duration(200).attr("d", hoverArc(d));
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(`
        <strong>Gender:</strong> ${d.data.gender}<br/>
        <strong>${showPercentage ? "Percent" : "Count"}:</strong> ${showPercentage ? d.data.percent + "%" : d.data.count}
      `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 40}px`);
    })
    .on("mouseout", function(event, d) {
      d3.select(this).transition().duration(200).attr("d", arc(d));
      tooltip.transition().duration(200).style("opacity", 0);
    })
    .on("click", (event, d) => {
      selectedGender = d.data.gender;
      document.getElementById("gender-filter").value = selectedGender;
      renderGenderEducationStackedBar();
      renderIncomeGroupedBar();
      renderGenderPieChart(); // re-render for sync
    });

  // Add Percentage Labels inside slices
  svg.selectAll("text.label")
    .data(pie(data))
    .enter()
    .append("text")
    .attr("class", "label")
    .text(d => `${d.data.percent}%`)
    .attr("transform", d => `translate(${arc.centroid(d)})`)
    .style("text-anchor", "middle")
    .style("font-size", "14px")
    .style("font-weight", "bold")
    .style("fill", d => document.body.classList.contains("dark-mode") ? "#fff" : "#000");

  // Legend with filtering
  const legend = svg.append("g")
  .attr("transform", `translate(${radius + 100}, ${-radius})`);

data.forEach((d, i) => {
  const yOffset = i * 24;
  const g = legend.append("g")
    .attr("transform", `translate(0, ${yOffset})`)
    .style("cursor", "pointer")
    .on("click", () => {
      selectedGender = d.gender;
      document.getElementById("gender-filter").value = selectedGender;
      renderGenderEducationStackedBar();
      renderIncomeGroupedBar();
      renderGenderPieChart();
    });

    g.append("rect")
      .attr("width", 16)
      .attr("height", 16)
      .attr("fill", color(d.gender));

      g.append("text")
      .attr("x", 22)
      .attr("y", 13)
      .text(d.gender)
      .style("font-size", "13px")
      .style("fill", document.body.classList.contains("dark-mode") ? "#fff" : "#000")
      .style("font-size", "13px")
      .style("font-weight", "500");  
  });
}

async function renderMobilityByDiabetesBar() {
  const filter = document.getElementById("mobility-filter").value;
  const data = await fetch(`${API_BASE}/data/mobility_by_diabetes?filter=${filter}`).then(res => res.json());

  const diabetesLabels = {
    0: "No Diabetes",
    1: "Pre-Diabetes",
    2: "Diabetes"
  };

  const groups = Array.from(new Set(data.map(d => d.group)))
  .sort((a, b) => filter === "income" ? a - b : a.localeCompare(b));
  const transformed = groups.map(g => {
    const result = { group: g };
    data.filter(d => d.group === g).forEach(d => {
      result[diabetesLabels[d.diabetes]] = showPercentage? d.percent: d.count;

    });
    return result;
  });

  const margin = { top: 40, right: 30, bottom: 40, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 330 - margin.top - margin.bottom;

  d3.select("#mobility-bar").html("");

  const svg = d3.select("#mobility-bar")
    .append("svg")
    .attr("width", width + margin.left + margin.right + 150)
    .attr("height", height + margin.top + margin.bottom + 100)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const x0 = d3.scaleBand().domain(groups).range([0, width]).padding(0.2);
  const diabetesTypes = ["No Diabetes", "Pre-Diabetes", "Diabetes"];
  const x1 = d3.scaleBand().domain(diabetesTypes).range([0, x0.bandwidth()]).padding(0.05);
  const yMax = showPercentage? 100: d3.max(transformed, d => d3.max(diabetesTypes, type => d[type]));
  const y = d3.scaleLinear().domain([0, yMax]).nice().range([height, 0]);


  const color = d3.scaleOrdinal().domain(diabetesTypes).range(diabetesTypes.map(getDiabetesColor));
  svg.selectAll(".y-axis").remove();
  svg.append("g")
  .attr("class", "y-axis")
  .transition()
  .duration(1000)
  .call(d3.axisLeft(y));

  // X Axis with transition
  const xAxis = svg.selectAll(".x-axis")
    .data([null])
    .join("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${height})`);
    xAxis.transition().duration(1000)
    .call(d3.axisBottom(x0).tickFormat(d => filter === "income" ? INCOME_LEVELS[d] || d : d));  
  xAxis.selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  // Y Axis with transition
  const yAxis = svg.selectAll(".y-axis")
    .data([null])
    .join("g")
    .attr("class", "y-axis");
  yAxis.transition().duration(1000).call(d3.axisLeft(y));

  const group = svg.selectAll("g.mobility-group")
    .data(transformed)
    .join("g")
    .attr("class", "mobility-group")
    .attr("transform", d => `translate(${x0(d.group)}, 0)`);

  group.selectAll("rect")
    .data(d => diabetesTypes.map(type => ({ key: type, value: d[type] || 0, group: d.group })))
    .join("rect")
    .attr("x", d => x1(d.key))
    .attr("width", x1.bandwidth())
    .attr("fill", d => color(d.key))
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(150).style("opacity", 1);
      tooltip.html(`
        <strong>${filter === "income" ? "Income" : "Education"}:</strong> ${filter === "income" ? INCOME_LEVELS[d.group] : d.group}
        <strong>${d.key}</strong><br/>
        <strong>Mobility Difficulty:</strong> ${d.value}${showPercentage ? "%" : ""}
      `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", `${event.pageX + 10}px`)
        .style("top", `${event.pageY - 40}px`);
    })
    .on("mouseout", () => tooltip.transition().duration(200).style("opacity", 0))
    .transition()
    .duration(1000)
    .attr("y", d => y(d.value))
    .attr("height", d => height - y(d.value));

    // Legend
   const legend = svg.append("g")
  .attr("class", "legend")
  .attr("transform", `translate(${width - 110}, -42)`);

diabetesTypes.forEach((type, i) => {
  const yOffset = i * 24;
  const legendItem = legend.append("g")
    .attr("transform", `translate(0, ${yOffset})`);

  legendItem.append("rect")
    .attr("width", 16)
    .attr("height", 16)
    .attr("fill", color(type));

  legendItem.append("text")
    .attr("x", 22)
    .attr("y", 13)
    .text(type)
    .style("fill", getLegendTextColor())
    .style("font-size", "13px");
});

  svg.append("text")
  .attr("class", "x-axis-label")
  .attr("text-anchor", "middle")
  .attr("x", width / 2)
  .attr("y", height + 85)
  .style("font-weight", "bold")
  .text(filter === "income" ? "Income Group" : "Education Level");

  svg.append("text")
  .attr("class", "y-axis-label")
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -50)
  .style("font-weight", "bold")
  .text(showPercentage ? "Mobility Difficulty (%)" : "Mobility Difficulty Count");
}
