import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/ThemeToggle.module.css';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className={styles.wrapper}>
            <span className={styles.label}>{isDark ? 'Dark' : 'Light'}</span>
            <button
                className={`${styles.track} ${isDark ? styles.trackDark : styles.trackLight}`}
                onClick={toggleTheme}
                role="switch"
                aria-checked={isDark}
                aria-label="Toggle between dark and light mode"
            >
                <span className={`${styles.knob} ${isDark ? styles.knobRight : styles.knobLeft}`}>
                    {isDark
                        ? <Moon size={11} aria-hidden="true" />
                        : <Sun size={11} aria-hidden="true" />
                    }
                </span>
            </button>
        </div>
    );
}
