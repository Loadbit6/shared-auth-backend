// index.js (complete working backend with signup/signin)
const express = require("express");
const axios = require("axios");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Loadbit6/shared-auth";
const FILE_PATH = "login.json";
const BRANCH = "main";

app.use(express.json());

// Helper to fetch JSON file from GitHub
async function fetchUserData() {
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const res = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3.raw"
    }
  });
  return res.data;
}

// Helper to save data to GitHub
async function saveUserData(newData) {
  const getUrl = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const getRes = await axios.get(getUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`
    }
  });

  const content = Buffer.from(JSON.stringify(newData, null, 2)).toString("base64");
  const putRes = await axios.put(getUrl, {
    message: "Update user data",
    content,
    sha: getRes.data.sha,
    branch: BRANCH
  }, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json"
    }
  });

  return putRes.data;
}

// POST /signup
app.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await fetchUserData();

    if (data.users?.[username]) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);
    data.users = data.users || {};
    data.users[username] = {
      passwordHash: hash,
      cookies: {} // optional default cookie setup
    };

    await saveUserData(data);
    res.json({ success: true });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Signup failed", details: error.message });
  }
});

// POST /signin
app.post("/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const data = await fetchUserData();

    const user = data.users?.[username];
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    res.json({ success: true, cookies: user.cookies || {} });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ error: "Signin failed", details: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend is live. Use /signup or /signin with POST.");
});

app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
