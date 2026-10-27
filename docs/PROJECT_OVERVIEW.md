# StudyPilot AI — Project Overview

## 1. Executive Summary
**StudyPilot AI** is an intelligent, full-stack study companion web application engineered to transform raw educational materials (lecture slides, textbook PDFs, transcripts) into structured summaries, interactive multiple-choice diagnostic quizzes, and autonomous, performance-driven revision schedules.

The application combines a high-performance **Express + TypeScript** backend integrating the official **Google `@google/genai` SDK** with a modern **React + TypeScript + Vite** frontend styled in an Apple-inspired **Liquid Glass** aesthetic.

---

## 2. Core Value Proposition
Traditional study tools are either static document readers or generic chatbots that provide non-grounded answers and hallucinated advice. StudyPilot AI solves this through a closed-loop academic workflow:

```
[Upload PDF / Lecture Notes] 
         │
         ▼
[AI Extraction & Synthesis] ──▶ Executive Summaries + Key Concept Defs + Exam Points
         │
         ▼
[AI Diagnostic Quiz] ───────▶ Multiple Choice Questions with Explanations
         │
         ▼
[Deterministic Evaluation] ─▶ Real-time Score % & Topic Breakdown (<60% flagged as Weak)
         │
         ▼
[AI Study Agent Planner] ───▶ Actionable Revision Roadmap fitted to Daily Time & Exam Date
```

---

## 3. Key Features

### A. Intelligent Notes Synthesizer
- Extracts readable text from uploaded PDF documents using `pdf-parse` in an isolated backend service.
- Generates 3-part structured study guides:
  1. **Executive Summary**: Clear, conceptual multi-paragraph overview.
  2. **Key Concepts**: Definitional cards categorized by yield (`high`, `medium`, `low`).
  3. **Exam Revision Highlights**: Bulleted list of formulas, high-probability test points, and common pitfalls.

### B. Grounded AI Tutor
- Real-time chat powered by Google Gemini.
- Strict citation grounding: When student notes contain the answer, citations are provided.
- Honest disclaimer mode: If the uploaded notes do not cover the question, the tutor explicitly states this before providing supplementary context.

### C. Conceptual AI Quiz & Deterministic Scoring
- Generates 4-choice conceptual MCQs from notes.
- **Deterministic scoring**: Quiz evaluation is computed entirely in application code without delegating calculations to the LLM.
- Analyzes topic-by-topic accuracy and identifies topics with $< 60\%$ accuracy as weak areas.
- Post-submission breakdown reveals explanations and correct options.

### D. Adaptive AI Study Agent & Planner
- Considers student constraints: target exam date and daily available study time (e.g. 15 to 240 mins).
- Analyzes weak topics ($< 60\%$) to synthesize an actionable revision roadmap.
- Interactive task checklist with local storage persistence and celebratory completion effects.

---

## 4. Architectural Highlights
- **Clean Separation of Concerns**: Frontend UI components are isolated from API communication services.
- **Security-First Architecture**: `GEMINI_API_KEY` is strictly confined to `server/.env` and never leaked to client bundles.
- **In-Memory Rate Limiting**: Built-in sliding window rate limiter protects server and quota.
- **Zero-Dependency Core Scoring**: Scoring algorithms are unit tested and guaranteed deterministic.
