import React from 'react';

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('MingleKE crashed', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 text-cream">
          <h1 className="text-2xl font-bold">Something broke</h1>
          <p className="text-mist text-sm max-w-xs">
            The app hit an unexpected error. Reload to get back to mingling.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary max-w-xs"
          >
            Reload app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
