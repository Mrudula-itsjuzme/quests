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
          backgroundColor: '#060907',
          color: '#e2e8f0',
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
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#22c55e', marginBottom: '8px' }}>
            Wild Realm Encountered an Issue
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '320px', marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected runtime error occurred.'}
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              backgroundColor: '#22c55e',
              color: '#060907',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
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
