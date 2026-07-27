import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(url && anonKey);

export const supabase = supabaseConfigured
  ? createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  : null;

export async function uploadQuestProof(file) {
  if (!supabase) throw new Error('proof_storage_not_configured');
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user?.id;
  if (!userId) throw new Error('authentication_required');
  const extension = String(file.name || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const objectPath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('quest-proofs').upload(objectPath, file, { cacheControl: '3600', upsert: false, contentType: file.type });
  if (error) throw error;
  return objectPath;
}
