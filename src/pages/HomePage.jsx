import { useState } from 'react';
import { useStories } from '../context/StoryContext';
import Header from '../components/Header';
import ContinueCard from '../components/ContinueCard';
import MoralWeightFilter from '../components/MoralWeightFilter';
import StoryCarousel from '../components/StoryCarousel';
import StoryList from '../components/StoryList';
import MerchBanner from '../components/MerchBanner';
import { useLanguage } from '../context/LanguageContext';

export default function HomePage() {
    const { stories, isLoading, error } = useStories();
    const { t } = useLanguage();
    const [filteredStories, setFilteredStories] = useState(null);

    // Provide immediate loading and error states to wait for API data
    if (isLoading) {
        return (
            <div className="fade-in" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', animation: 'spin 2s linear infinite' }}>⏳</div>
                <h2 style={{ marginTop: '20px' }}>{t('loadingStories')}</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in" style={{ padding: '80px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem' }}>⚠️</div>
                <h2 style={{ marginTop: '20px' }}>{t('somethingWentWrong')}</h2>
                <p>{error}</p>
            </div>
        );
    }

    // "Nektek ajánljuk" — shuffle for demo
    const recommended = [...stories].sort(() => Math.random() - 0.5);
    // "Friss mesék" — last 4 (changed from 3 to 4 to match image)
    const fresh = stories.slice(-4).reverse();

    return (
        <div className="fade-in">
            <ContinueCard />
            <MoralWeightFilter onFilterChange={setFilteredStories} />

            {filteredStories ? (
                <StoryList title={t('tonightsStories')} stories={filteredStories.slice(0, 5)} hideSeeAll={true} />
            ) : (
                <>
                    <StoryCarousel title={t('recommendedForYou')} stories={recommended} />
                    <StoryCarousel title={t('newStories')} stories={fresh} isSmall={true} />
                </>
            )}

            <MerchBanner />
        </div>
    );
}
