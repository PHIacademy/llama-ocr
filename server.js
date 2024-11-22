const express = require('express');
const multer = require('multer');
const { ocr } = require('llama-ocr');
const path = require('path');

const app = express();

// Configure multer to use memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Serve static files
app.use(express.static('public'));

// Handle file upload and OCR processing
app.post('/process', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(400).json({ error: 'No API key provided' });
        }

        // Create temporary file path in /tmp (works in Vercel)
        const tempPath = `/tmp/${Date.now()}-${req.file.originalname}`;
        require('fs').writeFileSync(tempPath, req.file.buffer);

        const markdown = await ocr({
            filePath: tempPath,
            apiKey: apiKey
        });

        // Clean up temp file
        require('fs').unlinkSync(tempPath);

        res.json({ markdown });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel
module.exports = app;