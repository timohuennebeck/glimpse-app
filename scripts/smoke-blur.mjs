// End-to-end check of blur-moment against the real project with a throwaway user.
// Run: node scripts/smoke-blur.mjs <path to a .jpg>
// Needs .env and "Confirm email" switched off. Prints the ids to clean up.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1).trim()]),
);

const photoPath = process.argv[2];
if (!photoPath) throw new Error('Usage: node scripts/smoke-blur.mjs <path to a .jpg>');

const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

const email = `glimpse.smoke+${Date.now()}@example.com`;
const { data: signUp, error: signUpError } = await supabase.auth.signUp({
  email,
  password: 'Smoke-test-123!',
  options: { data: { first_name: 'Smoke' } },
});
if (signUpError) throw signUpError;
if (!signUp.session)
  throw new Error('No session: switch off "Confirm email" in Authentication → Providers → Email.');
const userId = signUp.user.id;

const objectKey = `original/${userId}/${Date.now()}.jpg`;
const { error: uploadError } = await supabase.storage
  .from('moments')
  .upload(objectKey, readFileSync(photoPath), { contentType: 'image/jpeg' });
if (uploadError) throw uploadError;

const { data: moment, error: insertError } = await supabase
  .from('moments')
  .insert({ author_id: userId, original_storage_path: objectKey, width: 1, height: 1 })
  .select('id')
  .single();
if (insertError) throw insertError;

const started = Date.now();
const { data, error } = await supabase.functions.invoke('blur-moment', { body: { moment_id: moment.id } });
if (error) {
  const detail = error.context && typeof error.context.text === 'function' ? await error.context.text() : '';
  throw new Error(`blur-moment failed: ${error.message} ${detail}`);
}
console.log('blur-moment returned', data, `in ${Date.now() - started}ms`);

const again = await supabase.functions.invoke('blur-moment', { body: { moment_id: moment.id } });
console.log('second call returned', again.data);

console.log(JSON.stringify({ email, userId, momentId: moment.id }));
