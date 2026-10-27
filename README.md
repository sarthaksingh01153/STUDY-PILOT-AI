# ✈️ StudyPilot AI — Intelligent Study Companion

> A modern, full-stack learning platform that converts lecture notes and PDFs into structured revision summaries, grounded AI tutor chats, interactive quizzes with deterministic scoring, and personalized study roadmaps targeting weak topics.

---

## 🌟 Features Overview

| Feature | Description | Engine / Method |
| :--- | :--- | :--- |
| **Intelligent Notes Synthesizer** | Upload PDFs or paste lecture notes to extract executive summaries, high/medium/low-yield concepts, and key exam revision points. | Official `@google/genai` SDK + `pdf-parse` |
| **Conversational Streaming AI Tutor** | Fast, conversational tutor (like ChatGPT) with SSE token-by-token streaming, markdown code formatting with 1-click copy, stop generation, and grounded note context. | Server-Sent Events (SSE) + Gemini |
| **Conceptual AI Quiz** | Multiple-choice questions testing conceptual depth with instant explanations. | Gemini Question Synthesis |
| **Deterministic Scoring** | Transparent, reliable scoring calculated in pure application code—never delegated to an LLM. | Deterministic TypeScript logic (`quizScoring.ts`) |
| **Weak-Topic Diagnostics** | Topics scoring below **60% accuracy** are automatically flagged for prioritized review. | Transparent $< 60\%$ threshold |
| **AI Study Agent & Planner** | Formulates actionable revision sessions customized to your target exam date and daily available study time. | Gemini Study Agent + Interactive Checklist |
| **White Apple Liquid Glass UI** | Pure white and soft off-white surfaces (`#FFFFFF`, `#F7F8FA`), Apple Blue accents (`#007AFF`), near-black typography (`#171717`), and subtle glassmorphic blur. | Modern Vanilla CSS & Design Tokens |

---

## 📁 Project Structure

```text
StudyPilot-AI/
├── index.html                   # Entry HTML with typography and SEO tags
├── package.json                 # Frontend dependencies and run scripts
├── vite.config.ts               # Vite bundler configuration with backend API proxy
├── tsconfig.json                # Frontend TypeScript configuration
├── README.md                    # Project documentation
│
├── public/
│   └── favicon.svg              # Liquid Glass brand favicon
│
├── src/
│   ├── main.tsx                 # React application entry point
│   ├── App.tsx                  # Root state coordination and cross-page router
│   │
│   ├── components/
│   │   ├── GlassCard.tsx        # Translucent glass card with glow effects
│   │   ├── GlassButton.tsx      # Button with variants (primary, secondary, danger, ghost)
│   │   ├── GlassInput.tsx       # Glass input and textarea with glow focus ring
│   │   ├── GlassModal.tsx       # Backdrop-blurred modal dialog with Escape handling
│   │   ├── GlassSidebar.tsx     # Floating sidebar with real-time API health dot
│   │   ├── LoadingState.tsx     # Pulsing glass loader with status descriptions
│   │   └── ErrorMessage.tsx     # Actionable error alert with retry button
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx        # Overview metrics, topic mastery, and exam countdown
│   │   ├── AINotes.tsx          # PDF upload, text extractor, and concept viewer
│   │   ├── AITutor.tsx          # Context-grounded conversational study tutor
│   │   ├── AIQuiz.tsx           # MCQ practice, answers review, and score calculation
│   │   └── StudyPlanner.tsx     # AI Study Agent revision roadmap and task checklist
│   │
│   ├── services/
│   │   ├── api.ts               # HTTP client communicating with Express backend
│   │   ├── notesService.ts      # LocalStorage manager for saved study notes
│   │   ├── quizService.ts       # LocalStorage manager for quizzes and results
│   │   └── studyPlanService.ts  # LocalStorage manager for active study plan tasks
│   │
│   ├── utils/
│   │   ├── quizScoring.ts       # Pure deterministic quiz grading and weak topic detection
│   │   ├── topicAnalysis.ts     # Aggregator across multiple quiz attempts
│   │   └── formatTime.ts        # Friendly duration (mins/hrs) and date formatters
│   │
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   │
│   └── styles/
│       ├── global.css           # Design tokens, midnight background, ambient glows
│       ├── liquid-glass.css     # Apple-inspired Liquid Glass classes
│       ├── layout.css           # Grid system, sidebar layout, and header styles
│       └── responsive.css       # Mobile drawer navigation and responsive breakpoints
│
├── server/
│   ├── package.json             # Express dependencies and scripts
│   ├── tsconfig.json            # Server TypeScript configuration
│   ├── .env.example             # Template for environment variables
│   ├── .env                     # Local configuration with GEMINI_API_KEY
│   └── src/
│       ├── index.ts             # Server startup and port listener
│       ├── app.ts               # Express configuration, CORS, and route mounting
│       ├── config/
│       │   └── env.ts           # Validated environment configuration
│       ├── routes/
│       │   ├── summary.ts       # POST /api/summary and /extract-pdf
│       │   ├── quiz.ts          # POST /api/quiz
│       │   ├── tutor.ts         # POST /api/tutor
│       │   └── studyPlan.ts     # POST /api/study-plan
│       ├── services/
│       │   ├── geminiService.ts # Official @google/genai SDK implementation
│       │   └── pdfService.ts    # PDF text extraction and validation
│       ├── middleware/
│       │   ├── errorHandler.ts  # Safe JSON error handler
│       │   └── rateLimiter.ts   # In-memory sliding window rate limiter
│       ├── utils/
│       │   └── validateInput.ts # Input bounds and string sanitization
│       └── types/
│           └── index.ts         # Backend request/response types
│
└── docs/
    ├── PROJECT_OVERVIEW.md      # Architecture, value proposition, and design decisions
    ├── API_DOCUMENTATION.md     # Detailed endpoints, payloads, and response schemas
    └── HOW_IT_WORKS.md          # Step-by-step data flow guide for beginners
```

---

## 🛠️ Required Software & Versions

- **Node.js**: v18.0.0 or higher (Tested on Node v24.22.1)
- **npm**: v9.0.0 or higher (Tested on npm 11.19.1)
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/)

---

## 🚀 Quick Start Guide

### 1. Clone or Open the Repository
```bash
cd "StudyPilot AI"
```

### 2. Install Dependencies
Install dependencies for both the frontend and backend:
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Configure the Gemini API Key
Open `server/.env` and paste your Google Gemini API key:
```env
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:3000

# Paste your Gemini API key below:
GEMINI_API_KEY=AIzaSy...your_actual_key_here
GEMINI_MODEL=gemini-2.5-flash
```

> **Security Note:** The API key is stored **only** on the backend in `server/.env` and is never exposed to the client browser or bundled in Vite.

### 4. Run the Application
Open two terminal windows:

**Terminal 1 — Express Backend Server:**
```bash
npm run server
# Server starts at http://localhost:5000
```

**Terminal 2 — React Frontend:**
```bash
npm run dev
# Vite starts at http://localhost:3000
```

Open your browser at **`http://localhost:3000`**.

---

## 🧪 Running Unit Tests

The test suite validates deterministic quiz scoring, $<60\%$ weak-topic classification, and server request validation:
```bash
npm test
```
Vitest executes and verifies all tests with detailed terminal reporting.

---

## ⚙️ How Key Subsystems Work

### 1. PDF Text Extraction (`server/src/services/pdfService.ts`)
- Uploaded PDFs are parsed in memory using `pdf-parse`.
- Validates file size (max 10 MB) and detects empty/scanned PDFs where selectable text is unavailable.
- Sanitizes extracted text and limits length to avoid LLM token overflow.

### 2. Deterministic Quiz Scoring (`src/utils/quizScoring.ts`)
- Quiz scoring is computed mathematically in application code:
  $$\text{Score } \% = \text{round}\left(\frac{\text{Correct Answers}}{\text{Total Questions}} \times 100\right)$$
- Tracks accuracy per subtopic.
- Any topic with accuracy $< 60\%$ is classified into `weakTopics`.
- Ensures hackathon judges get reliable, repeatable test results.

### 3. AI Study Agent & Adaptive Schedule (`server/src/services/geminiService.ts`)
- Reads the student's real quiz score breakdown.
- Reads their target exam date and daily study availability (e.g., 60 mins/day).
- Directs Gemini to allocate active recall sessions (e.g. flashcards, problem solving) prioritizing weak areas first.

---

## 🛡️ Error Handling & Troubleshooting

| Error Message | Cause | Resolution |
| :--- | :--- | :--- |
| `API key is missing or invalid` | `GEMINI_API_KEY` is blank in `server/.env`. | Add your Gemini key to `server/.env` and restart the backend server. |
| `Backend connection issue` | Express server is not running on port 5000. | Run `npm run server` in a terminal. |
| `The file appears to be a scanned image` | The PDF contains scanned images without OCR text. | Copy and paste the lecture notes text directly into the text box. |
| `Too many requests` | In-memory rate limiter exceeded (40 req/min). | Wait 30-60 seconds for the sliding window to reset. |

---

## 🏆 Presentation Tips for Hackathon Judges

1. **Load Sample Material**: On the Dashboard, click **"Load Sample Study Material"** to immediately load an Operating Systems study set with a pre-recorded diagnostic quiz showing a weak topic.
2. **Demonstrate Deterministic Scoring**: Go to **AI Quiz**, answer the questions, and show the judges how the score is calculated with zero hallucinations.
3. **Showcase the Grounded Tutor**: Go to **AI Tutor**, ask a question directly from the notes to show the green **"Grounded in notes"** badge with citations. Then ask an unrelated question to show the honest disclaimer.
4. **Trigger the Study Agent**: Go to **Study Planner**, show how the weak topic ($<60\%$) was identified and how Gemini drafted targeted study sessions fitting within the student's daily time limit.

---

## 📄 License
MIT License. Built for students, hackathons, and lifelong learners.
#   s t u d y - p i l o t - a i  
 #   s t u d y - p i l o t - A I  
 