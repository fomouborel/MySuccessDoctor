import { useEffect, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, Link, useLocation } from 'react-router';
import { ProgressProvider } from '../state/ProgressContext';
import SessionPage from '../features/quizzes/SessionPage';
import { QuestionPage, TrainingPage } from '../features/quizzes/pages';
import { ChapterPage, CoursesPage, LessonPage } from '../features/learning/pages';
import { CasesPage, ExamDetailPage, ExamsPage, MockExamRunPage, MockExamsPage } from '../features/exams/pages';
import { ErrorsPage, RevisionsPage } from '../features/revision/pages';
import { HomePage, ProgressPage } from '../features/progress/pages';
import { AboutPage } from './AboutPage';

const NAV = [
  { to: '/', label: 'Accueil', ico: '🏠', end: true },
  { to: '/cours', label: 'Mes cours', ico: '📘' },
  { to: '/entrainement', label: 'Entraînement', ico: '🎯' },
  { to: '/examens', label: 'Anciens examens', ico: '🗂️' },
  { to: '/cas-cliniques', label: 'Cas cliniques', ico: '🩺' },
  { to: '/examens-blancs', label: 'Examens blancs', ico: '⏱️' },
  { to: '/erreurs', label: 'Mes erreurs', ico: '❗' },
  { to: '/revisions', label: 'Mes révisions', ico: '🔁' },
  { to: '/progression', label: 'Ma progression', ico: '📈' },
];
const BOTTOM: Record<string, string> = { '/': 'Accueil', '/cours': 'Cours', '/entrainement': 'Entraîner', '/revisions': 'Révisions' };
const logo = `${import.meta.env.BASE_URL}icon.svg`;

function Brand() {
  return (
    <Link to="/" className="brand">
      <img src={logo} alt="" />
      <span>
        <strong>DIGEST ACADEMY</strong>
        <small>Secteur digestif · UCL</small>
      </span>
    </Link>
  );
}

function Shell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="app">
      <header className="topbar">
        <Brand />
      </header>
      <nav className={`sidebar${menuOpen ? ' open' : ''}`} aria-label="Navigation principale">
        <button className="btn secondary small close-menu" type="button" onClick={() => setMenuOpen(false)}>
          Fermer ✕
        </button>
        <Brand />
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className="nav-link">
            <span className="ico" aria-hidden>
              {n.ico}
            </span>
            {n.label}
          </NavLink>
        ))}
        <div className="sidebar-foot">
          <Link to="/a-propos" style={{ color: '#a9c1df' }}>
            À propos, sources et confidentialité
          </Link>
        </div>
      </nav>
      <main className="main" id="contenu">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cours" element={<CoursesPage />} />
          <Route path="/cours/:chapterId" element={<ChapterPage />} />
          <Route path="/cours/:chapterId/:lessonId" element={<LessonPage />} />
          <Route path="/entrainement" element={<TrainingPage />} />
          <Route path="/examens" element={<ExamsPage />} />
          <Route path="/examens/:examId" element={<ExamDetailPage />} />
          <Route path="/cas-cliniques" element={<CasesPage />} />
          <Route path="/examens-blancs" element={<MockExamsPage />} />
          <Route path="/examens-blancs/:sessionId" element={<MockExamRunPage />} />
          <Route path="/erreurs" element={<ErrorsPage />} />
          <Route path="/revisions" element={<RevisionsPage />} />
          <Route path="/progression" element={<ProgressPage />} />
          <Route path="/question/:id" element={<QuestionPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route
            path="*"
            element={
              <div className="card empty">
                Page introuvable. <Link to="/">Retour à l’accueil</Link>
              </div>
            }
          />
        </Routes>
      </main>
      <nav className="bottombar" aria-label="Navigation rapide">
        {NAV.filter((n) => n.to in BOTTOM).map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end}>
            <span className="ico" aria-hidden>
              {n.ico}
            </span>
            {BOTTOM[n.to]}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMenuOpen(true)} aria-expanded={menuOpen}>
          <span className="ico" aria-hidden>
            ☰
          </span>
          Menu
        </button>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </ProgressProvider>
  );
}
