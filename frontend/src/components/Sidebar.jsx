import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Home, ListChecks, Clock, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import styles from '../styles/Sidebar.module.css';

function Sidebar({ isOpen, onNavClick }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
            <div className={styles.brand}>
                <span className={styles.brandName}>
                    AI <span className={styles.brandAccent}>Learn</span>
                </span>
            </div>

            <nav className={styles.nav}>
                <NavLink
                    data-tooltip="Home"
                    to="/home"
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                    onClick={onNavClick}
                >
                    <Home size={18} className={styles.icon} aria-hidden="true" /> Home
                </NavLink>
                <NavLink
                    data-tooltip="MCQ Generator"
                    to="/mcq"
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                    onClick={onNavClick}
                >
                    <ListChecks size={18} className={styles.icon} aria-hidden="true" /> MCQ Generator
                </NavLink>
                <NavLink
                    data-tooltip="History"
                    to="/history"
                    className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
                    onClick={onNavClick}
                >
                    <Clock size={18} className={styles.icon} aria-hidden="true" /> History
                </NavLink>
            </nav>

            <div className={styles.bottomSection}>
                <ThemeToggle />

                <div className={styles.userSection}>
                    <div className={styles.avatar} aria-hidden="true">
                        {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                    </div>
                    <span className={styles.username}>{user?.username || 'User'}</span>
                    <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Log out">
                        <LogOut size={15} aria-hidden="true" />
                    </button>
                </div>
            </div>
        </aside>
    );
}

export default Sidebar;
