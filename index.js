const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express(); // ✅ THIS must be before using `app`
const PORT = process.env.PORT || 3000;

app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Loadbit6/shared-auth";
const FILE_PATH = "login.json";
const BRANCH = "main";

// ✅ GET user data
app.get("/data", async (req, res) => {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });
    res.json(JSON.parse(response.data));
  } catch (error) {
    console.error("GitHub Fetch Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to fetch data",
      details: error.response?.data || error.message
    });
  }
});

// ✅ POST to create a new user
app.post("/create-user", async (req, res) => {
  try {
    const { username, password } = req.body;
    const hash = require("crypto")
      .createHash("sha256")
      .update(password)
      .digest("hex");

    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;

    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });

    let users = JSON.parse(getResponse.data);
    if (!users.users) users.users = {};
    if (users.users[username]) {
      return res.status(400).json({ error: "Username already exists" });
    }

    users.users[username] = {
      passwordHash: hash,
      cookies: {}
    };

    const updatedContent = Buffer.from(JSON.stringify(users, null, 2)).toString("base64");

    const updateResponse = await axios.put(
      `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`,
      {
        message: `Add user ${username}`,
        content: updatedContent,
        sha: getResponse.headers.etag.replace(/W\//, '').replace(/"/g, ''),
        branch: BRANCH
      },
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        }
      }
    );

    res.json({ message: `✅ User ${username} created successfully` });
  } catch (error) {
    console.error("Create User Error:", error.response?.data || error.message);
    res.status(500).json({
      error: "Failed to create user",
      details: error.response?.data || error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend is running. Try /data.");
});

app.listen(PORT, () => {
  console.log(`✅ Server is live on port ${PORT}`);
});
