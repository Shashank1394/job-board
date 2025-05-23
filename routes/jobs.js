const express = require("express");
const router = express.Router();
const pool = require("../db");

// Helper: rename and map fields for frontend consistency
function mapJobDetails(row) {
  let skills = [];

  if (row.skills) {
    if (typeof row.skills === "string") {
      // split comma separated string into array
      skills = row.skills.split(",").map((s) => s.trim());
    } else if (Array.isArray(row.skills)) {
      // already an array, just copy
      skills = row.skills;
    }
  }

  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    skills: skills,
    createdAt: row.created_at,
    description: row.description || "",
    salary: row.salary_range || "Not specified",
    employmentType: row.employment_type || "Not specified",
    experience: row.experience_level || "Not specified",
    requirements: row.requirements || "",
    benefits: row.benefits || "",
    applicationDeadline: row.application_deadline || null,
  };
}

// GET /api/jobs - fetch all jobs or search by title
router.get("/", async (req, res) => {
  let { title } = req.query;

  try {
    let result;

    if (title) {
      title = title.trim();
    }

    if (title && title.length > 0) {
      result = await pool.query(
        `SELECT 
          j.id, j.title, j.company, j.location, j.skills, j.created_at,
          d.description, d.salary_range, d.employment_type, d.experience_level,
          d.requirements, d.benefits, d.application_deadline
        FROM jobs j
        LEFT JOIN job_details d ON j.id = d.job_id
        WHERE j.title ILIKE $1
        ORDER BY j.created_at DESC`,
        [`%${title}%`]
      );
    } else {
      result = await pool.query(
        `SELECT 
          j.id, j.title, j.company, j.location, j.skills, j.created_at,
          d.description, d.salary_range, d.employment_type, d.experience_level,
          d.requirements, d.benefits, d.application_deadline
        FROM jobs j
        LEFT JOIN job_details d ON j.id = d.job_id
        ORDER BY j.created_at DESC`
      );
    }

    // Map rows before sending response
    const jobs = result.rows.map(mapJobDetails);

    res.json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs - add new job basic info only
router.post("/", async (req, res) => {
  const { title, company, location, skills } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO jobs (title, company, location, skills) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, company, location, skills]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding job:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/jobs/details - add or update job_details for a given job_id
router.post("/details", async (req, res) => {
  const {
    job_id,
    description,
    salary_range,
    employment_type,
    experience_level,
    requirements,
    benefits,
    application_deadline,
  } = req.body;

  try {
    // Check if job_details already exists for the job
    const existing = await pool.query(
      "SELECT job_id FROM job_details WHERE job_id = $1",
      [job_id]
    );

    if (existing.rows.length > 0) {
      // Update existing job_details
      await pool.query(
        `UPDATE job_details SET
          description = $1,
          salary_range = $2,
          employment_type = $3,
          experience_level = $4,
          requirements = $5,
          benefits = $6,
          application_deadline = $7
        WHERE job_id = $8`,
        [
          description,
          salary_range,
          employment_type,
          experience_level,
          requirements,
          benefits,
          application_deadline,
          job_id,
        ]
      );
      res.status(200).json({ message: "Job details updated successfully." });
    } else {
      // Insert new job_details
      await pool.query(
        `INSERT INTO job_details 
          (job_id, description, salary_range, employment_type, experience_level, requirements, benefits, application_deadline)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          job_id,
          description,
          salary_range,
          employment_type,
          experience_level,
          requirements,
          benefits,
          application_deadline,
        ]
      );
      res.status(201).json({ message: "Job details added successfully." });
    }
  } catch (err) {
    console.error("Error adding/updating job details:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
