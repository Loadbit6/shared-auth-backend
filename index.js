const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

require("dotenv").config();
app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Loadbit6/shared-auth";
const FILE_PATH = "login.json";
const BRANCH = "main";

// GET /data → returns the contents of login.json
app.get("/data", async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });

    // response.data is already JSON, no need to parse
    res.json(response.data);

  } catch (error) {
    console.error("GitHub Fetch Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch data",
      details: error.response?.data || error.message
    });
  }
});

// Optional root page
app.get("/", (req, res) => {
  res.send("✅ Backend running. Go to /data to fetch login.json.");
});

app.listen(PORT, () => {
  console.log(`✅ Server is live on port ${PORT}`);
});
