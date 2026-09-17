import { useState } from 'react';
import { useMe } from '../quests/queries';

const examples = [
  { id: 'sample-trek', name: 'Trek to Kudremukh', date: '12–14 Oct 2026', count: 24, image: '/assets/guest-library/mountains.jpg', type: 'Trips' },
  { id: 'sample-birding', name: 'Birdwatching at Ranganathittu', date: '18 Oct 2026', count: 16, image: '/assets/blue-billed-cuckoo.png', type: 'Events' },
  { id: 'sample-coast', name: 'Coastal Clean-Up Ride', date: '25 Oct 2026', count: 32, image: '/assets/guest-library/wave.jpg', type: 'Trips' },
];
export function GroupsPanel() {
  const {data:me} = useMe();
  const isGuest = me?.id?.startsWith('guest-');
  const [tab,setTab] = useState('Trips');
  const [joined,setJoined] = useState([]);
  const [notice,setNotice] = useState('');
  const trips = isGuest ? examples.filter(t=>tab==='All' || t.type===tab) : [];
  return <section className="reference-groups">
    <img className="reference-groups-hero" src="/assets/verdant-explorer-banner.png" alt="A mountain landscape"/>
    <div className="reference-groups-sheet"><h2>Explore Together</h2><p>Join trips, meet people, make an impact.</p>
      <div className="reference-group-tabs" role="tablist" aria-label="Group activities">{['All','Trips','Events'].map(t=><button role="tab" aria-selected={tab===t} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
      {isGuest && <small className="reference-sample-label">Sample trips · guest preview</small>}
      <div className="reference-trip-list">{trips.map(t=><article key={t.id}><img src={t.image} alt=""/><div><h3>{t.name}</h3><p>{t.date}</p><small>{t.count} going</small></div><button aria-pressed={joined.includes(t.id)} onClick={()=>{setJoined(j=>j.includes(t.id)?j.filter(id=>id!==t.id):[...j,t.id]);setNotice('This is a sample trip. No reservation or group membership was created.');}}>{joined.includes(t.id)?'Joined':'Join'}</button></article>)}</div>
      {!trips.length && <div className="reference-groups-empty"><h3>No trips available yet</h3><p>Meet fellow explorers in Community while upcoming trips are being prepared.</p></div>}
      {notice && <p className="reference-trip-notice" role="status">{notice}</p>}
    </div>
  </section>;
}
