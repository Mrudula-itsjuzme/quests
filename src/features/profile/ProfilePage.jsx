import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, UsersRound, Sprout, Pencil, Settings, ChevronRight } from 'lucide-react';
import { useMe, useCaptures, useSpecies, useUpdateMe } from '../quests/queries';
import { CaptureImage } from '../../components/CaptureImage';
import { SpeciesDetail } from '../gallery/SpeciesDetail';
import { useJournalPreferences } from '../gallery/useJournalPreferences';

export function ProfilePage() {
  const { data: me } = useMe();
  const { data: captures } = useCaptures();
  const { data: species } = useSpecies();
  const updateMe = useUpdateMe();
  const journal = useJournalPreferences();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [tab, setTab] = useState('achievements');
  const [selected, setSelected] = useState(null);
  const discoveries = (captures || []).filter(c => c.status !== 'rejected');
  const category = c => (species || []).find(s => s.id === c.speciesId)?.category || c.category;
  const speciesCount = new Set(discoveries.filter(c => ['Fauna','Flora'].includes(category(c))).map(c => c.speciesId || c.itemName)).size;
  const places = new Set(discoveries.filter(c => ['Landscape','Heritage'].includes(category(c))).map(c => c.speciesId || c.itemName)).size;
  const achievements = [
    { label: 'Explorer', detail: `Level ${me?.level || 1}`, icon: Leaf, color: 'sage', earned: (me?.level || 1) >= 3 },
    { label: 'Nature Lover', detail: `${discoveries.length} captures`, icon: Sprout, color: 'teal', earned: discoveries.length >= 50 },
    { label: 'Community', detail: 'Explore together', icon: UsersRound, color: 'tan', earned: false },
  ];
  return <main className="reference-profile">
    <h1 className="sr-only">Profile</h1>
    <button className="reference-profile-settings" aria-label="Open profile settings" onClick={() => window.dispatchEvent(new Event('habbit-open-settings'))}><Settings size={20} /></button>
    <header className="reference-profile-identity">
      <div className="reference-profile-avatar">{me?.avatarUrl ? <img src={me.avatarUrl} alt="" /> : <span>{(me?.displayName || 'Explorer').slice(0,1)}</span>}</div>
      <h2>{me?.displayName || 'Explorer'}</h2>
      <p>{me?.tierLabel || 'Nature explorer'}</p>
      <small>Explorer. Photographer. Nature lover.</small>
    </header>
    <dl className="reference-profile-stats">{[[discoveries.length,'Captures'],[speciesCount,'Species'],[places,'Places'],[achievements.filter(a=>a.earned).length,'Badges']].map(([value,label])=><div key={label}><dd>{value}</dd><dt>{label}</dt></div>)}</dl>
    <button className="reference-edit-profile" onClick={() => { setName(me?.displayName || ''); setEditing(true); }}><Pencil size={16} /> Edit Profile</button>
    {editing && <form className="reference-profile-form" onSubmit={async e => { e.preventDefault(); try { await updateMe.mutateAsync({displayName:name.trim()}); setEditing(false); } catch { /* displayed below */ } }}>
      <label htmlFor="profile-name">Display name</label><input id="profile-name" value={name} onChange={e=>setName(e.target.value)} required maxLength={120} />
      {updateMe.isError && <p role="alert">Could not save your profile. Please try again.</p>}
      <div><button type="button" onClick={()=>setEditing(false)}>Cancel</button><button disabled={updateMe.isPending || !name.trim()}>{updateMe.isPending ? 'Saving…' : 'Save changes'}</button></div>
    </form>}
    <div className="reference-profile-tabs" role="tablist" aria-label="Profile content"><button role="tab" aria-selected={tab==='achievements'} onClick={()=>setTab('achievements')}>Achievements</button><button role="tab" aria-selected={tab==='captures'} onClick={()=>setTab('captures')}>Recently Viewed</button></div>
    {tab === 'achievements' ? <section className="reference-achievements" aria-label="Achievements">{achievements.map(a=><div key={a.label}><span className={`reference-achievement-icon ${a.color} ${a.earned ? 'earned' : ''}`}><a.icon size={30} strokeWidth={1.6} /></span><strong>{a.label}</strong><small>{a.detail}</small><span className="sr-only">{a.earned ? 'Earned' : 'In progress'}</span></div>)}</section> : <section className="reference-recent-grid" aria-label="Recently viewed discoveries">{journal.viewed.some(id=>discoveries.some(c=>c.id===id)) ? journal.viewed.map(id=>discoveries.find(c=>c.id===id)).filter(Boolean).slice(0,9).map(c=><button key={c.id} aria-label={`View ${c.itemName}`} onClick={()=>{journal.markViewed(c.id);setSelected(c);}}><CaptureImage imageRef={c.imageRef} alt={c.itemName} useAuth={c.imageRef?.includes('/captures/')} /></button>) : <p>Open a discovery in your Journal to see it here.</p>}</section>}
    <div className="reference-profile-links">{[['Quests','/app/quests'],['Rewards & Store','/app/rewards'],['My Journal','/app/library']].map(([label,to])=><Link key={to} to={to}>{label}<ChevronRight size={16}/></Link>)}</div>
    {selected && <div className="selection-overlay" role="dialog" aria-modal="true" aria-label="Discovery details"><SpeciesDetail key={selected.id} card={selected} species={species} collection={discoveries} favorite={journal.favorites.includes(selected.id)} onFavorite={()=>journal.toggleFavorite(selected.id)} onSelect={c=>{journal.markViewed(c.id);setSelected(c);}} onClose={()=>setSelected(null)}/></div>}
  </main>;
}
