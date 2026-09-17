import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Camera, MapPin, Bookmark, Star } from 'lucide-react';
import { CaptureImage } from '../../components/CaptureImage';

export function PlaceDetail({ place, species, image, onClose, onCapture, onSave, onRate, saving, rating }) {
  const back = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    back.current?.focus();
    const escape = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown',escape);
    return () => { window.removeEventListener('keydown',escape); previous?.focus?.(); };
  }, [onClose]);
  const community = place.source === 'community';
  const lat = place.lat ?? place.gps?.lat;
  const lng = place.lng ?? place.gps?.lng;
  const mapQuery = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : `${place.title} ${place.region || ''}`;
  return createPortal(<section className="place-page" role="dialog" aria-modal="true" aria-labelledby="place-page-title">
    <header className="place-page-top"><button ref={back} aria-label="Close location details" onClick={onClose}><ArrowLeft size={22}/></button><span>{community ? 'Spotted here' : 'Explore a place'}</span></header>
    <div className="place-page-scroll">
      <figure className={`place-page-photo ${community ? 'is-sighting' : ''}`}>
        <CaptureImage imageRef={image} alt={community ? `Photo shared at ${place.title}` : place.title} useAuth={image?.includes('/captures/')} eager/>
        <figcaption>{community ? 'Community photo' : !place.imageRef ? 'Illustrative nature photo' : 'Place photo'}</figcaption>
      </figure>
      <div className="place-page-content">
        <p className="place-page-eyebrow">{community ? 'FROM THE COMMUNITY' : place.category}</p>
        <h1 id="place-page-title">{place.title}</h1>
        <p className="place-page-location"><MapPin size={15}/>{place.region || (community ? 'Shared by a fellow explorer' : place.category)}{place.distanceLabel ? ` · ${place.distanceLabel}` : ''}</p>
        {community ? <div className="place-page-contributor"><span aria-hidden="true">{(place.contributor || 'Explorer')[0]}</span><div><strong>{place.contributor || 'Explorer'}</strong><p>{place.discoveries || 1} shared photo{place.discoveries === 1 ? '' : 's'} from this location</p></div></div> : place.description && <p className="place-page-description">{place.description}</p>}
        {!!place.featuredSpecies?.length && <section className="place-page-finds"><h2>Look out for</h2><div>{place.featuredSpecies.map(id=><span key={id}>{species?.find(s=>s.id===id)?.commonName || id.split('-').slice(1).join(' ')}</span>)}</div></section>}
        {place.source === 'discovered' && <p className="place-page-description">{place.discoveries} of your discoveries came from here.</p>}
        {place.source === 'curated' && <div className="place-page-social"><button disabled={saving} onClick={onSave}><Bookmark size={19}/>{place.saved ? 'Saved publicly' : 'Save publicly'}</button><div><div className="place-page-stars" aria-label="Rate this place">{[1,2,3,4,5].map(n=><button key={n} disabled={rating} aria-label={`${n} star${n===1?'':'s'}`} onClick={()=>onRate(n)}><Star size={18} fill={n<=Number(place.viewerRating || 0)?'currentColor':'none'}/></button>)}</div><small>{place.rating ? `${place.rating} · ${place.ratingCount} ratings` : 'No ratings yet'}</small></div></div>}
        {place.attribution && <p className="place-page-attribution">{place.attribution}</p>}
      </div>
    </div>
    <footer className="place-page-actions"><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer"><MapPin size={18}/>View map</a><button onClick={onCapture}><Camera size={18}/>Capture here</button></footer>
  </section>,document.body);
}
