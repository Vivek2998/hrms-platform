import { Component, type ReactNode } from 'react';
import { ErrorState } from './error-state';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, isChunkError: false };

  static getDerivedStateFromError(error: unknown): State {
    const msg = error instanceof Error ? error.message : '';
    const isChunkError = /loading chunk|failed to fetch|dynamically imported/i.test(msg);
    return { hasError: true, isChunkError };
  }

  handleRetry = () => {
    this.setState({ hasError: false, isChunkError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    if (this.state.isChunkError) {
      return (
        <ErrorState
          variant="network"
          title="Failed to load page"
          description="A network issue prevented this page from loading. Check your connection and try again."
          onRetry={() => window.location.reload()}
          className="min-h-[60vh]"
        />
      );
    }

    return (
      <ErrorState
        variant="error"
        title="Something went wrong"
        description="An unexpected error occurred on this page. Try refreshing or come back later."
        onRetry={this.handleRetry}
        className="min-h-[60vh]"
      />
    );
  }
}
