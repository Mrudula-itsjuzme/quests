import { useState } from 'react';
import { ArrowLeft, Bookmark, MapPin, Leaf, Sparkles } from 'lucide-react';
import { CaptureImage } from '../../components/CaptureImage';

const rarityNames = ['Common','Uncommon','Rare','Epic','Legendary'];
export function SpeciesDetail({card,species,collection,onClose,onSelect,favorite,onFavorite}) {
  const [tab,setTab] = useState('About');
  const entry = (species || []).find(s=>s.id===card.speciesId);
  const name = card.itemName || card.cardTitle || entry?.commonName || 'Discovery';
  const category = entry?.category || card.category || 'Nature';
  const similar = (collection || []).filter(c=>c.id!==card.id && (c.category || (species || []).find(s=>s.id===c.speciesId)?.category)===category);
  const same = (collection || []).filter(c=>c.id===card.id || (card.speciesId && c.speciesId===card.speciesId) || c.itemName===name);
  const description = card.description || entry?.encyclopedia || entry?.summary;
  return <article className="reference-species">
    <div className="reference-species-hero"><CaptureImage imageRef={card.imageRef} alt={name} useAuth={card.imageRef?.includes('/captures/')} eager/><button aria-label="Close discovery details" onClick={onClose}><ArrowLeft size={22}/></button></div>
    <section className="reference-species-sheet">
      <div className="reference-species-title"><h2>{name}</h2><span>{rarityNames[Math.min(4,Math.max(0,(card.rarityStars || 1)-1))]}</span></div>
      {entry?.scientificName && <p className="reference-latin">{entry.scientificName}</p>}
      <div className="reference-species-tabs" role="tablist" aria-label="Discovery information">{['About','Gallery','Sightings','Similar'].map(t=><button role="tab" aria-selected={tab===t} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
      {tab==='About' && <>
        <div className="reference-species-facts"><div><Leaf/><strong>{category}</strong><small>Type</small></div><div><Sparkles/><strong>{card.rarityStars || 1} star</strong><small>Rarity</small></div><div><MapPin/><strong>{card.location || 'Not recorded'}</strong><small>Location</small></div></div>
        <p className="reference-species-description">{description || 'No field description was returned for this discovery.'}</p>
        {card.notes && <p className="reference-species-description">{card.notes}</p>}
        {card.capturedAt && <p className="reference-species-date">Seen {new Date(card.capturedAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</p>}
      </>}
      {(tab==='Gallery' || tab==='Similar') && <div className="reference-species-gallery">{(tab==='Gallery'?same:similar).map(c=><button key={c.id} aria-label={`View ${c.itemName || c.cardTitle}`} onClick={()=>{onSelect(c);setTab('About');}}><CaptureImage imageRef={c.imageRef} alt={c.itemName} useAuth={c.imageRef?.includes('/captures/')}/></button>)}{tab==='Similar' && !similar.length && <p>No similar discoveries in your journal yet.</p>}</div>}
      {tab==='Sightings' && <ul className="reference-sightings">{same.map(c=><li key={c.id}><MapPin size={18}/><div><strong>{c.location || 'Location not recorded'}</strong><p>{c.capturedAt ? new Date(c.capturedAt).toLocaleDateString() : 'Date not recorded'}</p></div></li>)}</ul>}
      <footer className="reference-species-actions"><button onClick={onClose}>Back to Journal</button><button aria-label={favorite?'Remove from favourites':'Add to favourites'} aria-pressed={favorite} onClick={onFavorite}><Bookmark fill={favorite?'currentColor':'none'} size={21}/></button></footer>
    </section>
  </article>;
}
