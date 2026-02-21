import { ArrowUpRight } from 'lucide-react';
import styles from '../styles/Home.module.css'; // Reusing Home styles for now or inline

// We'll use inline styles or existing utility classes since we don't have a separate CSS for this component yet.
// Or we can add styles to Home.module.css (Phase 19 didn't explicitly include StatCard styles).
// todo.md 20.6 says "Simple card with icon, number, label".
// We should probably add styles to Home.module.css if we want it to look good.
// For now, let's use a simple style object or reuse .card from other modules if globally available (not really).
// I'll add a section to Home.module.css for dashboard in next step if needed, or inline.

export default function StatCard({ label, value, icon: Icon, trend }) {
    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            transition: 'transform 0.2s',
            cursor: 'default'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
                {Icon && <Icon size={16} color="var(--accent)" />}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {value}
            </div>
            {trend && (
                <div style={{ fontSize: '12px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ArrowUpRight size={12} /> {trend}
                </div>
            )}
        </div>
    );
}
