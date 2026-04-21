import React, { useState, useMemo, useRef } from 'react';

export default function CollectionScrubber({ stories = [], selectedCollection, onSelect }) {
  const [isActive, setIsActive] = useState(false);
  const [hoveredLetter, setHoveredLetter] = useState(null);
  const [popupPos, setPopupPos] = useState(0);

  const containerRef = useRef(null);

  // Parse collections and group by first letter
  const grouped = useMemo(() => {
    const colls = new Set();
    stories.forEach(s => {
      if (s.collection) colls.add(s.collection);
    });
    
    // Create map: { 'B': ['Benedek Elek'], 'G': ['Grimm'] }
    const grp = {};
    [...colls].sort().forEach(name => {
      const letter = name.charAt(0).toUpperCase();
      if (!grp[letter]) grp[letter] = [];
      grp[letter].push(name);
    });
    return grp;
  }, [stories]);

  const letters = Object.keys(grouped).sort();
  // Add a special character to allow clearing the selection (All Stories)
  if (letters.length > 0) {
      letters.unshift('*'); 
  }

  if (letters.length === 0) return null;

  const handlePointerMove = (e) => {
    if (!isActive && e.type !== 'pointerdown') return;
    
    // Handle both mouse and touch events natively
    // We use elementsFromPoint to find the letter element underneath the finger/cursor
    const clientY = e.clientY || (e.touches && e.touches.length > 0 && e.touches[0].clientY);
    const clientX = e.clientX || (e.touches && e.touches.length > 0 && e.touches[0].clientX);
    
    if (clientY === undefined || clientX === undefined) return;

    const els = document.elementsFromPoint(clientX, clientY);
    const letterEl = els.find(el => el.classList && el.classList.contains('scrubber-letter'));
    
    if (letterEl) {
       const letter = letterEl.getAttribute('data-letter');
       if (letter !== hoveredLetter) {
           setHoveredLetter(letter);
           // Calculate Y for popup to align exactly with the letter's center
           const rect = letterEl.getBoundingClientRect();
           setPopupPos(rect.top + rect.height / 2);
       }
    }
  };

  const selectCollection = (name) => {
     onSelect(name);
     setIsActive(false);
     setHoveredLetter(null);
  };

  const handlePointerDown = (e) => {
      setIsActive(true);
      // Force element capture to track outside movements smoothly until release
      if (e.target && e.target.setPointerCapture) {
          try { e.target.setPointerCapture(e.pointerId); } catch(err){}
      }
      handlePointerMove(e);
  };

  const handlePointerUp = (e) => {
      setIsActive(false);
      setHoveredLetter(null);
      if (e.target && e.target.releasePointerCapture) {
          try { e.target.releasePointerCapture(e.pointerId); } catch(err){}
      }
  };

  return (
    <>
      <div 
        ref={containerRef}
        className={`collection-scrubber-container ${isActive ? 'active' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        title="Húzd végig az ujjad a gyűjteményekhez"
      >
        {letters.map(l => (
           <div key={l} className="scrubber-letter" data-letter={l}>
              {l === '*' ? '●' : l}
           </div>
        ))}
      </div>

      {hoveredLetter && isActive && (
        <div className="scrubber-popup" style={{ top: `${popupPos}px` }}>
           <div className="popup-pointer"></div>
           <div className="popup-content">
              <div className="popup-letter">{hoveredLetter === '*' ? 'Összes' : hoveredLetter}</div>
              <div className="popup-items">
                 {hoveredLetter === '*' ? (
                    <button 
                      className={!selectedCollection ? 'active' : ''}
                      onPointerUp={(e) => { e.stopPropagation(); selectCollection(null); }}
                    >
                      Minden Mese
                    </button>
                 ) : (
                    grouped[hoveredLetter].map(name => (
                      <button 
                        key={name} 
                        className={selectedCollection === name ? 'active' : ''}
                        onPointerUp={(e) => { e.stopPropagation(); selectCollection(name); }}
                      >
                        {name}
                      </button>
                    ))
                 )}
              </div>
           </div>
        </div>
      )}
    </>
  );
}
