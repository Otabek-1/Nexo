import React from 'react'
import { useNavigate } from 'react-router-dom'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })

    // TODO: Send error to monitoring service (e.g., Sentry)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white border border-red-200 rounded-lg p-8 max-w-lg text-center shadow-lg">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Xatolik yuz berdi</h1>
            <p className="text-slate-600 mb-4">
              Ilovaningizda kutilmagan xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki bosh sahifaga qaytib kelib yana bir bor urining.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left bg-slate-100 p-3 rounded text-sm text-slate-700 text-xs max-h-40 overflow-y-auto">
                <summary className="cursor-pointer font-semibold">Xatolik tafsilotlari (faqat development)</summary>
                <pre className="mt-2 overflow-x-auto">{this.state.error.toString()}</pre>
                {this.state.errorInfo?.componentStack && (
                  <>
                    <p className="mt-2 font-semibold">Component Stack:</p>
                    <pre className="overflow-x-auto">{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </details>
            )}

            <div className="mt-6 flex gap-3 flex-col sm:flex-row">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Qayta urinish
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
              >
                Bosh sahifaga
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
