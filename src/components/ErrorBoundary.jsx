import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-xl font-bold text-red-800 mb-2">שגיאה בטעינת הדף</h2>
          <p className="text-sm text-red-700 mb-4">אירעה שגיאה בעת טעינת התוכן. נא לרענן את הדף או לנסות שוב מאוחר יותר.</p>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            רענן דף
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;