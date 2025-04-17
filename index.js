const express = require('express');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Mock storage - in production, you would use a database
const users = {};

// Helper function to save users to a file (login.json)
const saveUsersToFile = () => {
  fs.writeFileSync('login.json', JSON.stringify(users, null, 2));
};

// Register route
app.post('/signup', (req, res) => {
  const { username, password } = req.body;

  if (users[username]) {
    return res.status(400).json({ message: 'Username already exists!' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users[username] = { password: hashedPassword };
  saveUsersToFile();

  res.status(201).json({ message: 'Account created successfully!' });
});

// Signin route
app.post('/signin', (req, res) => {
  const { username, password } = req.body;

  if (!users[username]) {
    return res.status(400).json({ message: 'Username does not exist!' });
  }

  const isValid = bcrypt.compareSync(password, users[username].password);
  if (!isValid) {
    return res.status(400).json({ message: 'Invalid password!' });
  }

  res.status(200).json({ message: 'Login successful!' });
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('Backend is running');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
