import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useReading } from '../context/ReadingContext';
import { useStories } from '../context/StoryContext';
import DrawingCanvas from '../components/DrawingCanvas';

const QUESTION_EMOJIS = ['🫶', '🌱', '💡'];

export default function ReaderPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { cycleTheme, themeIcon } = useTheme();
    const { updateProgress, markAsRead, rateStory, ratings, lastRead } = useReading();
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
    const [tempDrawing, setTempDrawing] = useState(null);

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

    const handleContentClick = () => {
        setHeaderVisible(true);
        clearTimeout(hideTimeout.current);
        hideTimeout.current = setTimeout(() => { if (window.scrollY > 100) setHeaderVisible(false); }, 3000);
    };

    const handleRate = (rating) => {
        setCurrentRating(rating);
        rateStory(parseInt(id), rating);
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
        setUploadedFile({ name: 'Saját rajz.png' }); // Mock file object
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
                            }}>🔍 dupla kattintás</div>
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

                {/* ── Alkotóműhely — Creative Workshop ── */}
                <div id="alkotomuhely" style={{
                    margin: '2.5em 0 1em', padding: '2em 1.5em',
                    background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
                    borderRadius: 20, textAlign: 'center',
                    border: '2px solid rgba(255,200,100,.25)',
                    boxShadow: '0 4px 24px rgba(0,0,0,.4)',
                    overflow: 'hidden'
                }}>
                    {!isDrawingMode ? (
                        <>
                            <div style={{ fontSize: '2.8em', marginBottom: '.2em' }}>🎨</div>
                            <h3 style={{ color: '#ffd700', fontSize: '1.3em', margin: '0 0 .5em', letterSpacing: .5 }}>
                                Készítsd el a saját illusztrációdat!
                            </h3>
                            <p style={{ color: 'rgba(255,255,255,.8)', fontSize: '.95em', margin: '0 0 1.4em', lineHeight: 1.65, maxWidth: 440, display: 'inline-block' }}>
                                Rajzold le, mi tetszett a legjobban a mesében, vagy tölts fel egy fotót, és a{' '}
                                <strong style={{ color: '#ffd700' }}>Mesegép</strong> jövő héten életre kelti!
                            </p>
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    className="mese-btn"
                                    onClick={(e) => { e.stopPropagation(); setIsDrawingMode(true); }}
                                    style={{
                                        background: 'linear-gradient(135deg,#ffd700,#ffaa00)',
                                        color: '#1a1a2e', border: 'none',
                                        padding: '.75em 1.8em', borderRadius: 50,
                                        fontSize: '1em', fontWeight: 700, cursor: 'pointer',
                                        letterSpacing: .5, boxShadow: '0 4px 16px rgba(255,200,0,.35)',
                                        transition: 'transform .15s, box-shadow .15s',
                                    }}
                                >
                                    ✏️ Rajzolok egyet
                                </button>
                                
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    id="mese-drawing-file-input"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                                <button
                                    className="mese-btn"
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    style={{
                                        background: 'rgba(255,255,255,0.08)',
                                        color: 'white', border: '1px solid rgba(255,255,255,0.2)',
                                        padding: '.75em 1.8em', borderRadius: 50,
                                        fontSize: '1em', fontWeight: 600, cursor: 'pointer',
                                        backdropFilter: 'blur(5px)'
                                    }}
                                >
                                    📸 Fotó feltöltése
                                </button>
                            </div>

                            {tempDrawing && (
                                <div style={{ marginTop: '1.5em', position: 'relative', display: 'inline-block' }}>
                                    <img src={tempDrawing} alt="Saját rajz" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '12px', border: '2px solid #ffd700' }} />
                                    <div style={{ position: 'absolute', top: -10, right: -10, background: '#ffd700', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1a1a2e' }}>✨</div>
                                </div>
                            )}

                            {uploadedFile && (
                                <p style={{ color: '#ffd700', fontSize: '.85em', marginTop: '1.2em' }}>
                                    ✅ <strong>{uploadedFile.name}</strong> — elmentve! A Mesegép hamarosan dolgozni kezd rajta. 🪄
                                </p>
                            )}
                            <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '.72em', marginTop: '1em' }}>Támogatott: szabadkézi rajz, PNG, JPG</p>
                        </>
                    ) : (
                        <div className="fade-in">
                            <h3 style={{ color: '#ffd700', fontSize: '1.1em', margin: '0 0 1em' }}>Mesenet Rajztábla</h3>
                            <DrawingCanvas 
                                onSave={handleSaveDrawing} 
                                onCancel={() => setIsDrawingMode(false)} 
                            />
                        </div>
                    )}
                </div>

                {/* End Block */}
                <div className="end-block">
                    <div className="end-marker">~ Vége ~</div>

                    {/* Rating */}
                    <div className="rating-card">
                        <div className="rating-question">Tetszett a mese?</div>
                        <div className="rating-buttons">
                            <button className={`rate-btn ${currentRating === 'up' ? 'selected-up' : ''}`} onClick={(e) => { e.stopPropagation(); handleRate('up'); }} id="rate-up">👍</button>
                            <button className={`rate-btn ${currentRating === 'down' ? 'selected-down' : ''}`} onClick={(e) => { e.stopPropagation(); handleRate('down'); }} id="rate-down">👎</button>
                        </div>
                    </div>

                    {/* Share */}
                    <div className="share-section" style={{ marginBottom: '20px' }}>
                        <button className="next-story-btn" onClick={handleShare}
                            style={{ background: 'var(--discussion-bg)', color: 'var(--text-primary)', border: '1.5px solid var(--border)', boxShadow: 'none', width: '100%', justifyContent: 'center' }}>
                            📤 Megosztás
                        </button>
                    </div>

                    {/* Discussion */}
                    <div className="discussion-card">
                        <button className="discussion-toggle" onClick={(e) => { e.stopPropagation(); setDiscussionOpen(!discussionOpen); }} id="discussion-toggle">
                            <span>💬 Miről beszélgessünk?</span>
                            <span className={`discussion-arrow ${discussionOpen ? 'open' : ''}`}>▼</span>
                        </button>
                        <div className={`discussion-body ${discussionOpen ? 'open' : ''}`}>
                            {story.discussionQuestions.map((q, i) => (
                                <div key={i} className="discussion-question">
                                    <span className="discussion-question-emoji">{QUESTION_EMOJIS[i] || '💬'}</span>
                                    <span>„{q}"</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Next story */}
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

            <style>{`@keyframes meseFadeIn{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>
        </div>
    );
}
