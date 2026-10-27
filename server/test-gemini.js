/**
 * Automated Gemini API Integration Verification Script
 * Tests all 5 endpoints against the running Express server using real C programming sample notes.
 */

const BASE_URL = 'http://localhost:5000/api';

const cNotes = `
In C programming, a pointer is a variable that stores the memory address of another variable.
The address-of operator (&) returns the memory location, while the dereference operator (*) accesses the value stored at that address.
Dynamic memory allocation is managed using malloc(), calloc(), realloc(), and free() in <stdlib.h>.
Memory allocated via malloc() resides on the heap and remains allocated until explicitly released using free().
A dangling pointer points to memory that has been deallocated, which causes undefined behavior if accessed.
Memory leaks occur when heap memory is allocated but never freed before losing the reference pointer.
`;

async function runTests() {
  console.log('====================================================');
  console.log('🧪 StudyPilot AI — Gemini API Integration Test Suite');
  console.log('====================================================\n');

  // Test 1: GET /api/health
  console.log('1️⃣ Testing GET /api/health...');
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log('   Status Code:', healthRes.status);
    console.log('   Gemini Configured:', health.geminiConfigured);
    console.log('   Model:', health.model);
    console.log('   Message:', health.message);

    if (!health.geminiConfigured) {
      console.log('\n⚠️  GEMINI_API_KEY is not configured in server/.env yet.');
      console.log('   Add your key from https://aistudio.google.com/ to server/.env');
      console.log('   and run this test again to verify live AI generation.\n');
      return;
    }
    console.log('   ✅ Health check passed: Gemini API key detected.\n');
  } catch (err) {
    console.error('   ❌ Server unreachable:', err.message);
    return;
  }

  // Test 2: POST /api/summary with C programming notes
  console.log('2️⃣ Testing POST /api/summary with C programming notes...');
  try {
    const res = await fetch(`${BASE_URL}/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cNotes,
        title: 'C Programming: Pointers and Dynamic Memory',
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('   ❌ Summary failed:', data.error);
      return;
    }

    console.log('   ✅ Gemini Summary Received!');
    console.log('   Title:', data.title);
    console.log('   Summary Snippet:', data.summary.substring(0, 120) + '...');
    console.log('   Key Concepts Extracted:', data.keyConcepts.length);
    data.keyConcepts.forEach((c) => console.log(`     * [${c.importance}] ${c.term}: ${c.definition.substring(0, 60)}...`));
    console.log('   Exam Points:', data.examPoints.length);
    console.log('\n');
  } catch (err) {
    console.error('   ❌ Summary request error:', err.message);
    return;
  }

  // Test 3: POST /api/quiz
  console.log('3️⃣ Testing POST /api/quiz...');
  try {
    const res = await fetch(`${BASE_URL}/quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cNotes,
        questionCount: 3,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('   ❌ Quiz failed:', data.error);
      return;
    }

    console.log('   ✅ Gemini Quiz Generated!');
    console.log('   Quiz Title:', data.title);
    console.log('   Questions Generated:', data.questions.length);
    data.questions.forEach((q, i) => {
      console.log(`     Q${i + 1} (${q.topic}): ${q.question}`);
      console.log(`        Correct Option [${q.correctIndex}]: ${q.options[q.correctIndex]}`);
    });
    console.log('\n');
  } catch (err) {
    console.error('   ❌ Quiz request error:', err.message);
    return;
  }

  // Test 4: POST /api/tutor
  console.log('4️⃣ Testing POST /api/tutor...');
  try {
    const res = await fetch(`${BASE_URL}/tutor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'What is a dangling pointer and why is it dangerous?',
        notesContext: cNotes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('   ❌ Tutor failed:', data.error);
      return;
    }

    console.log('   ✅ Gemini Tutor Reply Received!');
    console.log('   Grounded in Notes:', data.groundedInNotes);
    console.log('   Citations:', data.citations);
    console.log('   Reply Snippet:', data.reply.substring(0, 150) + '...');
    console.log('\n');
  } catch (err) {
    console.error('   ❌ Tutor request error:', err.message);
    return;
  }

  // Test 5: POST /api/study-plan
  console.log('5️⃣ Testing POST /api/study-plan...');
  try {
    const res = await fetch(`${BASE_URL}/study-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weakTopics: [
          { topic: 'Dynamic Memory & Free', total: 3, correct: 1, accuracy: 33, isWeak: true },
        ],
        strongTopics: [
          { topic: 'Pointer Syntax', total: 2, correct: 2, accuracy: 100, isWeak: false },
        ],
        targetExamDate: '2026-11-15',
        dailyAvailableMinutes: 45,
        studyNotesSnippet: cNotes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('   ❌ Study Plan failed:', data.error);
      return;
    }

    console.log('   ✅ Gemini Study Agent Schedule Generated!');
    console.log('   Overall Diagnosis:', data.overallDiagnosis);
    console.log('   Revision Tasks:', data.tasks.length);
    data.tasks.forEach((t) => {
      console.log(`     * [${t.priority.toUpperCase()}] ${t.topic} (${t.estimatedMinutes}m): ${t.recommendedActivity}`);
    });
    console.log('\n');
  } catch (err) {
    console.error('   ❌ Study Plan request error:', err.message);
    return;
  }

  console.log('🎉 All Gemini API integration tests passed successfully!');
}

runTests();
