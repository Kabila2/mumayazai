import React from 'react';
import { motion } from 'framer-motion';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { language = 'en' } = this.props;

      const translations = {
        en: {
          title: 'Oops! Something went wrong',
          message: "We're sorry for the inconvenience. The application encountered an unexpected error.",
          details: 'Error Details',
          reload: 'Reload Page',
          home: 'Go to Home',
          report: 'Report Issue'
        },
        ar: {
          title: 'عذراً! حدث خطأ ما',
          message: 'نعتذر عن الإزعاج. واجه التطبيق خطأً غير متوقع.',
          details: 'تفاصيل الخطأ',
          reload: 'إعادة تحميل الصفحة',
          home: 'العودة للرئيسية',
          report: 'الإبلاغ عن المشكلة'
        }
      };

      const t = translations[language] || translations.en;

      return (
        <div className="error-boundary-container" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <motion.div
            className="error-boundary-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">{t.title}</h1>
            <p className="error-message">{t.message}</p>

            <div className="error-actions">
              <button className="error-btn primary-btn" onClick={this.handleReset}>
                🔄 {t.reload}
              </button>
              <button className="error-btn secondary-btn" onClick={() => window.location.href = '/'}>
                🏠 {t.home}
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>{t.details}</summary>
                <div className="error-details-content">
                  <pre>{this.state.error.toString()}</pre>
                  <pre>{this.state.errorInfo?.componentStack}</pre>
                </div>
              </details>
            )}
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
