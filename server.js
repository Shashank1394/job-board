const express = require("express");
const path = require("path");
const app = express();
const jobRoutes = require("./routes/jobs");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/jobs", jobRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
