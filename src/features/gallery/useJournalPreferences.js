import { useCallback, useMemo, useState } from 'react';
import { useMe } from '../quests/queries';

export function useJournalPreferences() {
  const { data: me } = useMe();
  const [revision, setRevision] = useState(0);
  const key = me?.id ? `wild-realm-journal:${me.id}` : null;
  const preferences = useMemo(() => {
    void revision;
    if (!key) return { favorites: [], viewed: [] };
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}');
      return { favorites: Array.isArray(value.favorites) ? value.favorites : [], viewed: Array.isArray(value.viewed) ? value.viewed : [] };
    } catch { return { favorites: [], viewed: [] }; }
  // Revision reflects writes to this account's local preferences.
  }, [key, revision]);
  const update = useCallback((change) => {
    if (!key) return;
    try {
      const current = JSON.parse(localStorage.getItem(key) || '{}');
      const next = change({favorites: Array.isArray(current.favorites)?current.favorites:[], viewed:Array.isArray(current.viewed)?current.viewed:[]});
      localStorage.setItem(key, JSON.stringify(next));
      setRevision(r=>r+1);
    } catch { window.dispatchEvent(new CustomEvent('habbit-notice',{detail:'Your device could not save this journal preference.'})); }
  },[key]);
  return { ...preferences,
    toggleFavorite: id => update(p=>({...p,favorites:p.favorites.includes(id)?p.favorites.filter(x=>x!==id):[...p.favorites,id]})),
    markViewed: id => update(p=>({...p,viewed:[id,...p.viewed.filter(x=>x!==id)].slice(0,30)})),
  };
}
