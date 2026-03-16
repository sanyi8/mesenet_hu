import { createContext, useContext, useState, useEffect } from 'react';

const translations = {
    hu: {
        home: 'Főoldal',
        discover: 'Felfedezés',
        log: 'Napló',
        profile: 'Profil',
        back: 'Vissza',
        continue: 'Folytatás',
        recommended: 'Nektek ajánljuk',
        fresh: 'Friss mesék',
        loading: 'Betöltés...',
        error: 'Hiba',
        storyNotFound: 'Mese nem található',
        backToHome: 'Vissza a főoldalra',
        end: '~ Vége ~',
        didYouLike: 'Tetszett a mese?',
        letsTalk: 'Miről beszélgessünk?',
        share: 'Megosztás',
        illDraw: 'Rajzolok egyet',
        nextStory: 'Következő mese',
        drawPrompt: 'Rajzold le, mi tetszett a legjobban a mesében, tölts fel egy fotót, és a Mesegép jövő héten életre kelti!',
        drawButton: 'Rajzolok egyet',
        uploadButton: 'Fotó feltöltése',
        saved: 'elmentve!',
        themeToggle: 'Témaváltás',
        loadingStories: 'Mesék betöltése...',
        somethingWentWrong: 'A manóba, valami elromlott!',
        recommendedForYou: '✨ Nektek ajánljuk',
        newStories: '🆕 Friss mesék',
        tonightsStories: 'Ennek az estének a meséi',
        discoverLabel: 'Felfedezés',
        searchStories: 'Mesék keresése...',
        all: 'Minden',
        noResults: 'Nincs találat a keresésre.',
        searchLoading: 'Keresés betöltése...'
    },
    en: {
        home: 'Home',
        discover: 'Discover',
        log: 'Journal',
        profile: 'Profile',
        back: 'Back',
        continue: 'Continue',
        recommended: 'Recommended',
        fresh: 'New Stories',
        loading: 'Loading...',
        error: 'Error',
        storyNotFound: 'Story not found',
        backToHome: 'Back to home',
        end: '~ The End ~',
        didYouLike: 'Did you like the story?',
        letsTalk: "Let's talk about it",
        share: 'Share',
        illDraw: "I'll draw one",
        nextStory: 'Next story',
        drawPrompt: 'Draw what you liked best in the story, upload a photo, and the StoryMachine will bring it to life next week!',
        drawButton: 'I want to draw',
        uploadButton: 'Upload photo',
        saved: 'saved!',
        themeToggle: 'Switch theme',
        loadingStories: 'Loading stories...',
        somethingWentWrong: 'Oops, something went wrong!',
        recommendedForYou: '✨ Recommended for you',
        newStories: '🆕 New stories',
        tonightsStories: "Tonight's stories",
        discoverLabel: 'Discover',
        searchStories: 'Search stories...',
        all: 'All',
        noResults: 'No stories found.',
        searchLoading: 'Loading search...'
    }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(localStorage.getItem('lang') || 'hu');

    useEffect(() => {
        localStorage.setItem('lang', lang);
        document.documentElement.lang = lang;
    }, [lang]);

    const t = (key) => translations[lang][key] || key;

    const toggleLanguage = () => setLang(prev => prev === 'hu' ? 'en' : 'hu');

    return (
        <LanguageContext.Provider value={{ lang, t, toggleLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext);
