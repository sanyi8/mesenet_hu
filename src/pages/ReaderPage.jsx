import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useReading } from '../context/ReadingContext';
import { useStories } from '../context/StoryContext';
import DrawingCanvas from '../components/DrawingCanvas';
import FeedbackModal from '../components/FeedbackModal';


const QUESTION_EMOJIS = ['🫶', '🌱', '💡'];

export default function ReaderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cycleTheme, themeIcon } = useTheme();
    const { updateProgress, markAsRead, rateStory, ratings, lastRead, saveDrawing, userDrawings } = useReading();
    const { stories, isLoading, error } = useStories();


    const story = stories.find((s) => s.id === parseInt(id));
    const contentRef = useRef(null);
    const hideTimeout = useRef(null);
    const fileInputRef = useRef(null);

    const [scrollPercent, setScrollPercent] = useState(0);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [discussionOpen, setDiscussionOpen] = useState(false);
    const [currentRating, setCurrentRating] = useState(ratings[id] || null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    
    // Check if there's already a drawing for this story
    const existingDrawing = userDrawings.find(d => d.storyId === parseInt(id));
    const [tempDrawing, setTempDrawing] = useState(existingDrawing?.dataUrl || null);
    const [workshopOpen, setWorkshopOpen] = useState(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);




    // Restore scroll position
    useEffect(() => {
        if (lastRead && lastRead.storyId === parseInt(id) && lastRead.scrollPercent > 0) {
            setTimeout(() => {
                const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
                window.scrollTo({ top: (lastRead.scrollPercent / 100) * scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [id, lastRead]);

    // Close lightbox on Escape
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') setLightboxOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Track scroll
    const handleScroll = useCallback(() => {
        const scrollTop = window.scrollY;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
        setScrollPercent(Math.min(100, Math.round(percent)));
        setHeaderVisible(false);
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => setHeaderVisible(true), 150);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => { window.removeEventListener('scroll', handleScroll); clearTimeout(hideTimeout.current); };
    }, [handleScroll]);

    // Save progress
    useEffect(() => {
        const interval = setInterval(() => { if (scrollPercent > 0) updateProgress(parseInt(id), scrollPercent); }, 5000);
        return () => clearInterval(interval);
    }, [scrollPercent, id, updateProgress]);

    // Mark as read
    useEffect(() => { if (scrollPercent >= 95) markAsRead(parseInt(id)); }, [scrollPercent, id, markAsRead]);

    const handleContentClick = (e) => {
        setHeaderVisible(true);
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => { if (window.scrollY > 100) setHeaderVisible(false); }, 3000);

        // Event delegation for data-driven feedback buttons from WP content
        const target = e.target.closest('button');
        if (target) {
            if (target.id === 'mese-feedback-down') {
                e.preventDefault();
                setIsFeedbackModalOpen(true);
            } else if (target.id === 'mese-feedback-up') {
                e.preventDefault();
                alert('Örülünk, hogy tetszett! ❤️');
                handleRate('up');
            }
        }
    };


    const handleRate = (rating) => {
        setCurrentRating(rating);
        rateStory(parseInt(id), rating);
        if (rating === 'down') {
            setIsFeedbackModalOpen(true);
        }
    };


    const getNextStory = () => {
        const idx = stories.findIndex((s) => s.id === parseInt(id));
        return stories[(idx + 1) % stories.length];
    };

    const handleShare = async (e) => {
        e.stopPropagation();
        if (navigator.share) {
            try { await navigator.share({ title: story.title, text: 'A Mesenet appban olvasom!', url: window.location.href }); }
            catch (err) { console.log('Share failed', err); }
        } else {
            alert('A megosztás nem támogatott ezen az eszközön.');
        }
    };

    const handleFileChange = (e) => { 
        const f = e.target.files[0]; 
        if (f) {
            setUploadedFile(f);
            setTempDrawing(null);
        }
    };

    const handleSaveDrawing = (dataUrl) => {
        setTempDrawing(dataUrl);
        setIsDrawingMode(false);
        saveDrawing(parseInt(id), dataUrl);
        setUploadedFile({ name: 'Saját rajz.png' });
    };


    if (isLoading) return <div className="reader-shell fade-in" style={{ textAlign: 'center', paddingTop: 100 }}>⏳ Betöltés...</div>;
    if (error) return <div className="reader-shell fade-in" style={{ textAlign: 'center', paddingTop: 100 }}>⚠️ Hiba: {error}</div>;
    if (!story) return (
        <div className="reader-shell">
            <div className="placeholder-page">
                <div className="placeholder-emoji">📖</div>
                <div className="placeholder-title">Mese nem található</div>
                <button className="next-story-btn" onClick={() => navigate('/')}>← Vissza a főoldalra</button>
            </div>
        </div>
    );

    const contentHtml = story.content.includes('<p>') ? story.content : story.content.split('\n\n').map(p => `<p>${p}</p>`).join('');
    const nextStory = getNextStory();
    const heroImg = story.featuredImage;

    return (
        <div className="reader-shell" onClick={handleContentClick}>

            {/* ── Lightbox Overlay ── */}
            {lightboxOpen && heroImg && (
                <div
                    onClick={() => setLightboxOpen(false)}
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)',
                        zIndex: 99999, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'zoom-out',
                        animation: 'meseFadeIn .22s ease',
                    }}
                >
                    <img src={heroImg} alt={story.title} style={{ maxWidth: '92vw', maxHeight: '92vh', objectFit: 'contain', borderRadius: 10 }} />
                    <div style={{ position: 'absolute', top: 16, right: 20, color: 'rgba(255,255,255,.6)', fontSize: 28, cursor: 'pointer' }}>✕</div>
                </div>
            )}

            {/* Reader Header */}
            <div className={`reader-header ${headerVisible ? '' : 'hidden'}`}>
                <button className="reader-back-btn" onClick={(e) => { e.stopPropagation(); navigate('/'); }}>← Vissza</button>
                <div className="reader-title">{story.title}</div>
                <button className="icon-btn" onClick={(e) => { e.stopPropagation(); cycleTheme(); }} aria-label="Témaváltás">{themeIcon}</button>
            </div>

            {/* Content */}
            <div className="reader-content" ref={contentRef}>

                {/* Hero Image — double-click to open lightbox */}
                {heroImg && (
                    <div className="story-image-container fade-in" style={{ cursor: 'zoom-in' }}>
                        <div className="story-image-mock" style={{ padding: 0, overflow: 'hidden', background: 'transparent', border: 'none', position: 'relative' }}>
                            <img
                                src={heroImg}
                                alt={story.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onDoubleClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
                                title="Dupla kattintás a nagyításhoz"
                            />
                            <div style={{
                                position: 'absolute', bottom: 8, right: 10,
                                background: 'rgba(0,0,0,.48)', borderRadius: 20,
                                padding: '3px 10px', fontSize: 11, color: 'rgba(255,255,255,.8)',
                                backdropFilter: 'blur(4px)', pointerEvents: 'none',
                            }}>🔍</div>
                        </div>
                    </div>
                )}
                {!heroImg && story.heroImage && (
                    <div className="story-image-container fade-in">
                        <div className="story-image-mock">{story.heroImage}</div>
                    </div>
                )}

                {/* Story text */}
                <div dangerouslySetInnerHTML={{ __html: contentHtml }} />

                {/* End Block Container */}
                <div className="end-block">
                    <div className="end-marker">~ Vége ~</div>

                    {/* 1. Feedback UI (Tetszett a mese?) */}
                    <div className="rating-card">
                        <div className="rating-question">Tetszett a mese?</div>
                        <div className="rating-buttons">
                            <button className={`rate-btn ${currentRating === 'up' ? 'selected-up' : ''}`} onClick={(e) => { e.stopPropagation(); handleRate('up'); }} id="rate-up">👍</button>
                            <button className={`rate-btn ${currentRating === 'down' ? 'selected-down' : ''}`} onClick={(e) => { e.stopPropagation(); handleRate('down'); }} id="rate-down">👎</button>
                        </div>
                    </div>

                    {/* 2. Questions Accordion (Miről beszélgessünk?) */}
                    <div className="discussion-card">
                        <button className="discussion-toggle" onClick={(e) => { e.stopPropagation(); setDiscussionOpen(!discussionOpen); }} id="discussion-toggle">
                            <span>💬 Miről beszélgessünk?</span>
                            <span className={`discussion-arrow ${discussionOpen ? 'open' : ''}`}>▼</span>
                        </button>
                        <div className={`discussion-body ${discussionOpen ? 'open' : ''}`}>
                            {story.discussionQuestions && story.discussionQuestions.map((q, i) => (
                                <div key={i} className="discussion-question">
                                    <span className="discussion-question-emoji">{QUESTION_EMOJIS[i] || '💬'}</span>
                                    <span>„{q}"</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Share Section (Megosztás) */}
                    <div className="share-section" style={{ marginBottom: '20px' }}>
                        <button className="next-story-btn" onClick={handleShare}
                            style={{ background: 'var(--discussion-bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', boxShadow: 'none', width: '100%', justifyContent: 'center' }}>
                            📤 Megosztás
                        </button>
                    </div>

                    {/* 4. Alkotóműhely Accordion (Rajzolok egyet) - STYLED DARK & YELLOW */}
                    <div className="discussion-card" style={{ 
                        background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 100%)', 
                        border: '1.5px solid rgba(255,200,100,0.3)' 
                    }}>
                        <button className="discussion-toggle" 
                            onClick={(e) => { e.stopPropagation(); setWorkshopOpen(!workshopOpen); }} 
                            style={{ color: '#ffd700' }}
                        >
                            <span>🎨 Rajzolok egyet</span>
                            <span className={`discussion-arrow ${workshopOpen ? 'open' : ''}`} style={{ color: '#ffd700' }}>▼</span>
                        </button>
                        
                        <div className={`accordion-body ${workshopOpen ? 'open' : ''}`} style={{ textAlign: 'center' }}>
                            {!isDrawingMode ? (
                                <div style={{ padding: '10px 0 20px' }}>
                                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎨</div>
                                    <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                        Rajzold le, mi tetszett a legjobban a mesében, tölts fel egy fotót, és a <strong style={{color:'#ffd700'}}>Mesegép</strong> jövő héten életre kelti!
                                    </p>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <button className="mese-btn" onClick={(e) => { e.stopPropagation(); setIsDrawingMode(true); }}
                                            style={{ background: 'linear-gradient(135deg,#ffd700,#ffaa00)', color: '#1a1a2e', border: 'none', padding: '10px 20px', borderRadius: '50px', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255,200,0,0.3)' }}>
                                            ✏️ Rajzolok egyet
                                        </button>
                                        <button className="mese-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                            style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '50px', fontWeight: 600, cursor: 'pointer' }}>
                                            📸 Fotó feltöltése
                                        </button>
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                    
                                    {tempDrawing && (
                                        <div style={{ marginTop: '1.5rem', position: 'relative', display: 'inline-block' }}>
                                            <img src={tempDrawing} alt="Saját rajz" style={{ maxWidth: '100%', maxHeight: '150px', borderRadius: '12px', border: '2px solid #ffd700' }} />
                                            <div style={{ position: 'absolute', top: -8, right: -8, background: '#ffd700', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#1a1a2e' }}>✨</div>
                                        </div>
                                    )}
                                    {uploadedFile && (
                                        <p style={{ color: '#ffd700', fontSize: '0.8rem', marginTop: '1rem' }}>✅ <strong>{uploadedFile.name}</strong> — elmentve!</p>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '20px 0' }}>
                                    <DrawingCanvas onSave={handleSaveDrawing} onCancel={() => setIsDrawingMode(false)} />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Next story Button */}
                    <button className="next-story-btn" id="next-story-btn"
                        onClick={(e) => { e.stopPropagation(); navigate(`/read/${nextStory.id}`); window.scrollTo(0, 0); }}>
                        → Következő mese
                    </button>
                </div>

            </div>

            {/* Progress bar */}
            <div className="reader-progress">
                <div className="reader-progress-bar">
                    <div className="reader-progress-fill" style={{ width: `${scrollPercent}%` }} />
                </div>
                <div className="reader-progress-text">{scrollPercent}%</div>
            </div>

            <FeedbackModal 
                isOpen={isFeedbackModalOpen} 
                onClose={() => setIsFeedbackModalOpen(false)} 
                storyTitle={story.title}
                storyId={id}
            />

            <style>{`@keyframes meseFadeIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>

    );
}
