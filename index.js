const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Loadbit6/shared-auth";
const FILE_PATH = "login.json";
const BRANCH = "main";

// GET /data → Fetch JSON file from GitHub
app.get("/data", async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });

    let jsonData;

    // Parse if it's a string
    if (typeof response.data === "string") {
      jsonData = JSON.parse(response.data);
    } else {
      jsonData = response.data;
    }

    res.json(jsonData);
  } catch (error) {
    console.error("GitHub Fetch Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch data",
      details: error.response?.data || error.message
    });
  }
});

// Optional: root page
app.get("/", (req, res) => {
  res.send("✅ Backend is running. Visit /data to see login info.");
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
