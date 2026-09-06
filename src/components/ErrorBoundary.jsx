import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #fff9ed 0%, #efe4ce 100%)',
          color: '#2f2116',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'sans-serif',
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px',
          }}>🌿</div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', color: '#2f2116', marginBottom: '8px' }}>
            Wild Realm Encountered an Issue
          </h2>
          <p style={{ fontSize: '14px', color: 'rgba(47, 33, 22, 0.68)', maxWidth: '320px', marginBottom: '24px', lineHeight: 1.45 }}>
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              backgroundColor: '#28764b',
              color: '#fffaf0',
              fontWeight: '900',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 14px 28px rgba(40, 118, 75, 0.18)',
            }}
          >
            Reload Realm
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
