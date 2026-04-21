import React, { useState } from 'react';
import { useReading } from '../context/ReadingContext';
import { useStories } from '../context/StoryContext';
import StoryList from '../components/StoryList';
import { useLanguage } from '../context/LanguageContext';

export default function LogPage() {
  const { readLog, favorites } = useReading();
  const { stories, isLoading, error } = useStories();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'favorites'

  const readStories = stories.filter(s => readLog.includes(s.id));
  const favoriteStories = stories.filter(s => favorites.includes(String(s.id)) || favorites.includes(Number(s.id)));


  if (isLoading) return <div className="page-content fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>⏳ {t('loadingStories')}</div>;
  if (error) return <div className="page-content fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>⚠️ {error}</div>;

  return (
    <div className="page-content fade-in">
      <div className="log-header">
        <h1>{t('logTitle')}</h1>
        <p className="subtitle">
          {t('logSubtitle', readStories.length)}
        </p>
      </div>

      <div className="log-tabs">
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('history')}
        </button>
        <button 
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          {t('favorites', favoriteStories.length)}
        </button>
      </div>

      <div className="log-content">
        {activeTab === 'history' && (
          readStories.length > 0 ? (
            <StoryList stories={readStories.reverse()} />
          ) : (
            <div className="empty-state">
              <span className="empty-emoji">📚</span>
              <p className="theme-aware-muted">{t('noHistory')}</p>
            </div>
          )

        )}

        {activeTab === 'favorites' && (
          favoriteStories.length > 0 ? (
             <StoryList stories={favoriteStories} />
          ) : (
            <div className="empty-state">
              <span className="empty-emoji">🤍</span>
              <p className="theme-aware-muted">{t('noFavorites')}</p>
            </div>
          )

        )}
      </div>
    </div>
  );
}
