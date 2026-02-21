import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { CheckCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import styles from '../styles/Explainer.module.css'

function Explainer() {
  const { user } = useAuth()
  const location = useLocation()

  const [form, setForm] = useState({
    topic: '',
    language: 'English',
    size: 'Medium',
    age: user?.age || ''
  })
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill topic if passed from Home
  useEffect(() => {
    if (location.state?.initialTopic) {
      setForm(prev => ({ ...prev, topic: location.state.initialTopic }))
      // Optional: auto-submit if desired, but let's let user confirm settings first
    }
  }, [location.state])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResult('')
    setError('')
    try {
      const res = await api.post('/explain', {
        ...form,
        age: parseInt(form.age)
      })
      setResult(res.data.explanation)
    } catch (err) {
      if (err.response?.status === 429) {
        setError('System is busy, please try again in a moment.')
      } else if (!err.response) {
        setError('Network error — check your connection.')
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.heading}>
          Explain any <span>topic</span>
        </h2>
        <p className={styles.subheading}>
          Get a clear, creative explanation tailored to your level.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label htmlFor="exp-topic">Topic</label>
            <input
              id="exp-topic"
              name="topic"
              placeholder="e.g. Photosynthesis, Black holes, World War 2..."
              value={form.topic}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="exp-language">Language</label>
              <select id="exp-language" name="language" value={form.language} onChange={handleChange}>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Spanish">Spanish</option>
                <option value="Marathi">Marathi</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
                <option value="Arabic">Arabic</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="exp-size">Length</label>
              <select id="exp-size" name="size" value={form.size} onChange={handleChange}>
                <option value="Short">Short</option>
                <option value="Medium">Medium</option>
                <option value="Long">Long</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="exp-age">Age</label>
              <input
                id="exp-age"
                type="number"
                name="age"
                placeholder="Your age"
                value={form.age}
                onChange={handleChange}
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? 'Generating explanation...' : 'Explain this topic'}
          </button>
        </form>

        {loading && (
          <div className={styles.loading}>
            <Loader2 className="spinner" size={20} color="var(--accent)" aria-hidden="true" />
            <p>AI is thinking...</p>
          </div>
        )}

        {result && !loading && (
          <div className={`${styles.result} animate-slide-up`}>
            <div className={styles.resultHeader}>
              <CheckCircle size={18} color="var(--success)" aria-hidden="true" />
              <h3>Explanation for "{form.topic}"</h3>
            </div>
            <div className={styles.resultText}><ReactMarkdown>{result}</ReactMarkdown></div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Explainer