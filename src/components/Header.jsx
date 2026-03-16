import { useTheme } from '../context/ThemeContext';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
    const { cycleTheme, themeIcon } = useTheme();
    const { lang, toggleLanguage } = useLanguage();

    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button className="icon-btn" onClick={cycleTheme} aria-label="Témaváltás" id="theme-toggle">
                    {themeIcon}
                </button>
                <button className="icon-btn" onClick={toggleLanguage} style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {lang.toUpperCase()}
                </button>
                <NavLink to="/" className="header-logo">
                    mese<span>net.hu</span>
                </NavLink>
            </div>
            <div className="header-actions">
                <NavLink to="/profile" className="icon-btn" aria-label="Profil" id="profile-btn">
                    👤
                </NavLink>
            </div>
        </header>
    );
}
