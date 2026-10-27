import React from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  HelpCircle,
  CalendarCheck,
  Zap,
  Sparkles,
} from 'lucide-react';
import { HealthResponse } from '../types';

export type NavigationPage = 'dashboard' | 'notes' | 'tutor' | 'quiz' | 'planner';

interface GlassSidebarProps {
  activePage: NavigationPage;
  onNavigate: (page: NavigationPage) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  health: HealthResponse | null;
}

interface NavItem {
  id: NavigationPage;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  description: string;
}

/**
 * Floating Apple-style Liquid Glass sidebar with accessible navigation
 * and real-time backend health indicator.
 */
export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  health,
}) => {
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard size={17} aria-hidden="true" />,
      description: 'Study overview and progress',
    },
    {
      id: 'notes',
      label: 'AI Notes',
      icon: <FileText size={17} aria-hidden="true" />,
      description: 'Upload PDFs and generate summaries',
    },
    {
      id: 'tutor',
      label: 'AI Tutor',
      icon: <MessageSquare size={17} aria-hidden="true" />,
      description: 'Chat with your AI study assistant',
    },
    {
      id: 'quiz',
      label: 'AI Quiz',
      icon: <HelpCircle size={17} aria-hidden="true" />,
      description: 'Test your knowledge with MCQs',
    },
    {
      id: 'planner',
      label: 'Study Planner',
      icon: <CalendarCheck size={17} aria-hidden="true" />,
      badge: 'Agent',
      description: 'AI-generated revision schedule',
    },
  ];

  const handleSelect = (page: NavigationPage) => {
    onNavigate(page);
    onCloseMobile();
  };

  // Determine health status
  const isOnline = health?.status === 'ok';
  const isConfigured = health?.geminiConfigured;
  const healthClass = isOnline && isConfigured ? 'online' : isOnline ? 'warning' : 'offline';
  const healthLabel = isConfigured
    ? `${health?.model || 'Gemini'} Active`
    : isOnline
    ? 'API Key Missing'
    : 'Backend Offline';
  const healthSub = isConfigured
    ? 'Gemini SDK connected'
    : 'Set GEMINI_API_KEY in server/.env';

  return (
    <aside
      className={`app-sidebar ${mobileOpen ? 'mobile-open' : ''}`}
      aria-label="Main navigation"
      role="navigation"
    >
      {/* Brand Header — use div not h1 to avoid duplicate landmarks */}
      <div className="sidebar-header">
        <div className="sidebar-logo-icon" aria-hidden="true">
          <Zap size={19} />
        </div>
        <div>
          <div className="sidebar-brand-title">StudyPilot AI</div>
          <div className="sidebar-brand-sub">Intelligent Study Engine</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav" aria-label="Study workspace navigation">
        <div className="sidebar-section-label" aria-hidden="true">
          Study Workspace
        </div>

        {navItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`nav-link ${isActive ? 'active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${item.label} — ${item.description}`}
              title={item.description}
            >
              {item.icon}
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge && (
                <span
                  className="glass-badge glass-badge-indigo nav-link-badge"
                  aria-label={`${item.badge} feature`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Health Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-health-card" role="status" aria-live="polite">
          <div className="sidebar-health-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                className={`status-dot ${healthClass}`}
                aria-label={`Backend status: ${healthLabel}`}
              />
              <span className="sidebar-health-label">{healthLabel}</span>
            </div>
            <Sparkles
              size={13}
              style={{ color: 'var(--accent-blue)', opacity: 0.7 }}
              aria-hidden="true"
            />
          </div>
          <p className="sidebar-health-sub">{healthSub}</p>
        </div>
      </div>
    </aside>
  );
};
