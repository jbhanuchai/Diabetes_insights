const API_BASE = "http://127.0.0.1:5000";

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("csvFile");
  const reuploadInput = document.getElementById("reuploadFile");
  const reuploadBtn = document.getElementById("reuploadBtn");

  // Initial file upload
  fileInput?.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (file) uploadFile(file);
  });

  // Reupload trigger
  reuploadBtn?.addEventListener("click", () => {
    reuploadInput.click();
  });

  // Reupload actual file input
  reuploadInput?.addEventListener("change", () => {
    const file = reuploadInput.files[0];
    if (file) {
      console.log("Reuploading file:", file.name);  // ✅ Added logging
      resetDashboard();
      uploadFile(file);
    }
  });

  // Try loading summary if data is already uploaded
  loadDashboardIfAvailable();
});

// Upload the selected CSV
function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      console.log("Uploaded:", data.message);

      // UI Updates
      document.getElementById("upload-container").style.display = "none";
      document.getElementById("csvFile").style.display = "none";
      document.getElementById("reupload-container").style.display = "block";
      document.getElementById("dashboard-container").style.display = "block";

      // Clear file inputs
      document.getElementById("csvFile").value = "";
      document.getElementById("reuploadFile").value = "";

      // Update reupload button to show filename
      document.getElementById("reuploadBtn").innerText = `Reupload (${file.name})`;

      fetchSummaryData();
    })
    .catch(err => {
      console.error("Upload failed:", err);
      alert("Upload failed. Please try again.");
    });
}

// Try to load dashboard if data already exists
function loadDashboardIfAvailable() {
  fetch(`${API_BASE}/data/summary?ts=${Date.now()}`)
    .then(res => {
      if (!res.ok) return null;
      return res.json();
    })
    .then(data => {
      if (!data || data.total_cases === null) {
        console.log("Dataset not yet uploaded.");
        return;
      }

      document.getElementById("upload-container").style.display = "none";
      document.getElementById("csvFile").style.display = "none";
      document.getElementById("reupload-container").style.display = "block";
      document.getElementById("dashboard-container").style.display = "block";

      updateSummary(data);
    })
    .catch(() => {
      console.log("Dataset not yet uploaded.");
    });
}

// Fetch latest summary data after file upload
function fetchSummaryData() {
  fetch(`${API_BASE}/data/summary?ts=${Date.now()}`) 
    .then(res => res.json())
    .then(data => {
      console.log("Summary data after reupload:", data); 
      updateSummary(data);
    })
    .catch(err => console.error("Summary error:", err));
}

// Update cards with fetched summary values
function updateSummary(data) {
  document.getElementById("totalCasesCount").innerText = data.total_cases;
  document.getElementById("highestAgeGroup").innerText = data.highest_age_group;
  const malePercent = data.gender_male;
  const femalePercent = data.gender_female;

  document.getElementById("maleBar").style.width = `${malePercent}%`;
  document.getElementById("femaleBar").style.width = `${femalePercent}%`;

  document.getElementById("maleLabel").innerText = `${malePercent}% Male`;
  document.getElementById("femaleLabel").innerText = `${femalePercent}% Female`;

  // High BP Chart + Percentage
  document.getElementById("bpPercentText").innerText = `${data.bp_rate}%`;

  const ctx = document.getElementById('bpDonutChart').getContext('2d');
  if (window.bpChartInstance) window.bpChartInstance.destroy();

  window.bpChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
          labels: ['High BP', 'Normal'],
          datasets: [{
              data: [data.bp_rate, 100 - data.bp_rate],
              backgroundColor: ['#28c76f', '#e0e0e0'],
              borderWidth: 0
          }]
      },
      options: {
          cutout: '25%',
          plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
          }
      }
  });
}

// Reset back to upload view (optional step before reupload)
function resetDashboard() {
  document.getElementById("dashboard-container").style.display = "none";
  document.getElementById("upload-container").style.display = "block";
  document.getElementById("csvFile").style.display = "block";
}
function animateCounter(id, target) {
  let current = 0;
  const duration = 1200;
  const stepTime = Math.abs(Math.floor(duration / target));
  const counter = document.getElementById(id);

  const timer = setInterval(() => {
    current += Math.ceil(target / (duration / stepTime));
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    counter.innerText = current.toLocaleString();
  }, stepTime);
}

// Call this after data is fetched
animateCounter("totalCasesCount", data.total_cases);