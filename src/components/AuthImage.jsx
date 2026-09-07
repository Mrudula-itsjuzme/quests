import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../lib/api';
import { useAuth } from '../features/auth/AuthContext';

export function getAbsoluteImageUrl(imageRef) {
  if (!imageRef) return null;
  if (imageRef.startsWith('http')) return imageRef;
  // If API_BASE_URL is '/api' and imageRef is '/api/v1/...', we don't want '/api/api/v1/...'.
  // We can just take the origin of API_BASE_URL if it's absolute, or use window.location.origin.
  if (API_BASE_URL.startsWith('http')) {
    try {
      const url = new URL(API_BASE_URL);
      // Construct from the origin if imageRef is absolute path
      if (imageRef.startsWith('/')) {
        return `${url.origin}${imageRef}`;
      }
      return `${API_BASE_URL}/${imageRef}`;
    } catch {
      // Fallback
    }
  }
  return imageRef;
}

export function AuthImage({ src, alt, className, useAuth: requiresAuth = false, onError, ...props }) {
  const [objectUrl, setObjectUrl] = useState(null);
  const { getToken } = useAuth();
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!src) return;
    setObjectUrl(null);
    
    const absoluteSrc = getAbsoluteImageUrl(src);

    if (!requiresAuth || absoluteSrc.startsWith('data:')) {
      setObjectUrl(absoluteSrc);
      return;
    }

    let isMounted = true;
    let urlToRevoke = null;
    const controller = new AbortController();

    async function load() {
      try {
        const token = await getToken();
        const headers = {};
        if (token && token !== 'dev') {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(absoluteSrc, { 
          headers,
          signal: controller.signal,
          // Follow redirects in case it points to a signed storageURL
          redirect: 'follow'
        });
        
        if (!response.ok) throw new Error('Image fetch failed');
        const blob = await response.blob();
        if (!isMounted) return;
        urlToRevoke = URL.createObjectURL(blob);
        setObjectUrl(urlToRevoke);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        // A parent-provided error handler means the missing image has a
        // designed fallback. Keep that expected guest/offline path quiet.
        if (!onErrorRef.current) {
          console.warn('Authenticated image unavailable', { src: absoluteSrc, status: err?.message });
        }
        if (isMounted) onErrorRef.current?.(err);
      }
    }
    
    load();

    return () => {
      isMounted = false;
      controller.abort();
      if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
    };
  }, [src, requiresAuth, getToken]);

  if (!objectUrl) return <div className={`image-placeholder ${className || ''}`} />;
  return <img src={objectUrl} alt={alt} className={className} {...props} />;
}
