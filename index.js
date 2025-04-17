const express = require("express");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Simulating data storage as JSON file
const FILE_PATH = './login.json';

// Read user data from JSON file
function getUserData() {
  try {
    const data = fs.readFileSync(FILE_PATH, 'utf8');
    return JSON.parse(data).users || {};
  } catch (err) {
    console.error("Error reading user data:", err);
    return {};
  }
}

// Save user data to JSON file
function saveUserData(users) {
  try {
    const data = JSON.stringify({ users }, null, 2);
    fs.writeFileSync(FILE_PATH, data, 'utf8');
  } catch (err) {
    console.error("Error saving user data:", err);
  }
}

// /data endpoint to handle both signup and login
app.post("/data", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required!" });
  }

  const users = getUserData();

  // Check if user exists and handle login or signup
  if (users[username]) {
    // User exists, handle login (check password)
    const isValid = bcrypt.compareSync(password, users[username].passwordHash);
    if (isValid) {
      return res.status(200).json({ message: "Login successful!" });
    } else {
      return res.status(400).json({ message: "Invalid password!" });
    }
  } else {
    // New user, handle signup (create account)
    const hashedPassword = bcrypt.hashSync(password, 10); // Hash password

    // Add new user to data
    users[username] = {
      passwordHash: hashedPassword,
      cookies: {} // You can customize cookies data here if needed
    };

    saveUserData(users); // Save updated data

    return res.status(201).json({ message: "Account created successfully!" });
  }
});

// Optionally, a GET endpoint to retrieve data (e.g., user details)
app.get("/data", (req, res) => {
  try {
    const users = getUserData();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve data" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
