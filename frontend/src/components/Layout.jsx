import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar.jsx'
import styles from '../styles/Layout.module.css'

function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const location = useLocation()

    // Close sidebar on navigation (mobile)
    const handleNavClick = () => setSidebarOpen(false)

    return (
        <div className={styles.layout}>
            {/* Mobile hamburger */}
            <button
                className={styles.hamburger}
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle menu"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Overlay on mobile */}
            <div
                className={`${styles.overlay} ${sidebarOpen ? styles.overlayVisible : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            <Sidebar isOpen={sidebarOpen} onNavClick={handleNavClick} />
            <main className={`${styles.content} animate-fade-in`} key={location.pathname}>
                <Outlet />
            </main>
        </div>
    )
}

export default Layout
