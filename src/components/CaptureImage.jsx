import { useState } from 'react';

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
export function CaptureImage({ imageRef, alt, element, className = '', eager = false }) {
  const [state, setState] = useState('loading'); // loading | loaded | failed
  const elementKey = (element || 'Earth').toLowerCase();
  const showPhoto = Boolean(imageRef) && state !== 'failed';

  return (
    <div className={`capture-image ${className}`.trim()} data-state={showPhoto ? state : 'crest'}>
      {/* Always rendered: it is both the fallback and the loading ground. */}
      <div className={`capture-image-crest element-${elementKey}`} aria-hidden="true">
        <span>{element || 'Wild'}</span>
      </div>

      {showPhoto && (
        <img
          className="capture-image-photo"
          src={imageRef}
          alt={alt || ''}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setState('loaded')}
          onError={() => setState('failed')}
        />
      )}
    </div>
  );
}
