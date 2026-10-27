# StudyPilot AI — How It Works (Beginner-Friendly Guide)

This guide explains how StudyPilot AI operates under the hood, how data flows between the user interface and Google Gemini, and why key decisions were made.

---

## 1. The High-Level Architecture

StudyPilot AI is organized into two main parts:
1. **Frontend (Client)**: A fast React single-page app built with Vite and TypeScript. It handles user interactions, renders the Liquid Glass interface, and stores your study sessions in browser local storage.
2. **Backend (Server)**: A Node.js + Express + TypeScript server. It handles PDF file parsing, request validation, rate limiting, and securely talks to Google Gemini using the official `@google/genai` SDK.

```
┌─────────────────────────────────┐
│ React Frontend (Port 3000)      │
│ - Apple Liquid Glass UI         │
│ - Deterministic Quiz Scoring    │
│ - Local Storage Persistence     │
└──────────────┬──────────────────┘
               │ HTTP Requests (/api/...)
               ▼
┌─────────────────────────────────┐
│ Express Server (Port 5000)      │
│ - PDF Text Extractor (pdf-parse)│
│ - Validation & Rate Limiter     │
│ - Official Google GenAI SDK     │
└──────────────┬──────────────────┘
               │ Secure HTTPS with GEMINI_API_KEY
               ▼
┌─────────────────────────────────┐
│ Google Gemini API               │
│ - Structured JSON Responses     │
│ - Model: gemini-2.5-flash       │
└─────────────────────────────────┘
```

---

## 2. Step-by-Step Data Flow

### Step A: Uploading a Lecture Note or PDF
1. When you select a PDF file, your browser sends it to `POST /api/summary/extract-pdf`.
2. The server extracts the text using `pdf-parse` without saving any files to disk.
3. If the PDF is scanned or empty, the server returns an informative error asking you to paste text manually.
4. Next, the extracted text is sent to `POST /api/summary`.
5. The server prompts Google Gemini to return a structured JSON response with an Executive Summary, Key Concepts (with high/medium/low importance), and Exam Highlights.
6. The frontend saves this summary in your browser's local storage so you can review it anytime.

---

### Step B: Asking the Grounded AI Tutor
1. In the **AI Tutor** tab, you can ask any question about your notes.
2. You can pick which uploaded document should serve as the active context.
3. The server sends both your question and your notes to Gemini with a strict rule:
   - *If the answer is in the notes*: Provide the answer and list the cited keywords.
   - *If the answer is NOT in the notes*: Clearly state that the notes do not mention it, before offering general educational guidance.
4. The frontend displays this distinction clearly using color-coded badges (`Grounded in notes` vs `General explanation`).

---

### Step C: Taking an AI Quiz & Deterministic Scoring
1. In the **AI Quiz** tab, Gemini creates multiple-choice questions from your notes.
2. **Crucial Rule**: We do **NOT** ask Gemini to score the quiz!
   - Why? LLMs can make arithmetic mistakes or be inconsistent when grading.
   - Instead, the frontend uses a pure mathematical function (`calculateQuizResult` in `src/utils/quizScoring.ts`).
   - For every question, the student's selected choice is compared against `correctIndex`.
   - Score percentage is calculated as:
     $$\text{Score } \% = \text{round}\left(\frac{\text{Correct Answers}}{\text{Total Questions}} \times 100\right)$$
3. **Weak Topic Identification**:
   - For each topic tagged in the questions, the app computes accuracy.
   - Any topic with **accuracy strictly below 60%** is marked as `Needs Revision (<60%)`.
   - Any topic with **accuracy >= 60%** is marked as `Mastered`.

---

### Step D: The AI Study Agent & Adaptive Planner
1. Once you finish a quiz, the **Study Planner** receives your exact performance data:
   - Weak topics ($<60\%$)
   - Strong topics ($\ge 60\%$)
   - Days until your target exam
   - How many minutes you can study per day (e.g. 30, 60, 120 mins)
2. Gemini receives these real numbers and creates a personalized revision roadmap:
   - High priority tasks target your weak topics first.
   - Each task includes an active recall activity (e.g. flashcards, problem solving).
   - Time estimates fit into your daily study allowance.
3. You can check off tasks as you finish them, track your overall progress, and regenerate the plan after taking another quiz!
