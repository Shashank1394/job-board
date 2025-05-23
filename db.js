const { Pool } = require("pg");

const pool = new Pool({
  user: "shashankjadhav",
  host: "localhost",
  database: "job_board",
  password: "",
  port: 5432,
});

module.exports = pool;
