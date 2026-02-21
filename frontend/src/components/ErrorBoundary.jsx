import { Component } from 'react'

class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    background: 'var(--color-bg)',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'var(--color-bg-card)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: '48px 40px',
                        textAlign: 'center',
                        maxWidth: '420px',
                        width: '100%',
                        boxShadow: 'var(--shadow-md)'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                        <h2 style={{
                            color: 'var(--color-text)',
                            fontSize: '1.4rem',
                            fontWeight: 700,
                            marginBottom: '10px'
                        }}>
                            Something went wrong
                        </h2>
                        <p style={{
                            color: 'var(--color-text-muted)',
                            fontSize: '0.95rem',
                            marginBottom: '24px',
                            lineHeight: 1.6
                        }}>
                            An unexpected error occurred. Please try again.
                        </p>
                        <button
                            onClick={this.handleRetry}
                            style={{
                                background: 'var(--color-primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '12px 28px',
                                fontSize: '1rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'background 0.2s ease, transform 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = 'var(--color-primary-hover)'
                                e.target.style.transform = 'translateY(-1px)'
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = 'var(--color-primary)'
                                e.target.style.transform = 'translateY(0)'
                            }}
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
