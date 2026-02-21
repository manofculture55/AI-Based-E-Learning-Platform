import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Check, X, Loader2, Save } from 'lucide-react';
import api from '../api/client.js';
import styles from '../styles/McqGenerator.module.css';

/**
 * Parse raw MCQ text from Gemini AI into structured question objects.
 */
function parseMcq(raw) {
  const questions = [];
  const blocks = raw.split(/\n(?=Q\d+\.)/).filter(Boolean);

  for (const block of blocks) {
    const lines = block.trim().split('\n').filter(Boolean);
    if (lines.length < 2) continue;

    const question = lines[0].replace(/^Q\d+\.\s*/, '').trim();
    const options = [];
    let answer = '';

    for (const line of lines.slice(1)) {
      if (/^[a-d]\)/i.test(line)) {
        options.push(line.trim());
      } else if (/^Answer:/i.test(line)) {
        answer = line.replace(/^Answer:\s*/i, '').trim().toLowerCase();
      }
    }

    if (question && options.length > 0) {
      questions.push({ question, options, answer });
    }
  }
  return questions;
}

function McqGenerator() {
  const navigate = useNavigate();
  const location = useLocation();

  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);

  // Track indexed states instead of letting Child Components hold them
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [revealedAnswers, setRevealedAnswers] = useState({});

  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [rawResult, setRawResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Read Pre-Fill State from Home Nav
  useEffect(() => {
    if (location.state?.prefillTopic) {
      const raw = location.state.prefillTopic;
      const cleaned = raw
        .replace(/^(generate|quiz me on|create|make)\s+(\d+\s+)?(mcqs?|questions?|quiz)\s+(on|about)?\s*/i, '')
        .replace(/\s+with\s+\d+\s+questions?$/i, '')
        .trim();
      setTopic(cleaned || raw);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  const handleSelect = (index, option) => {
    if (revealedAnswers[index]) return;
    setSelectedAnswers(prev => ({ ...prev, [index]: option }));
  };

  const handleReveal = (index) => {
    if (!selectedAnswers[index]) return;

    setRevealedAnswers(prev => ({ ...prev, [index]: true }));
    setAnsweredCount(prev => prev + 1);

    // Check answer correctness properly (matching format "a) text" -> "a")
    const selectedLetter = selectedAnswers[index][0].toLowerCase();
    if (selectedLetter === questions[index].answer) {
      setScore(prev => prev + 1);
    }
  };

  const handleSaveScore = async () => {
    if (saving || saved) return;
    try {
      setSaving(true);
      await api.post('/mcq/score', {
        topic: topic,
        score: score,
        total: questions.length
      });
      setSaved(true);
    } catch (err) {
      console.error('Failed to save score', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError("Please enter a topic first.");
      return;
    }
    setLoading(true);
    setQuestions([]);
    setScore(0);
    setAnsweredCount(0);
    setSaved(false);
    setRawResult('');
    setError('');
    setSelectedAnswers({});
    setRevealedAnswers({});

    try {
      const res = await api.post('/mcq', {
        topic: topic.trim(),
        count: parseInt(count)
      });
      const parsed = parseMcq(res.data.mcq);
      if (parsed.length > 0) {
        setQuestions(parsed);
      } else {
        setRawResult(res.data.mcq);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('System is busy, please try again in a moment.');
      } else if (!err.response) {
        setError('Network error — check your connection.');
      } else {
        setError(err.response?.data?.error || 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.heading}>
          Generate <span>MCQs</span>
        </h2>
        <p className={styles.subheading}>
          Test your knowledge with AI-generated questions on any topic.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="mcq-topic">Topic</label>
              <input
                id="mcq-topic"
                className={styles.input}
                name="topic"
                placeholder="e.g. Newton's laws, Python programming..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="mcq-count">Number of Questions</label>
              <select id="mcq-count" className={styles.select} name="count" value={count} onChange={(e) => setCount(e.target.value)}>
                {[5, 10, 15, 20].map(n => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.submitBtn} disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" aria-hidden="true" />
                Generating questions...
              </>
            ) : 'Generate MCQs'}
          </button>
        </form>

        {questions.length > 0 && !loading && (
          <div className={styles.results}>
            <div className={`${styles.resultsHeader} animate-slide-up`}>
              <h3>Questions on "{topic}"</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className={styles.badge}>{score}/{questions.length} Correct</span>
                {answeredCount === questions.length && !saved && (
                  <button
                    onClick={handleSaveScore}
                    className={styles.submitBtn}
                    disabled={saving}
                    style={{ padding: '6px 16px', height: '36px', fontSize: '0.85rem', width: 'auto' }}>
                    {saving ? (
                      <Loader2 size={14} className="spinner" style={{ marginRight: '6px' }} />
                    ) : (
                      <Save size={14} style={{ marginRight: '6px' }} />
                    )}
                    {saving ? 'Saving...' : 'Save Results'}
                  </button>
                )}
                {saved && <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600 }}>Saved!</span>}
              </div>
            </div>

            {questions.map((question, index) => (
              <div
                key={index}
                className={styles.questionCard}
                style={{ '--delay': `${index * 60}ms` }}
              >
                <div className={styles.questionHeader}>
                  <span className={styles.questionNumber}>Q{index + 1}</span>
                  <p className={styles.questionText}>{question.question}</p>
                </div>

                <div className={styles.options}>
                  {question.options.map((option) => {
                    const optionLetter = option[0].toLowerCase();
                    return (
                      <button
                        key={option}
                        className={`
                          ${styles.option}
                          ${selectedAnswers[index] === option ? styles.optionSelected : ''}
                          ${revealedAnswers[index] && optionLetter === question.answer ? styles.optionCorrect : ''}
                          ${revealedAnswers[index] && selectedAnswers[index] === option && optionLetter !== question.answer ? styles.optionWrong : ''}
                        `}
                        onClick={() => !revealedAnswers[index] && handleSelect(index, option)}
                        disabled={!!revealedAnswers[index]}
                      >
                        {revealedAnswers[index] && optionLetter === question.answer && (
                          <Check size={14} aria-hidden="true" />
                        )}
                        {revealedAnswers[index] && selectedAnswers[index] === option && optionLetter !== question.answer && (
                          <X size={14} aria-hidden="true" />
                        )}
                        {option}
                      </button>
                    )
                  })}
                </div>

                {/* Check Answer button — only visible after selection, before reveal */}
                <div className={`${styles.checkBtnWrapper} ${selectedAnswers[index] && !revealedAnswers[index] ? styles.checkBtnVisible : ''}`}>
                  <button className={styles.checkBtn} onClick={() => handleReveal(index)}>
                    Check Answer
                  </button>
                </div>

                {/* Answer reveal */}
                {revealedAnswers[index] && (
                  <div className={styles.answerReveal}>
                    {selectedAnswers[index][0].toLowerCase() === question.answer
                      ? <span className={styles.correctText}>Correct! Well done.</span>
                      : <span className={styles.wrongText}>The correct answer is: <strong>{question.answer.toUpperCase()}</strong></span>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {rawResult && !loading && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px',
            whiteSpace: 'pre-wrap',
            color: 'var(--text-primary)',
            lineHeight: '1.8'
          }}>
            {rawResult}
          </div>
        )}
      </div>
    </div>
  );
}

export default McqGenerator;