# StudyForge — AI Question Generator

Upload any subject PDF and get AI-generated exam questions instantly.

## Quick Setup

### 1. Project Structure
```
notes-quiz-app/
├── server.js          ← Node.js backend (Express + Claude AI)
├── package.json       ← Dependencies
├── public/
│   └── index.html     ← Frontend (copy index.html here)
└── uploads/           ← Auto-created for temp PDF storage
```

### 2. Move frontend
```bash
mkdir public
mv index.html public/
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Set API Key
Get your Anthropic API key from https://console.anthropic.com

```bash
# Mac/Linux
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# Windows CMD
set ANTHROPIC_API_KEY=sk-ant-your-key-here

# Windows PowerShell
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"
```

### 5. Run the Server
```bash
npm start
```

Open → **http://localhost:3000**

---

## Features

- 📄 Upload any PDF (lectures, textbooks, notes)
- 🧠 AI detects subject automatically
- ❓ 3 question types: MCQ, Short Answer, True/False
- 🔢 Choose 5–25 questions
- 👁 Click any question to reveal answer
- 📋 Copy all or download as .txt

## Question Types

| Type | Description |
|------|-------------|
| **Mixed** | Combination of all types |
| **MCQ** | 4-option multiple choice with one correct answer |
| **Short Answer** | Open-ended with concise 1-3 sentence answers |
| **True/False** | Statement with explanation |

## Notes

- PDF must contain selectable text (not scanned images)
- Max file size: 20MB
- Requires Node.js 18+
