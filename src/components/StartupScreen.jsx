import { Icon } from './Icon';

export function StartupScreen({ message = 'Opening Wild Realm…', title, onRetry, error = false, statusHint }) {
  return <section className="reference-startup" role={error ? 'alert' : 'status'} aria-live="polite">
    <img className="reference-startup-photo" src="/assets/reference-splash.png" alt="" fetchPriority="high" />
    <div className="reference-startup-shade" />
    <div className="reference-startup-brand"><Icon name="leaf"/><h1>Wild Realm</h1><p>Explore. Capture. Belong.</p></div>
    <footer className="reference-startup-footer">
      {error ? <div className="reference-startup-error"><h2>{title}</h2><p>{message}</p>{statusHint && <p>{statusHint}</p>}{onRetry && <button onClick={onRetry}>Try again</button>}</div> : <><span className="sr-only">{message}</span><p>Nature connects us all.</p><span className="reference-startup-progress" aria-hidden="true"/></>}
    </footer>
  </section>;
}
