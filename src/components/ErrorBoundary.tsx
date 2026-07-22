"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Torok error boundary:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <p className="error-boundary-title">
            {this.props.fallbackTitle ?? "Torok lost the page for a moment."}
          </p>
          <p className="error-boundary-body">
            Your question is still here. Please try again.
          </p>
          <button
            type="button"
            className="btn-primary btn-lamp"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry?.();
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
