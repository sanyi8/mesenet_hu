import { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function DrawingCanvas({ onSave, onCancel }) {
    const { t } = useLanguage();
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffd700');
    const [brushSize, setBrushSize] = useState(5);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Handle High DPI displays
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const context = canvas.getContext('2d');
        context.scale(dpr, dpr);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        contextRef.current = context;

        // Fill background
        context.fillStyle = '#1a1a2e';
        context.fillRect(0, 0, rect.width, rect.height);
        
        // Save initial state
        setHistory([canvas.toDataURL()]);
    }, []); // One-time setup

    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = brushSize;
        }
    }, [color, brushSize]); // Sync styles


    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        const { x, y } = getCoordinates(e);
        contextRef.current.beginPath();
        contextRef.current.moveTo(x, y);
        setIsDrawing(true);
        e.preventDefault();
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        contextRef.current.lineTo(x, y);
        contextRef.current.stroke();
        e.preventDefault();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            contextRef.current.closePath();
            setIsDrawing(false);
            setHistory(prev => [...prev, canvasRef.current.toDataURL()]);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        const context = contextRef.current;
        context.fillStyle = '#1a1a2e';
        context.fillRect(0, 0, canvas.width, canvas.height);
        setHistory([canvas.toDataURL()]);
    };

    const undo = () => {
        if (history.length <= 1) return;
        const newHistory = history.slice(0, -1);
        const lastState = newHistory[newHistory.length - 1];
        
        const img = new Image();
        img.src = lastState;
        img.onload = () => {
            const canvas = canvasRef.current;
            if (canvas && contextRef.current) {
                contextRef.current.drawImage(img, 0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
                setHistory(newHistory);
            }
        };
    };

    const handleSave = () => {
        const dataUrl = canvasRef.current.toDataURL('image/png');
        onSave(dataUrl);
    };

    const colors = ['#ffd700', '#ff4d4d', '#4dff4d', '#4da6ff', '#ffffff', '#ff80ed'];

    return (
        <div className="drawing-container" style={{
            background: '#16213e',
            padding: '15px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{
                    width: '100%',
                    aspectRatio: '1/1',
                    background: '#1a1a2e',
                    borderRadius: '12px',
                    cursor: 'crosshair',
                    touchAction: 'none',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}
            />

            <div className="drawing-controls" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {colors.map(c => (
                            <button
                                key={c}
                                onClick={() => setColor(c)}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    background: c,
                                    border: color === c ? '3px solid white' : '1px solid rgba(0,0,0,0.2)',
                                    padding: 0,
                                    cursor: 'pointer',
                                    transition: 'transform 0.1s'
                                }}
                            />
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={undo} style={controlBtnStyle} title={t('undo')}>↩️</button>
                        <button onClick={clearCanvas} style={controlBtnStyle} title={t('clear')}>🗑️</button>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{t('brushSize')}</span>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        style={{ flex: 1, accentColor: '#ffd700' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <button onClick={onCancel} style={{ ...actionBtnStyle, background: 'rgba(255,255,255,0.05)', color: 'white' }}>{t('cancel')}</button>
                    <button onClick={handleSave} style={{ ...actionBtnStyle, background: 'linear-gradient(135deg,#ffd700,#ffaa00)', color: '#1a1a2e' }}>{t('done')}</button>
                </div>
            </div>
        </div>
    );
}

const controlBtnStyle = {
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '18px'
};

const actionBtnStyle = {
    flex: 1,
    padding: '12px',
    border: 'none',
    borderRadius: '30px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'transform 0.1s, opacity 0.1s'
};
