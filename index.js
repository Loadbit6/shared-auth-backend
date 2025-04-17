const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
const app = express();
require("dotenv").config();

app.use(express.json());

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = "Loadbit6/shared-auth";
const FILE_PATH = "login.json";
const BRANCH = "main";

const getFileSHA = async () => {
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  return response.data.sha;
};

const readData = async () => {
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  return typeof response.data === "string" ? JSON.parse(response.data) : response.data;
};

const writeData = async (data) => {
  const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  const sha = await getFileSHA();
  await axios.put(url, {
    message: "Update user data",
    content,
    sha,
    branch: BRANCH,
  }, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
};

// 🔐 Hashing
const hash = (str) => crypto.createHash("sha256").update(str).digest("hex");

// 📤 Signup
app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const data = await readData();
    if (data.users?.[username]) return res.status(409).json({ error: "User exists" });

    data.users = data.users || {};
    data.users[username] = {
      passwordHash: hash(password),
      cookies: {},
    };

    await writeData(data);
    res.json({ success: true, message: "Account created" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Signup failed", details: err.message });
  }
});

// 🔓 Signin
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  try {
    const data = await readData();
    const user = data.users?.[username];

    if (!user || user.passwordHash !== hash(password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      success: true,
      cookies: user.cookies || {},
    });
  } catch (err) {
    res.status(500).json({ error: "Signin failed", details: err.message });
  }
});

// 🚀 Status
app.get("/", (req, res) => {
  res.send("✅ Shared Auth Backend Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
