import React, { createContext, useContext, useState, useEffect } from 'react';

const StoryContext = createContext();

export function StoryProvider({ children }) {
    const [stories, setStories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStories = async () => {
            try {
                // Fetch up to 100 stories, embed taxonomy and author data
                const res = await fetch('https://api.mesenet.hu/wp-json/wp/v2/mese?_embed&per_page=100');
                if (!res.ok) throw new Error('Nem sikerült betölteni a meséket az API-ból.');
                
                const data = await res.json();
                
                const mappedStories = data.map(post => {
                    const acf = post.acf || {};
                    const embeddedTerms = post._embedded?.['wp:term']?.flat() || [];

                    // Extract taxonomy names from embedded data
                    const getTermsByTaxonomy = (taxName) => 
                        embeddedTerms.filter(term => term.taxonomy === taxName).map(term => term.name);

                    const ageGroups = getTermsByTaxonomy('age_group');
                    const tags = getTermsByTaxonomy('story_tag');
                    const moods = getTermsByTaxonomy('mood');
                    const collections = getTermsByTaxonomy('collection');
                    
                    // Fallback to ACF mood/moral weight if taxonomy doesn't exist
                    let moralWeight = 2; // Default
                    if (moods.length > 0) {
                        const m = moods[0].toLowerCase();
                        if (m.includes('könnyed')) moralWeight = 1;
                        if (m.includes('komoly')) moralWeight = 3;
                    }

                    // Extract featured image completely
                    const featuredMedia = post._embedded?.['wp:featuredmedia'];
                    const featuredImage = featuredMedia && featuredMedia.length > 0 ? featuredMedia[0].source_url : null;

                    return {
                        id: post.id,
                        title: post.title?.rendered || 'Névtelen mese',
                        slug: post.slug,
                        content: post.content?.rendered || '', 
                        heroImage: acf.hero_image || '📖',
                        coverEmoji: acf.hero_image || '📖',
                        featuredImage: featuredImage,
                        readingTime: parseInt(acf.reading_time) || 5,
                        ageGroup: ageGroups.length > 0 ? ageGroups[0] : '4-6',
                        collection: collections.length > 0 ? collections[0] : null,
                        moralWeight: moralWeight,
                        tags: tags,
                        discussionQuestions: [
                            acf.question_1,
                            acf.question_2,
                            acf.question_3
                        ].filter(q => q && q.trim() !== '')
                    };
                });
                
                setStories(mappedStories);
            } catch (err) {
                console.error('WP API Error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStories();
    }, []);

    return (
        <StoryContext.Provider value={{ stories, isLoading, error }}>
            {children}
        </StoryContext.Provider>
    );
}

export function useStories() {
    return useContext(StoryContext);
}
