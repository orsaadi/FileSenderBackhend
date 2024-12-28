const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

const sessions = {};

// Configure multer to handle file uploads with the correct file extension
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname); // Get file extension
    cb(null, Date.now() + fileExtension); // Save file with original extension and timestamp
  },
});

const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());
app.use(cors());

// Generate chat code
app.get('/generate_code', (req, res) => {
  const code = generateChatCode();
  sessions[code] = null; // Create an empty session entry
  res.json({ code });
});

// Join session
app.post('/join-session', (req, res) => {
  const { code } = req.body;
  if (sessions[code] === undefined) {
    return res.status(404).json({ error: 'Chat code not found.' });
  }
  res.json({ message: 'Session joined successfully.' });
});

// File upload endpoint
app.post('/upload/:code', upload.single('file'), (req, res) => {
  const { code } = req.params;
  if (sessions[code] === undefined) {
    return res.status(404).json({ error: 'Chat code not found.' });
  }

  // Save the file path in the session, including the original extension
  sessions[code] = req.file.path;
  res.json({
    message: 'File uploaded successfully.',
    fileName: req.file.originalname,
  });
});

// File download endpoint
app.get('/download/:code', (req, res) => {
  const { code } = req.params;
  const filePath = sessions[code];
  if (!filePath) {
    return res
      .status(404)
      .json({ error: 'No file uploaded for this session.' });
  }

  // Get the file's original name and extension
  const fileName = path.basename(filePath);
  res.download(filePath, fileName, (err) => {
    if (!err) {
      // Clean up the file after downloading
      delete sessions[code];
      fs.unlinkSync(filePath);
    }
  });
});

// Helper to generate chat code
function generateChatCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
