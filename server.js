const express = require('express');
const multer = require('multer');
const { ocr } = require('llama-ocr');
require('dotenv').config();

const app = express();

// Basic multer setup for file upload
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Serve static files
app.use(express.static('public'));

// Handle file upload and OCR
app.post('/process', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Save the uploaded file temporarily
        const tempPath = `/tmp/${Date.now()}-${req.file.originalname}`;
        require('fs').writeFileSync(tempPath, req.file.buffer);

        // Process with llama-ocr (following official guide)
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

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;