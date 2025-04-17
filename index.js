const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
app.use(express.json());

// GitHub repository settings
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Use your GitHub personal access token
const REPO = 'Loadbit6/shared-auth';
const FILE_PATH = 'login.json'; // Path to your file in the GitHub repo
const BRANCH = 'main';

// Function to read the login.json file from GitHub
async function getFileContents() {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });
    return JSON.parse(response.data);
  } catch (error) {
    console.error('Error reading file:', error.response?.data || error.message);
    throw new Error('Failed to fetch data');
  }
}

// Function to update the login.json file on GitHub
async function updateFile(contents) {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const message = 'Update login.json with new user data';
    const sha = await getFileSha(); // Get current file SHA (to update the file)
    const response = await axios.put(url, {
      message,
      content: Buffer.from(JSON.stringify(contents, null, 2)).toString('base64'),
      sha,
      branch: BRANCH,
    }, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating file:', error.response?.data || error.message);
    throw new Error('Failed to update data');
  }
}

// Function to get the file SHA (used to update the file)
async function getFileSha() {
  try {
    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3.raw',
      },
    });
    return response.data.sha;
  } catch (error) {
    console.error('Error fetching file SHA:', error.response?.data || error.message);
    throw new Error('Failed to fetch file SHA');
  }
}

// Handle login request
app.post('/login', async (req, res) => {
  const { username, passwordHash } = req.body;

  try {
    const users = await getFileContents();
    if (users[username] && users[username].passwordHash === passwordHash) {
      res.json({ success: true, message: `Welcome, ${username}!` });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to process login' });
  }
});

// Handle signup request
app.post('/signup', async (req, res) => {
  const { username, passwordHash } = req.body;

  try {
    const users = await getFileContents();

    // Check if the username already exists
    if (users[username]) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    // Add new user to the data
    users[username] = {
      passwordHash,
      cookies: {}, // Initialize cookies object
    };

    // Update the GitHub file with the new user data
    await updateFile(users);

    res.json({ success: true, message: `Account created for ${username}!` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
