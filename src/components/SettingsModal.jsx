import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UserRound, UsersRound, Bell, LockKeyhole, Settings, CircleHelp, Info, ChevronRight, LogOut } from 'lucide-react';
import { useApiClient } from '../lib/useApiClient';
import { SOUND_MUTED_KEY, playTap } from '../lib/useSoundEffects';
import { isMotionReduced, setMotionReduced } from '../lib/useMotionPreference';

const rows = [
  ['Account', UserRound], ['Profile', UsersRound], ['Notifications', Bell], ['Privacy & Data', LockKeyhole],
  ['App Preferences', Settings], ['Help & Support', CircleHelp], ['About Wild Realm', Info],
];
export function SettingsModal({ onClose, user, onLogout, themeMode = 'light', onThemeChange }) {
  const api = useApiClient();
  const [section, setSection] = useState(null);
  const [muted, setMuted] = useState(() => localStorage.getItem(SOUND_MUTED_KEY) === 'true');
  const [reduced, setReduced] = useState(isMotionReduced);
  const [deleting, setDeleting] = useState(false);
  const [deleteState, setDeleteState] = useState('idle');
  const isGuest = user?.id?.startsWith?.('guest-') || user?.email === 'guest@wildrealm.local';
  return <div className="reference-settings-overlay" role="dialog" aria-modal="true" aria-label="Settings">
    <section className="reference-settings">
      <header><button aria-label={section ? 'Back to settings' : 'Close settings'} onClick={()=>section ? setSection(null) : onClose()}><ArrowLeft size={22}/></button><h2>{section || 'Settings'}</h2></header>
      {!section ? <>
        <div className="reference-settings-menu">{rows.map(([label, Glyph])=><button key={label} onClick={()=>{playTap();setSection(label);}}><Glyph size={20} strokeWidth={1.6}/><span>{label}</span><ChevronRight size={17}/></button>)}</div>
        <button className="reference-delete" onClick={()=>{setDeleting(true);setSection('Delete Account');}}>Delete Account</button>
        <button className="reference-logout" onClick={()=>{playTap();onLogout?.();}}><LogOut size={18}/> Log Out</button>
      </> : <div className="reference-settings-content">
        {section === 'Account' && <><h3>{user?.displayName || 'Explorer'}</h3><p>{user?.email || 'No email added'}</p><p>{isGuest ? 'You are exploring as a guest. Your captures stay on this device.' : 'Your account is connected to Wild Realm.'}</p></>}
        {section === 'Profile' && <><p>Update the name shown with your discoveries and community posts.</p><Link to="/app/profile" onClick={onClose}>Open profile</Link></>}
        {section === 'Notifications' && <><p>Manage notifications in your device or browser settings.</p><p>Wild Realm requests permission when a feature needs it.</p></>}
        {section === 'Privacy & Data' && <><p>Your camera and location permissions are controlled by your device. You can revoke them in your device settings.</p><p>Review each discovery before sharing it with the community.</p><button className="reference-delete" onClick={()=>{setDeleting(true);setSection('Delete Account');}}>Delete Account</button></>}
        {section === 'App Preferences' && <>
          <h3>Appearance</h3><div className="reference-setting-options">{['light','dark','system'].map(mode=><button key={mode} aria-pressed={themeMode===mode} onClick={()=>onThemeChange?.(mode)}>{mode==='system'?'System':mode==='dark'?'Night':'Day'}</button>)}</div>
          <label className="reference-setting-toggle">Sound effects<input type="checkbox" checked={!muted} onChange={()=>{localStorage.setItem(SOUND_MUTED_KEY,String(!muted));setMuted(!muted);}}/></label>
          <label className="reference-setting-toggle">Reduced motion<input type="checkbox" checked={reduced} onChange={()=>{setMotionReduced(!reduced);setReduced(!reduced);}}/></label>
        </>}
        {section === 'Help & Support' && <><h3>Keep exploring</h3><p>Use the center camera button to capture a discovery. Find your saved photos in Journal.</p><p>If capture is unavailable, check your device camera permissions and network connection.</p></>}
        {section === 'About Wild Realm' && <><h3>Wild Realm</h3><p>Explore. Capture. Belong.</p><p>A journal for the places you discover and the nature around you.</p></>}
        {section === 'Delete Account' && deleting && <>
          {deleteState==='sent' ? <p role="status">Your account deletion request has been received.</p> : <><p>{isGuest ? 'Guest mode has no cloud account to delete. Log out to leave this guest session.' : 'This sends an account deletion request. It does not immediately erase your account. This action cannot be cancelled here.'}</p>
          {!isGuest && <button className="reference-delete" disabled={deleteState==='sending'} onClick={async()=>{setDeleteState('sending');try {await api.requestAccountDeletion();setDeleteState('sent');}catch{setDeleteState('error');}}}>{deleteState==='sending'?'Sending…':'Confirm deletion request'}</button>}
          {deleteState==='error' && <p role="alert">Could not submit your request. Please try again.</p>}
          </>}
        </>}
      </div>}
    </section>
  </div>;
}
