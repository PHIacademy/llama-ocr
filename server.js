const express = require('express');
const multer = require('multer');
const { ocr } = require('llama-ocr');
const path = require('path');
require('dotenv').config();

const app = express();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic multer setup for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Handle file upload and OCR
app.post('/process', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Save the uploaded file temporarily
        const tempPath = `/tmp/${Date.now()}-${req.file.originalname}`;
        require('fs').writeFileSync(tempPath, req.file.buffer);

        // Process with llama-ocr
        const markdown = await ocr({
            filePath: tempPath,
            apiKey: process.env.TOGETHER_API_KEY,
        });

        // Clean up temp file
        require('fs').unlinkSync(tempPath);

        res.json({ markdown });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Root route handler
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;