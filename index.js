const express = require('express');
const axios = require('axios');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

require('dotenv').config();
app.use(express.json());

// GitHub repository settings
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'Loadbit6/shared-auth';
const FILE_PATH = 'login.json';
const BRANCH = 'main';

// Verify server is running
app.get('/', (req, res) => {
  console.log('Received a GET request to the root route');
  res.send('Backend is running. Go to /login or /signup for API requests.');
});

// Handle login request
app.post('/login', async (req, res) => {
  console.log('Received login request');
  const { username, passwordHash } = req.body;

  try {
    const users = await getFileContents();
    if (users[username] && users[username].passwordHash === passwordHash) {
      res.json({ success: true, message: `Welcome, ${username}!` });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ success: false, message: 'Failed to process login' });
  }
});

// Handle signup request
app.post('/signup', async (req, res) => {
  console.log('Received signup request');
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
    console.error('Error during signup:', error);
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
