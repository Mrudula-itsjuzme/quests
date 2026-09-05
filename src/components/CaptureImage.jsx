import { useEffect, useState } from 'react';
import { AuthImage } from './AuthImage';
import { isLocalCaptureRef, readLocalCaptureImage } from '../lib/localCaptureStore';
import { Icon } from './Icon';

/**
 * The one place a capture photograph is rendered.
 *
 * The API returns `imageRef` — a same-origin, authenticated URL path
 * (`/api/v1/captures/{id}/media`) served with `Cache-Control: private,
 * no-store`. Raw base64 is deliberately no longer part of the contract, so
 * nothing here should ever try to inline image data.
 *
 * A capture only has media once it is stored, and provisional/rejected cards
 * may have none, so `imageRef` is frequently null. In that case the element
 * crest stands in — it is the designed fallback, not an error state.
 *
 * Loading is a quiet cross-fade over the crest rather than a spinner: the
 * crest is already the right shape and colour, so the photo simply resolves
 * into place.
 */
export function CaptureImage({ imageRef, alt, element, className = '', eager = false, useAuth = false, style }) {
  const [state, setState] = useState('loading'); // loading | loaded | failed
  const [localSrc, setLocalSrc] = useState(null);
  const elementKey = (element || 'Earth').toLowerCase();
  const remoteLikelyUnavailable = typeof navigator !== 'undefined' && navigator.onLine === false && /^https?:\/\//i.test(imageRef || '');
  const fallbackSrc = fallbackForCapture(alt, element);
  const imageSrc = state === 'failed' || remoteLikelyUnavailable ? fallbackSrc : (localSrc || imageRef || fallbackSrc);
  const showPhoto = Boolean(imageSrc) && state !== 'failed';

  useEffect(() => {
    let active = true;
    if (!imageRef) {
      setState('loaded');
      return;
    }
    setState('loading');
    setLocalSrc(null);
    const timeout = setTimeout(() => {
      if (active) setState('failed');
    }, 2800);
    if (!isLocalCaptureRef(imageRef)) {
      return () => {
        active = false;
        clearTimeout(timeout);
      };
    }
    readLocalCaptureImage(imageRef)
      .then((src) => {
        if (!active) return;
        if (src) {
          setLocalSrc(src);
          setState('loaded');
        } else setState('failed');
      })
      .catch(() => {
        if (active) setState('failed');
      });
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [imageRef]);

  const visualState = state === 'failed' ? 'loaded' : (showPhoto ? state : 'crest');

  return (
    <div className={`capture-image ${className}`.trim()} data-state={visualState} style={style}>
      {/* Always rendered: it is both the fallback and the loading ground. */}
      <div className={`capture-image-crest element-${elementKey}`} aria-hidden="true">
        {state === 'loading' ? (
          <span className="capture-loader-icon" style={{ display: 'inline-block', animation: 'spin 2s linear infinite' }}>
            <Icon name="refresh-cw" />
          </span>
        ) : (
          <span>{element || 'Wild'}</span>
        )}
      </div>

      {(showPhoto || state === 'failed') && (
        <AuthImage
          className="capture-image-photo"
          src={imageSrc}
          alt={alt || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
          useAuth={useAuth && !localSrc}
        />
      )}
    </div>
  );
}

function fallbackForCapture(alt, element) {
  const text = `${alt || ''} ${element || ''}`.toLowerCase();
  if (/bird|parrot|cuckoo|fauna|fern|grass/.test(text)) return '/assets/blue-billed-cuckoo.png';
  if (/sky|cloud|northern|aurora|light/.test(text)) return '/auth-celestial-aperture.png';
  if (/dog|retriever|cat|animal|horse/.test(text)) return '/dashboard-castle-panorama.png';
  if (/mountain|ridge|earth|stone|desert/.test(text)) return '/assets/quest-compass-poster.png';
  if (/water|lake|river|falls/.test(text)) return '/assets/verdant-explorer-banner.png';
  return '/assets/verdant-explorer-banner.png';
}
