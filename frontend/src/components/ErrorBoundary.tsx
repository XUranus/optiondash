import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, Button } from 'antd';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          type="error"
          message={this.props.fallbackTitle || 'Something went wrong'}
          description={this.state.error?.message || 'An unexpected error occurred.'}
          action={
            <Button
              size="small"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </Button>
          }
          className="my-4"
          showIcon
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
