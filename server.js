const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Anthropic = require('@anthropic-ai/sdk');

// PDF text extraction
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('pdf-parse not installed. Run: npm install pdf-parse');
}

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for PDF uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'), false);
  }
});

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// ─── API: Generate Questions ───────────────────────────────────────────────
app.post('/api/generate', upload.single('pdf'), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded.' });
    }

    const qType = req.body.type || 'mixed';
    const count = Math.min(25, Math.max(5, parseInt(req.body.count) || 10));

    // Extract text from PDF
    let pdfText = '';
    if (pdfParse) {
      const buffer = fs.readFileSync(filePath);
      const parsed = await pdfParse(buffer);
      pdfText = parsed.text;
    }

    if (!pdfText || pdfText.trim().length < 100) {
      return res.status(400).json({ error: 'Could not extract enough text from the PDF. Make sure the PDF contains readable text (not just images).' });
    }

    // Truncate if very long
    const truncated = pdfText.slice(0, 12000);

    // Build prompt based on question type
    const typeInstructions = {
      mcq: 'Generate only Multiple Choice Questions (MCQ). Each must have 4 options (A, B, C, D) and one correct answer.',
      short: 'Generate only Short Answer Questions. Each should have a concise 1-3 sentence answer.',
      truefalse: 'Generate only True/False questions. Each answer must be either "True" or "False" with a brief explanation.',
      mixed: 'Generate a mix of MCQ, Short Answer, and True/False questions.'
    };

    const prompt = `You are an expert educator. Analyze the following study notes and generate ${count} practice exam questions.

${typeInstructions[qType] || typeInstructions.mixed}

STUDY NOTES:
"""
${truncated}
"""

Return ONLY a valid JSON object with this exact structure:
{
  "subject": "<detected subject name>",
  "questions": [
    {
      "type": "MCQ" | "Short Answer" | "True/False",
      "question": "<question text>",
      "options": ["A. option1", "B. option2", "C. option3", "D. option4"],  // only for MCQ, omit for others
      "answer": "<correct answer or explanation>"
    }
  ]
}

Rules:
- questions must be directly based on the provided content
- Make questions varied in difficulty (easy, medium, hard)
- For MCQ: options array must have exactly 4 items, answer must be the full correct option text
- For True/False: answer must start with "True" or "False" followed by brief explanation
- For Short Answer: answer is a clear 1-3 sentence response
- Return ONLY the JSON, no markdown, no extra text`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content[0].text.trim();

    // Parse JSON response
    let parsed;
    try {
      // Strip markdown code fences if present
      const jsonStr = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      console.error('JSON parse error:', raw.slice(0, 500));
      return res.status(500).json({ error: 'AI returned an unexpected format. Please try again.' });
    }

    res.json(parsed);

  } catch (err) {
    console.error('Error:', err.message);
    if (err.message?.includes('ANTHROPIC_API_KEY')) {
      return res.status(500).json({ error: 'API key not configured. Set ANTHROPIC_API_KEY environment variable.' });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
  } finally {
    // Clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});
