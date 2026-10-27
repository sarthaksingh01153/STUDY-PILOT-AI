import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles } from 'lucide-react';
import { GlassSidebar, NavigationPage } from './components/GlassSidebar';
import { Dashboard } from './pages/Dashboard';
import { AINotes } from './pages/AINotes';
import { AITutor } from './pages/AITutor';
import { AIQuiz } from './pages/AIQuiz';
import { StudyPlanner } from './pages/StudyPlanner';
import { NoteSummary, QuizResult, StudyPlan, HealthResponse } from './types';
import { notesService } from './services/notesService';
import { quizService } from './services/quizService';
import { studyPlanService } from './services/studyPlanService';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activePage, setActivePage] = useState<NavigationPage>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core application data loaded from local storage
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);

  // Active selections for cross-page navigation
  const [activeNoteContext, setActiveNoteContext] = useState<NoteSummary | null>(null);
  const [examDate, setExamDate] = useState<string>(() => {
    // Default exam date: 14 days from today
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Backend Health and Gemini status
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // Close mobile menu on navigation (keyboard Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Initialize data on mount
  useEffect(() => {
    setNotes(notesService.getNotes());
    setQuizResults(quizService.getResults());
    setActivePlan(studyPlanService.getActivePlan());

    // Check backend health
    const checkHealth = async () => {
      const res = await api.getHealth();
      setHealth(res);
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Pre-populate with high quality sample study data for demonstration
  const handleLoadSampleData = () => {
    const sampleNote: NoteSummary = {
      id: `sample-os-notes-${Date.now()}`,
      title: 'Operating Systems: Virtual Memory & Paging',
      rawText: `Virtual memory provides an illusion of a very large memory by using disk space as secondary backing store.
Paged virtual memory divides virtual address space into fixed-size pages (commonly 4KB) and physical memory into frames.
The Translation Lookaside Buffer (TLB) is a high-speed hardware cache that stores recent virtual-to-physical address mappings. A TLB miss incurs a page table walk.
Page fault handling occurs when the valid-invalid bit in a page table entry indicates that the requested page is not currently resident in physical RAM. The OS context-switches, reads the missing page from disk, updates the page table, and restarts the faulting instruction.
Page replacement algorithms include FIFO, LRU (Least Recently Used), and Clock (Second Chance). Belady's Anomaly demonstrates that increasing physical page frames can paradoxically increase page faults for FIFO replacement. LRU is a stack algorithm and does not suffer from Belady's Anomaly.
Thrashing occurs when a process does not have enough frames to support its active working set, causing the CPU to spend nearly all its execution time swapping pages to and from disk rather than executing user code.`,
      summary:
        "Virtual memory decouples logical address space from physical RAM via fixed-size pages and page tables. Key hardware accelerations include the Translation Lookaside Buffer (TLB), while the OS kernel manages page faults and page replacement. Essential concepts include Belady's Anomaly in FIFO and working set management to prevent thrashing.",
      keyConcepts: [
        {
          term: 'Translation Lookaside Buffer (TLB)',
          definition:
            'A specialized hardware cache used to speed up virtual-to-physical address translations by storing recent page table entries.',
          importance: 'high',
        },
        {
          term: "Belady's Anomaly",
          definition:
            'A phenomenon where increasing the number of page frames results in an increase in the number of page faults (affects FIFO, but not LRU).',
          importance: 'high',
        },
        {
          term: 'Thrashing',
          definition:
            'A high paging state where the system spends significantly more time swapping pages than executing application instructions.',
          importance: 'medium',
        },
        {
          term: 'Page Fault',
          definition:
            'A hardware interrupt raised by the MMU when a program accesses a virtual page that is not currently mapped into physical memory.',
          importance: 'high',
        },
      ],
      examPoints: [
        "LRU and Optimal replacement algorithms never suffer from Belady's Anomaly because they belong to the class of stack algorithms.",
        'Effective Memory Access Time (EMAT) formula: EMAT = (TLB Hit Rate × Access Time) + (TLB Miss Rate × (Access Time + Page Table Lookup Time)).',
        'Thrashing can be mitigated using the Working Set model or Page-Fault Frequency (PFF) strategy.',
      ],
      createdAt: new Date().toISOString(),
      wordCount: 168,
    };

    // Realistic sample quiz result: demonstrates weak topic (<60%) for Study Agent
    const sampleResult: QuizResult = {
      id: `sample-result-${Date.now()}`,
      quizId: 'sample-quiz-1',
      quizTitle: 'Operating Systems: Memory Hierarchy Quiz',
      totalQuestions: 5,
      correctCount: 2,
      scorePercentage: 40,
      completedAt: new Date().toISOString(),
      topicBreakdown: {
        'TLB Performance': {
          topic: 'TLB Performance',
          total: 2,
          correct: 2,
          accuracy: 100,
          isWeak: false,
        },
        'Page Replacement Algorithms': {
          topic: 'Page Replacement Algorithms',
          total: 3,
          correct: 0,
          accuracy: 0,
          isWeak: true,
        },
      },
      weakTopics: ['Page Replacement Algorithms'],
      strongTopics: ['TLB Performance'],
      detailedAnswers: [
        {
          questionIndex: 0,
          question: "Which page replacement algorithm can experience Belady's Anomaly?",
          topic: 'Page Replacement Algorithms',
          selectedOption: 1,
          correctOption: 0,
          isCorrect: false,
          explanation:
            "FIFO (First-In, First-Out) exhibits Belady's Anomaly, whereas stack algorithms like LRU do not.",
        },
      ],
    };

    const updatedNotes = notesService.saveNote(sampleNote);
    const updatedResults = quizService.saveResult(sampleResult);

    setNotes(updatedNotes);
    setQuizResults(updatedResults);
    setActiveNoteContext(sampleNote);
  };

  const handleNavigate = (page: NavigationPage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header (Visible on ≤ 768px) */}
      <header className="mobile-topbar">
        <div className="mobile-topbar-brand">
          <div className="mobile-topbar-logo" aria-hidden="true">
            <Sparkles size={15} />
          </div>
          <span className="mobile-topbar-title">StudyPilot AI</span>
        </div>

        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="app-sidebar"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      {/* Mobile backdrop */}
      <div
        className={`mobile-backdrop ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Floating Glass Sidebar */}
      <GlassSidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        health={health}
      />

      {/* Main Content View */}
      <main className="app-main" id="main-content">
        {activePage === 'dashboard' && (
          <Dashboard
            notes={notes}
            results={quizResults}
            onNavigate={handleNavigate}
            examDate={examDate}
            onSetExamDate={setExamDate}
            onLoadSampleData={handleLoadSampleData}
          />
        )}

        {activePage === 'notes' && (
          <AINotes
            notes={notes}
            onNotesUpdated={setNotes}
            onNavigate={handleNavigate}
            onSelectNoteForContext={setActiveNoteContext}
          />
        )}

        {activePage === 'tutor' && (
          <AITutor
            notes={notes}
            activeNoteContext={activeNoteContext}
            onSelectContextNote={setActiveNoteContext}
          />
        )}

        {activePage === 'quiz' && (
          <AIQuiz
            notes={notes}
            activeQuizNote={activeNoteContext}
            onNavigate={handleNavigate}
            onQuizCompleted={(_res) => {
              setQuizResults(quizService.getResults());
            }}
          />
        )}

        {activePage === 'planner' && (
          <StudyPlanner
            quizResults={quizResults}
            activePlan={activePlan}
            onPlanUpdated={setActivePlan}
            examDate={examDate}
            onSetExamDate={setExamDate}
            onNavigate={handleNavigate}
          />
        )}
      </main>
    </div>
  );
};

export default App;
