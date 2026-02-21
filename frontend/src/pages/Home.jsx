import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowUp, Leaf, ListChecks, BookOpen, Code, TrendingUp, Award, Clock, SlidersHorizontal, X, Home as HomeIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../api/client';
import styles from '../styles/Home.module.css';
import { useStats } from '../hooks/useStats';
import { useRecentHistory } from '../hooks/useRecentHistory';
import StatCard from '../components/StatCard';

const SUGGESTION_CHIPS = [
  {
    text: 'Explain photosynthesis in simple terms',
    icon: Leaf,
    type: 'explain'
  },
  {
    text: 'Generate 10 MCQs on Newton\'s laws of motion',
    icon: ListChecks,
    type: 'mcq'
  },
  {
    text: 'Summarise the causes of World War I',
    icon: BookOpen,
    type: 'explain'
  },
  {
    text: 'Quiz me on Python basics with 5 questions',
    icon: Code,
    type: 'mcq'
  },
];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Hook to access router state if needed

  // Dashboard Data
  const { stats, loading: statsLoading } = useStats();
  const { history: recentHistory, loading: historyLoading } = useRecentHistory();

  // State
  const [messages, setMessages] = useState([]); // Array of { role, content, isError? }
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Filters State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [language, setLanguage] = useState('English');
  const [length, setLength] = useState('medium');
  const [age, setAge] = useState(user?.age || 18);

  // Refs
  const textareaRef = useRef(null);
  const chatBottomRef = useRef(null);
  const chatAreaRef = useRef(null); // For future scroll management if needed (from ref in todo.md)

  // Time-based greeting
  const hour = new Date().getHours();
  let timeOfDay = 'evening';
  if (hour < 12) timeOfDay = 'morning';
  else if (hour < 17) timeOfDay = 'afternoon';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (hasStartedChat) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, hasStartedChat]);

  // Handle Input Change & Auto-Resize
  const handleInput = (e) => {
    setInputValue(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  // Handle Send
  const handleSend = async () => {
    const userText = inputValue.trim();
    if (!userText || isLoading) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: userText }];
    setMessages(newMessages);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Close filter menu when sending
    setIsFilterOpen(false);

    // Trigger hero -> chat transition
    if (!hasStartedChat) {
      setHasStartedChat(true);
    }

    setIsLoading(true);

    try {
      // Default to explain endpoint
      const response = await api.post('/explain', {
        topic: userText,
        language: language,
        length: length,
        age: age,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.explanation }]);
    } catch (err) {
      const errMsg = err.response?.status === 429
        ? 'The AI is busy right now. Please wait a moment and try again.'
        : 'Something went wrong. Please check your connection and try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg, isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter Key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isLoading) {
        handleSend();
      }
    }
  };

  // Handle Chip Click
  const handleChipClick = (chip) => {
    if (chip.type === 'mcq') {
      navigate('/mcq', { state: { prefillTopic: chip.text } });
    } else {
      setInputValue(chip.text);
      // We need to focus AND trigger the resize calculation potentially, 
      // but React state update will trigger render. 
      // We can just focus. The resize might happen on next render or input event.
      // Let's manually set height if we want instant resize, but focusing is enough for user to hit enter.
      setTimeout(() => {
        textareaRef.current?.focus();
        // Trigger manual resize
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.style.height = 'auto';
          textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
        }
      }, 0);
    }
  };

  // Reset Chat State
  const handleNewTopic = () => {
    setHasStartedChat(false);
    setMessages([]);
    setInputValue('');
  };

  // Auto-scroll to bottom of chat when messages update or loading starts
  useEffect(() => {
    if (hasStartedChat && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, isLoading, hasStartedChat]);

  return (
    <div className={styles.page}>

      {/* Floating Home Button when chatting */}
      {hasStartedChat && (
        <div className={styles.homeBtnWrapper}>
          <button className={styles.homeBtn} onClick={handleNewTopic}>
            <HomeIcon size={16} aria-hidden="true" />
            <span>Home</span>
          </button>
        </div>
      )}

      {/* Hero section — fades out when chat starts */}
      <div className={`${styles.heroSection} ${hasStartedChat ? styles.heroHidden : ''}`}>
        <div className={styles.orbWrapper}>
          <div className={styles.orb} aria-hidden="true" />
          <div className={styles.orbShadow} aria-hidden="true" />
        </div>
        <h1 className={styles.greetingTitle}>
          Good {timeOfDay}, {user.username}
        </h1>
        <h2 className={styles.greetingSubtitle}>
          What's on <span className={styles.greetingAccent}>your mind?</span>
        </h2>
      </div>

      {/* Chat conversation area — appears when chat starts */}
      {hasStartedChat && (
        <div className={styles.chatArea} ref={chatAreaRef}>
          {messages.map((msg, index) => (
            <div key={index} className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}>
              {msg.role === 'assistant' ? (
                <div className={styles.assistantContent}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className={styles.userContent}>{msg.content}</p>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className={styles.assistantMessage}>
              <div className={styles.typingIndicator}>
                <span /><span /><span />
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>
      )}

      {/* Prompt box container */}
      <div className={`${styles.promptContainer} ${hasStartedChat ? styles.promptContainerChat : ''}`}>
        {/* The prompt box itself */}
        <div className={styles.promptBox}>
          <textarea
            ref={textareaRef}
            className={styles.promptTextarea}
            placeholder={hasStartedChat ? 'Ask a follow-up question...' : 'Ask me anything to learn...'}
            value={inputValue}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className={styles.promptActions}>
            {/* Only show filters if chat has NOT started */}
            {!hasStartedChat && (
              <div className={styles.promptActionsLeft}>
                <div className={styles.filterWrapper}>
                  <button
                    type="button"
                    className={`${styles.filterBtn} ${isFilterOpen ? styles.filterBtnActive : ''}`}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    aria-label="Learning Filters"
                  >
                    <SlidersHorizontal size={16} aria-hidden="true" />
                    <span>Filters</span>
                  </button>

                  {isFilterOpen && (
                    <div className={styles.filterMenu}>
                      <div className={styles.filterHeader}>
                        <span className={styles.filterTitle}>Generation Settings</span>
                        <button className={styles.closeFilter} onClick={() => setIsFilterOpen(false)} aria-label="Close filters">
                          <X size={14} aria-hidden="true" />
                        </button>
                      </div>

                      <div className={styles.filterRow}>
                        <label htmlFor="filter-lang">Language</label>
                        <select id="filter-lang" value={language} onChange={(e) => setLanguage(e.target.value)}>
                          <option value="English">English</option>
                          <option value="Spanish">Spanish</option>
                          <option value="French">French</option>
                          <option value="German">German</option>
                          <option value="Hindi">Hindi</option>
                        </select>
                      </div>

                      <div className={styles.filterRow}>
                        <label htmlFor="filter-length">Length</label>
                        <select id="filter-length" value={length} onChange={(e) => setLength(e.target.value)}>
                          <option value="short">Short</option>
                          <option value="medium">Medium</option>
                          <option value="long">Long</option>
                        </select>
                      </div>

                      <div className={styles.filterRow}>
                        <label htmlFor="filter-age">Target Age</label>
                        <input
                          id="filter-age"
                          type="number"
                          min="1"
                          max="100"
                          value={age}
                          onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <ArrowUp size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Show chips only when no chat has started — now below the prompt box */}
        <div className={`${styles.chipsContainer} ${hasStartedChat ? styles.chipsHidden : ''}`}>
          <p className={styles.chipsLabel}>TRY AN EXAMPLE</p>
          <div className={styles.chips}>
            {SUGGESTION_CHIPS.map((chip) => (
              <button key={chip.text} className={styles.chip} onClick={() => handleChipClick(chip)}>
                <span className={styles.chipText}>{chip.text}</span>
                <chip.icon size={18} className={styles.chipIcon} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Section — Only shown when NOT chatting */}
      <div className={`${styles.dashboard} ${hasStartedChat ? styles.dashboardHidden : ''}`}>

        <div className={styles.dashboardSection}>
          <p className={styles.sectionTitle}>Your Progress</p>
          <div className={styles.statsGrid}>
            <StatCard label="Topics Learned" value={stats.topics_learned} icon={BookOpen} />
            <StatCard label="MCQs Solved" value={stats.questions_solved} icon={ListChecks} />
            <StatCard label="Accuracy" value={stats.accuracy ? `${stats.accuracy}%` : '0%'} icon={Award} />
            <StatCard label="Time Spent" value={stats.time_spent} icon={Clock} />
          </div>
        </div>

        <div className={styles.dashboardSection}>
          <p className={styles.sectionTitle}>Recent Activity</p>
          <div className={styles.recentList}>
            {!historyLoading && recentHistory.length > 0 ? (
              recentHistory.map((item) => (
                <Link key={item.id} to="/history" className={styles.recentItem}>
                  <div className={styles.recentIconWrapper}>
                    {item.type === 'mcq' ? <ListChecks size={16} aria-hidden="true" /> : <Leaf size={16} aria-hidden="true" />}
                  </div>
                  <div className={styles.recentContent}>
                    <div className={styles.recentTopic}>{item.topic}</div>
                    <div className={styles.recentDate}>
                      {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {historyLoading ? 'Loading history...' : 'No recent activity.'}
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}