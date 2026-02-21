import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import api from '../api/client.js'
import styles from '../styles/Auth.module.css'

function Signup() {
  const [form, setForm] = useState({ username: '', password: '', age: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { user, login, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in (wait for auth to finish loading first)
  if (!authLoading && user) return <Navigate to="/home" replace />

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/signup', {
        ...form,
        age: parseInt(form.age)
      })
      login(res.data.user, res.data.token)
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <h1>AI <span>Learn</span></h1>
          <p>Create your account to get started.</p>
        </div>
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.field}>
            <label htmlFor="signup-username">Username</label>
            <input
              id="signup-username"
              name="username"
              placeholder="Choose a username"
              value={form.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="signup-password">Password</label>
            <div className={styles.passwordField}>
              <input
                id="signup-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label htmlFor="signup-age">Age</label>
            <input
              id="signup-age"
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
          <button className={styles.btn} disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <div className={styles.footer}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  )
}

export default Signup