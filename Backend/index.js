const express = require('express');
require('dotenv').config();
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const { connectMongoDB } = require('./config/mongodb');

const v1Routes = require('./routes/v1/verify.route');
const uploadRoutes = require('./routes/v1/upload.route');

// Parse JSON body
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/v1', v1Routes);
app.use('/api/v1', uploadRoutes);

// Root → serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const startServer = async () => {
  try {
    await connectMongoDB();
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on port ${port}...`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();