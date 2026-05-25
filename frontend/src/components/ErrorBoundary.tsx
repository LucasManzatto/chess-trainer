import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

type Props = { children: ReactNode; fallback?: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center h-full p-8 text-center">
          <div className="space-y-3">
            <p className="text-red-400 font-semibold">Something went wrong</p>
            <p className="text-gray-500 text-sm font-mono">{this.state.error.message}</p>
            <button
              onClick={() => this.setState({ error: null })}
              className="text-xs text-amber-400 hover:underline"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
