const express = require("express");
const router = express.Router();
const pool = require("../db");

// Utility function to map job data
function mapJobDetails(row) {
  let skills = [];

  if (row.skills) {
    if (typeof row.skills === "string") {
      skills = row.skills.split(",").map((s) => s.trim());
    } else if (Array.isArray(row.skills)) {
      skills = row.skills;
    }
  }

  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    skills,
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

// GET /api/jobs - Fetch all jobs or filter by title
router.get("/", async (req, res) => {
  let { title } = req.query;

  try {
    let result;
    if (title) {
      title = title.trim();
    }

    if (title && title.length > 0) {
      result = await pool.query(
        `SELECT * FROM jobs WHERE title ILIKE $1 ORDER BY created_at DESC`,
        [`%${title}%`]
      );
    } else {
      result = await pool.query(`SELECT * FROM jobs ORDER BY created_at DESC`);
    }

    const jobs = result.rows.map(mapJobDetails);
    res.setHeader("Content-Type", "application/json");
    res.status(200).json(jobs);
  } catch (err) {
    console.error("Error fetching jobs:", err.message);
    res.status(500).json({ error: "Failed to fetch jobs." });
  }
});

// POST /api/jobs - Add full job info
router.post("/", async (req, res) => {
  const {
    title,
    company,
    location,
    skills,
    description,
    salary_range,
    employment_type,
    experience_level,
    requirements,
    benefits,
    application_deadline,
  } = req.body;

  if (!title || !company || !location || !skills) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (
        title, company, location, skills,
        description, salary_range, employment_type,
        experience_level, requirements, benefits, application_deadline
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        title,
        company,
        location,
        Array.isArray(skills) ? skills.join(", ") : skills,
        description || "",
        salary_range || "",
        employment_type || "",
        experience_level || "",
        requirements || "",
        benefits || "",
        application_deadline || null,
      ]
    );

    res.setHeader("Content-Type", "application/json");
    res.status(201).json({
      message: "Job added successfully.",
      job: mapJobDetails(result.rows[0]),
    });
  } catch (err) {
    console.error("Error adding job:", err.message);
    res.status(500).json({ error: "Failed to add job." });
  }
});

module.exports = router;
