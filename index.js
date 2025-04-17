const crypto = require("crypto");

// Hash password
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// POST /create-user
app.post("/create-user", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }

  try {
    // Get existing data
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const getResponse = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3.raw"
      }
    });

    let data = getResponse.data;
    const users = data.users || {};

    if (users[username]) {
      return res.status(409).json({ error: "User already exists" });
    }

    users[username] = {
      passwordHash: hashPassword(password),
      cookies: {}
    };

    const updatedContent = {
      users
    };

    const newContent = Buffer.from(JSON.stringify(updatedContent, null, 2)).toString("base64");

    await axios.put(url, {
      message: `Add new user ${username}`,
      content: newContent,
      sha: getResponse.headers.etag?.replace(/W\//, "").replace(/"/g, "") || "", // fallback if SHA is missing
      branch: BRANCH
    }, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json"
      }
    });

    res.json({ success: true, message: `User ${username} created` });

  } catch (error) {
    console.error("Create User Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to create user", details: error.message });
  }
});
