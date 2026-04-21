import React, { useState, useMemo } from 'react';
import StoryList from '../components/StoryList';
import CollectionScrubber from '../components/CollectionScrubber';
import { useStories } from '../context/StoryContext';
import { useLanguage } from '../context/LanguageContext';

export default function DiscoverPage() {
  const { stories, isLoading, error } = useStories();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [selectedCollection, setSelectedCollection] = useState(null);

  const tags = ['all', ...new Set(stories.flatMap(s => s.tags || []))];

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            story.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag === 'all' || (story.tags && story.tags.includes(selectedTag));
      const matchesCollection = !selectedCollection || story.collection === selectedCollection;
      return matchesSearch && matchesTag && matchesCollection;
    });
  }, [searchQuery, selectedTag, selectedCollection, stories]);

  if (isLoading) return <div className="page-content fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>⏳ {t('searchLoading')}</div>;
  if (error) return <div className="page-content fade-in" style={{ textAlign: 'center', paddingTop: '100px' }}>⚠️ {error}</div>;

  return (
    <div className="page-content fade-in">
      {/* iPhone style A-Z Scrubber */}
      <CollectionScrubber 
        stories={stories} 
        selectedCollection={selectedCollection} 
        onSelect={setSelectedCollection} 
      />

      <div className="discover-header">
        <h1>
          {t('discoverLabel')}
          {selectedCollection && <span className="active-collection-badge"> /{selectedCollection}</span>}
        </h1>
        <div className="search-bar">
          <input 
            type="text" 
            placeholder={t('searchStories')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="category-chips">
        {tags.map(tag => (
          <button 
            key={tag}
            className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
            onClick={() => setSelectedTag(tag)}
          >
            {tag === 'all' ? t('all') : tag}
          </button>
        ))}
      </div>

      <div className="discover-content">
        {filteredStories.length > 0 ? (
          <StoryList stories={filteredStories} />
        ) : (
          <div className="empty-state">
            <span className="empty-emoji">🤔</span>
            <p>{t('noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
