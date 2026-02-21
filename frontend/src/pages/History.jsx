import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Loader2, BookOpen, Lightbulb, ListChecks, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import api from '../api/client.js'
import styles from '../styles/History.module.css'

function History() {
    const [entries, setEntries] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedId, setExpandedId] = useState(null)

    useEffect(() => {
        fetchHistory()
    }, [])

    const fetchHistory = async () => {
        try {
            const res = await api.get('/history')
            setEntries(res.data.history)
        } catch (err) {
            setError('Failed to load history.')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await api.delete(`/history/${id}`)
            setEntries(entries.filter(e => e.id !== id))
        } catch (err) {
            setError('Failed to delete entry.')
        }
    }

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id)
    }

    const formatDate = (iso) => {
        const d = new Date(iso)
        return d.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.loading}>
                    <Loader2 className="spinner" size={48} color="var(--accent)" />
                    <p>Loading history...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <h2 className={styles.heading}>
                    Your <span>History</span>
                </h2>
                <p className={styles.subheading}>
                    Review your past explanations and quiz sessions.
                </p>

                {error && <div className={styles.error}>{error}</div>}

                {entries.length === 0 && !error && (
                    <div className={styles.empty}>
                        <BookOpen size={48} color="var(--text-disabled)" style={{ marginBottom: '16px' }} />
                        <p>No history yet. Start exploring topics or generating quizzes!</p>
                    </div>
                )}

                <div className={styles.list}>
                    {entries.map(entry => (
                        <div key={entry.id} className={styles.card}>
                            <div className={styles.cardHeader} onClick={() => toggleExpand(entry.id)}>
                                <div className={styles.cardMeta}>
                                    <span className={styles.typeBadge} data-type={entry.type}>
                                        {entry.type === 'explain' ? <><Lightbulb size={14} /> Explanation</> : <><ListChecks size={14} /> MCQ Quiz</>}
                                    </span>
                                    <span className={styles.date}>{formatDate(entry.created_at)}</span>
                                </div>
                                <h3 className={styles.cardTopic}>{entry.topic}</h3>
                                <span className={styles.expandIcon}>
                                    {expandedId === entry.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </span>
                            </div>

                            {expandedId === entry.id && (
                                <div className={styles.cardBody}>
                                    <div className={styles.responseText}>
                                        {entry.type === 'explain' ? (
                                            <ReactMarkdown>{entry.response}</ReactMarkdown>
                                        ) : (
                                            <pre>{entry.response}</pre>
                                        )}
                                    </div>
                                    <button
                                        className={styles.deleteBtn}
                                        onClick={(e) => { e.stopPropagation(); handleDelete(entry.id) }}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default History
