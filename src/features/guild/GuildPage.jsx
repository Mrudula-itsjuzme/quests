import { Icon } from '../../components/Icon';

export function GuildPage() {
  return (
    <main className="guild-page page-stack fantasy-page">
      <header className="reference-header compact-header">
        <div className="avatar-medallion"><span>G</span></div>
        <div><p className="eyebrow">THE OAKBOUND</p><h1>Guild Hall</h1><p>Shared momentum, when the guild is ready.</p></div>
      </header>
      <section className="ornate-panel unavailable-panel">
        <span className="large-emblem"><Icon name="shield" /></span>
        <h2>Your guild hall is quiet</h2>
        <p>Guild membership, chat, and leaderboards need a real server-backed social system. They are not simulated here.</p>
        <button type="button" className="gold-button" onClick={() => window.dispatchEvent(new CustomEvent('habbit-notice', { detail: 'Guild invitations are not available yet.' }))}>Check invitations</button>
      </section>
    </main>
  );
}
