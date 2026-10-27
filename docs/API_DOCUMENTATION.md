# StudyPilot AI — Backend API Documentation

All API endpoints are served by the Express backend on `http://localhost:5000` (proxied in Vite dev server via `/api`).

---

## 1. System Health & Status

### `GET /api/health`
Returns the server operational status, uptime, and Google Gemini configuration status.

**Response `200 OK`**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-26T09:18:21.345Z",
  "uptime": 45.2,
  "geminiConfigured": true,
  "model": "gemini-2.5-flash",
  "message": "Gemini API is active and ready."
}
```

---

## 2. Study Notes & PDF Processing

### `POST /api/summary/extract-pdf`
Extracts raw plain text from an uploaded binary PDF document.

- **Content-Type**: `multipart/form-data`
- **Field**: `pdf` (Binary PDF file, max 10 MB)

**Response `200 OK`**:
```json
{
  "text": "Virtual memory provides an illusion of a very large memory...",
  "pageCount": 4,
  "charCount": 3840
}
```

**Errors**:
- `400 Bad Request`: File missing, oversized (>10MB), or scanned image without selectable text.

---

### `POST /api/summary`
Generates an executive summary, core key concepts, and exam revision highlights from study text.

- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "text": "Virtual memory decouples logical address space from physical RAM...",
  "title": "Operating Systems: Virtual Memory"
}
```

**Response `200 OK`**:
```json
{
  "title": "Operating Systems: Virtual Memory",
  "summary": "Executive summary paragraph...",
  "keyConcepts": [
    {
      "term": "Translation Lookaside Buffer (TLB)",
      "definition": "A hardware cache storing recent page translations.",
      "importance": "high"
    }
  ],
  "examPoints": [
    "LRU does not suffer from Belady's Anomaly because it is a stack algorithm."
  ],
  "wordCount": 168
}
```

---

## 3. Grounded AI Tutor

### `POST /api/tutor`
Interacts with the AI Tutor grounded in the student's study material.

- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "message": "What is Belady's Anomaly?",
  "notesContext": "Belady's Anomaly demonstrates that increasing physical frames...",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! What topic would you like to explore?" }
  ]
}
```

**Response `200 OK`**:
```json
{
  "reply": "Belady's Anomaly is a counter-intuitive phenomenon...",
  "groundedInNotes": true,
  "citations": ["Belady's Anomaly", "Page replacement algorithms"]
}
```

*Note: If the query is outside the notes context, `groundedInNotes` is set to `false` and an honest disclaimer is prefixed to the answer.*

---

## 4. AI Quiz Generation

### `POST /api/quiz`
Synthesizes conceptual multiple-choice questions from study text.

- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "text": "Virtual memory and page replacement notes...",
  "questionCount": 5
}
```

**Response `200 OK`**:
```json
{
  "title": "Practice Quiz",
  "questions": [
    {
      "id": "q1",
      "question": "Which algorithm exhibits Belady's Anomaly?",
      "options": ["FIFO", "LRU", "Optimal", "Clock"],
      "correctIndex": 0,
      "explanation": "FIFO is not a stack algorithm and can exhibit Belady's Anomaly.",
      "topic": "Page Replacement"
    }
  ]
}
```

---

## 5. Adaptive Study Agent

### `POST /api/study-plan`
Synthesizes a personalized revision timetable targeting weak topics ($<60\%$ accuracy).

- **Content-Type**: `application/json`

**Request Body**:
```json
{
  "weakTopics": [
    {
      "topic": "Page Replacement",
      "total": 3,
      "correct": 1,
      "accuracy": 33,
      "isWeak": true
    }
  ],
  "strongTopics": [
    {
      "topic": "TLB Hardware",
      "total": 2,
      "correct": 2,
      "accuracy": 100,
      "isWeak": false
    }
  ],
  "targetExamDate": "2026-11-10",
  "dailyAvailableMinutes": 60
}
```

**Response `200 OK`**:
```json
{
  "overallDiagnosis": "Focus on Page Replacement algorithms where accuracy is currently 33%.",
  "tasks": [
    {
      "topic": "Page Replacement",
      "priority": "high",
      "reason": "Scored 33% on recent diagnostic quiz.",
      "estimatedMinutes": 30,
      "recommendedActivity": "Diagram FIFO vs LRU frame transitions and review Belady anomaly."
    }
  ]
}
```
