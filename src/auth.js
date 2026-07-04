import { supabase } from './supabase.js';

export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_event, session) => cb(session?.user ?? null));
}

export async function signUpEmail(email, password, name, phone) {
  return supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone } },
  });
}

export async function signInEmail(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

// provider: 'google' | 'facebook'
export async function signInOAuth(provider) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
