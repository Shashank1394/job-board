let jobs = [];
let currentFilters = {
  title: "",
  skill: "",
  location: "",
};

const jobList = document.getElementById("job-list");
const titleFilterInput = document.getElementById("titleFilter");
const skillFilterInput = document.getElementById("skillFilter");
const locationFilterInput = document.getElementById("locationFilter");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");

function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function setLoadingState(isLoading) {
  jobList.innerHTML = isLoading
    ? "<p class='loading'>⏳ Loading jobs...</p>"
    : "";
}

let previousJobDataHash = "";

function fetchJobs() {
  fetch("/api/jobs")
    .then((res) => res.json())
    .then((data) => {
      const processedJobs = data.map((job) => ({
        ...job,
        skills:
          typeof job.skills === "string"
            ? job.skills.split(",").map((s) => s.trim())
            : job.skills,
      }));

      const newDataHash = hashJobs(processedJobs);

      if (newDataHash !== previousJobDataHash) {
        jobs = processedJobs;
        previousJobDataHash = newDataHash;
        applyFilters(); // Re-render only if data is new
      }
    })
    .catch((err) => {
      console.error("Failed to fetch jobs:", err);
      showToast("❌ Failed to fetch jobs. Try again later.", "error");
    });
}

// Hash function to compare job lists
function hashJobs(jobList) {
  return JSON.stringify(
    jobList.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      skills: job.skills,
      salary: job.salary,
      employmentType: job.employmentType,
      experience: job.experience,
      postedDate: job.postedDate,
    }))
  );
}

function renderJobs(jobsToRender) {
  jobList.innerHTML = "";

  if (jobsToRender.length === 0) {
    jobList.innerHTML =
      "<p class='no-results'>🔍 No jobs found matching your criteria.</p>";
    return;
  }

  jobsToRender.forEach((job) => {
    const jobCard = document.createElement("div");
    jobCard.className = "job-card";

    // Minimal job card content
    jobCard.innerHTML = `
      <h3 class="job-title">${job.title}</h3>
      <p class="job-meta"><strong>${job.company}</strong> &mdash; ${
      job.location
    }</p>
      <div class="skills">
        ${job.skills
          .slice(0, 3) // show max 3 skills on card for brevity
          .map((skill) => `<span class="skill-tag">${skill}</span>`)
          .join("")}
        ${
          job.skills.length > 3
            ? `<span class="more-skills">+${job.skills.length - 3} more</span>`
            : ""
        }
      </div>
    `;

    // On click, show modal with full details
    jobCard.addEventListener("click", () => showJobDetails(job));

    jobList.appendChild(jobCard);
  });
}

function applyFilters() {
  const { title, skill, location } = currentFilters;

  const filtered = jobs.filter((job) => {
    const titleMatch = job.title.toLowerCase().includes(title);
    const skillMatch =
      skill === "" || job.skills.some((s) => s.toLowerCase().includes(skill));
    const locationMatch = job.location.toLowerCase().includes(location);

    return titleMatch && skillMatch && locationMatch;
  });

  renderJobs(filtered);
}

function clearFilters() {
  currentFilters = { title: "", skill: "", location: "" };

  titleFilterInput.value = "";
  skillFilterInput.value = "";
  locationFilterInput.value = "";

  renderJobs(jobs);
  showToast("Filters cleared ✅", "success");
}

// Debounce to limit frequent filtering
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

// Filter change handlers
const handleTitleChange = debounce((e) => {
  currentFilters.title = e.target.value.trim().toLowerCase();
  applyFilters();
});

const handleSkillChange = debounce((e) => {
  currentFilters.skill = e.target.value.trim().toLowerCase();
  applyFilters();
});

const handleLocationChange = debounce((e) => {
  currentFilters.location = e.target.value.trim().toLowerCase();
  applyFilters();
});

titleFilterInput.addEventListener("input", handleTitleChange);
skillFilterInput.addEventListener("input", handleSkillChange);
locationFilterInput.addEventListener("input", handleLocationChange);

searchBtn.addEventListener("click", applyFilters);
clearBtn.addEventListener("click", clearFilters);

// Poll every 5 seconds
setInterval(fetchJobs, 5000);
fetchJobs();

// Job detail modal elements
const modal = document.getElementById("job-modal");
const modalBody = document.getElementById("modal-body");
const closeModal = document.getElementById("closeModal");

// Show modal with job details including all extra info
function showJobDetails(job) {
  const reqList = document.createElement("ul");
  const benList = document.createElement("ul");

  reqList.id = "modal-requirements";
  benList.id = "modal-benefits";

  // Prepare requirements list items
  if (job.requirements) {
    let reqItems = [];
    if (typeof job.requirements === "string") {
      reqItems = job.requirements
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    reqItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      reqList.appendChild(li);
    });
  }

  // Prepare benefits list items
  if (job.benefits) {
    let benItems = [];
    if (typeof job.benefits === "string") {
      benItems = job.benefits
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
    benItems.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      benList.appendChild(li);
    });
  }

  // Insert modal content including Apply Now button
  modalBody.innerHTML = `
    <h2 id="modal-title">${job.title}</h2>
    <p><strong>Company:</strong> ${job.company}</p>
    <p><strong>Location:</strong> ${job.location}</p>
    <p><strong>Salary:</strong> ${job.salary || "Not specified"}</p>
    <p><strong>Experience Required:</strong> ${
      job.experience || "Not specified"
    }</p>
    <p><strong>Employment Type:</strong> ${
      job.employmentType || "Not specified"
    }</p>

    <p><strong>Description:</strong> ${job.description || "Not provided."}</p>
    <p><strong>Benefits:</strong></p>
    <ul id="modal-benefits"></ul>
    <p><strong>Requirements:</strong></p>
    <ul id="modal-requirements"></ul>
    <p><strong>Application Deadline:</strong> ${
      job.applicationDeadline || "Not specified"
    }</p>
    <div class="skills">
      <strong>Skills Required:</strong>
      ${job.skills
        .map((skill) => `<span class="skill-tag">${skill}</span>`)
        .join("")}
    </div>

    <div style="text-align: right;">
      <button id="applyNowBtn" class="apply-now-btn">Apply Now</button>
    </div>
  `;

  // Append the lists inside the correct places after innerHTML overwrites them
  modalBody.querySelector("#modal-requirements").append(...reqList.childNodes);
  modalBody.querySelector("#modal-benefits").append(...benList.childNodes);

  // Attach event listener to the new button element
  const applyNowBtn = document.getElementById("applyNowBtn");
  applyNowBtn.addEventListener("click", () => {
    const jobTitle = document.getElementById("modal-title").textContent;
    window.location.href = `apply.html?job=${encodeURIComponent(jobTitle)}`;
  });

  modal.classList.remove("hidden");
}

// Close modal
closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Allow closing modal by clicking outside content
modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});
