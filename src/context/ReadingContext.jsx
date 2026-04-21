import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ReadingContext = createContext();

export function ReadingProvider({ children }) {
    // Reading progress: { storyId, scrollPercent, timestamp }
    const [lastRead, setLastRead] = useState(() => {
        const saved = localStorage.getItem('mesenet-last-read');
        return saved ? JSON.parse(saved) : null;
    });

    // Reading log: array of storyIds
    const [readLog, setReadLog] = useState(() => {
        const saved = localStorage.getItem('mesenet-read-log');
        return saved ? JSON.parse(saved) : []; 
    });

    // Favorites: array of storyIds
    const [favorites, setFavorites] = useState(() => {
        const saved = localStorage.getItem('mesenet-favorites');
        return saved ? JSON.parse(saved) : []; 
    });

    // Ratings: { [storyId]: 'up' | 'down' }
    const [ratings, setRatings] = useState(() => {
        const saved = localStorage.getItem('mesenet-ratings');
        return saved ? JSON.parse(saved) : {};
    });

    // User Drawings: array of { id, storyId, dataUrl, timestamp }
    const [userDrawings, setUserDrawings] = useState(() => {
        const saved = localStorage.getItem('mesenet-drawings');
        return saved ? JSON.parse(saved) : [];
    });


    useEffect(() => {
        if (lastRead) localStorage.setItem('mesenet-last-read', JSON.stringify(lastRead));
    }, [lastRead]);

    useEffect(() => {
        localStorage.setItem('mesenet-read-log', JSON.stringify(readLog));
    }, [readLog]);

    useEffect(() => {
        localStorage.setItem('mesenet-favorites', JSON.stringify(favorites));
    }, [favorites]);

    useEffect(() => {
        localStorage.setItem('mesenet-ratings', JSON.stringify(ratings));
    }, [ratings]);

    useEffect(() => {
        localStorage.setItem('mesenet-drawings', JSON.stringify(userDrawings));
    }, [userDrawings]);


    const updateProgress = useCallback((storyId, scrollPercent) => {
        setLastRead({ storyId, scrollPercent, timestamp: Date.now() });
    }, []);

    const markAsRead = useCallback((storyId) => {
        setReadLog((prev) => {
            if (prev.includes(storyId)) return prev;
            return [...prev, storyId];
        });
    }, []);

    const rateStory = useCallback((storyId, rating) => {
        setRatings((prev) => ({ ...prev, [storyId]: rating }));
    }, []);

    const toggleFavorite = useCallback((storyId) => {
        setFavorites((prev) => {
            if (prev.includes(storyId)) return prev.filter(id => id !== storyId);
            return [...prev, storyId];
        });
    }, []);

    const clearProgress = useCallback(() => {
        setLastRead(null);
        localStorage.removeItem('mesenet-last-read');
    }, []);

    const saveDrawing = useCallback((storyId, dataUrl) => {
        setUserDrawings((prev) => {
            const newDrawing = {
                id: Date.now().toString(),
                storyId,
                dataUrl,
                timestamp: Date.now()
            };
            return [newDrawing, ...prev];
        });
    }, []);

    const deleteDrawing = useCallback((drawingId) => {
        setUserDrawings((prev) => prev.filter(d => d.id !== drawingId));
    }, []);


    return (
        <ReadingContext.Provider value={{
            lastRead,
            readLog,
            favorites,
            ratings,
            userDrawings,
            updateProgress,
            markAsRead,
            toggleFavorite,
            rateStory,
            saveDrawing,
            deleteDrawing,
            clearProgress,

        }}>
            {children}
        </ReadingContext.Provider>
    );
}

export function useReading() {
    return useContext(ReadingContext);
}
