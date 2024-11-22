const express = require('express');
const multer = require('multer');
const { ocr } = require('llama-ocr');
const path = require('path');
const fs = require('fs').promises;

const app = express();

// Configure multer with file type validation
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
        } else {
            cb(null, true);
        }
    }
});

// Serve static files
app.use(express.static('public'));

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ 
            error: err.message || 'File upload error'
        });
    }
    next(err);
});

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

        // Create temp directory if it doesn't exist
        const tempDir = path.join('/tmp', 'ocr-uploads');
        await fs.mkdir(tempDir, { recursive: true });

        // Create temporary file with original extension
        const fileExt = path.extname(req.file.originalname);
        const tempPath = path.join(tempDir, `${Date.now()}${fileExt}`);
        await fs.writeFile(tempPath, req.file.buffer);

        // Process OCR with error handling
        const markdown = await ocr({
            filePath: tempPath,
            apiKey: apiKey,
            options: {
                language: 'eng', // Default to English
                timeout: 30000,  // 30 second timeout
            }
        }).catch(error => {
            throw new Error(`OCR processing failed: ${error.message}`);
        });

        // Clean up temp file
        await fs.unlink(tempPath).catch(console.error);

        // Post-process the markdown
        const processedMarkdown = postProcessMarkdown(markdown);

        res.json({ markdown: processedMarkdown });
    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ 
            error: 'OCR processing failed. Please try again or contact support.'
        });
    }
});

// Helper function to clean up and format markdown
function postProcessMarkdown(markdown) {
    if (!markdown) return '';
    
    return markdown
        // Remove excessive newlines
        .replace(/\n{3,}/g, '\n\n')
        // Clean up common OCR artifacts
        .replace(/[^\S\n]+/g, ' ')
        // Ensure proper markdown formatting
        .replace(/^(?!#|\-|\*|\d+\.|\>|\`{3})/gm, p => p.trim() ? p + '\n' : p)
        .trim();
}

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;