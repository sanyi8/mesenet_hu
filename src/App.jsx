import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ReadingProvider } from './context/ReadingContext';
import { StoryProvider } from './context/StoryContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Header from './components/Header';
import TabBar from './components/TabBar';
import HomePage from './pages/HomePage';
import ReaderPage from './pages/ReaderPage';
import DiscoverPage from './pages/DiscoverPage';
import LogPage from './pages/LogPage';
import ProfilePage from './pages/ProfilePage';

function PlaceholderPage({ emoji, title, desc }) {
  return (
    <div className="placeholder-page fade-in">
      <div className="placeholder-emoji">{emoji}</div>
      <div className="placeholder-title">{title}</div>
      <div className="placeholder-desc">{desc}</div>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const isReader = location.pathname.startsWith('/read/');
  const { lang } = useLanguage();

  return (
    <div className={isReader ? '' : 'app-shell'} key={lang}>
      {!isReader && <Header />}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/read/:id" element={<ReaderPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/log" element={<LogPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <TabBar />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <StoryProvider>
          <ReadingProvider>
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </ReadingProvider>
        </StoryProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
