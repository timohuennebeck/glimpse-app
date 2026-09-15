// Makes the frosted rendition of a moment on the server. The recipient's app is
// only ever given this file until the trade unlocks, so it must not come from a
// client. See docs/database.md §3.
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickReadSettings,
} from 'npm:@imagemagick/magick-wasm@0.0.43';

/** Width of the stored rendition. The app scales it up and blurs it further. */
const WIDTH = 48;
const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@imagemagick/magick-wasm@0.0.43/dist/x86/magick.wasm';

/** The bundled wasm when the runtime exposes package files, the CDN copy otherwise. */
async function loadWasm(): Promise<Uint8Array> {
  try {
    return await Deno.readFile(
      new URL(import.meta.resolve('npm:@imagemagick/magick-wasm@0.0.43/magick.wasm')),
    );
  } catch {
    const response = await fetch(WASM_CDN);
    if (!response.ok) throw new Error(`magick.wasm download failed: ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  }
}

await initializeImageMagick(await loadWasm());

function secretKey(): string {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) return JSON.parse(keys).default as string;
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'missing_token' }, 401);

  const { data: auth, error: authError } = await admin.auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'invalid_token' }, 401);

  const body = await req.json().catch(() => null);
  const momentId = body?.moment_id;
  if (typeof momentId !== 'string') return json({ error: 'moment_id_required' }, 400);

  const { data: moment, error: momentError } = await admin
    .from('moments')
    .select('id, author_id, original_storage_path, blurred_storage_path')
    .eq('id', momentId)
    .maybeSingle();
  if (momentError) return json({ error: momentError.message }, 500);
  if (!moment || moment.author_id !== auth.user.id) return json({ error: 'not_moment_author' }, 403);
  if (moment.blurred_storage_path) return json({ blurred_storage_path: moment.blurred_storage_path });

  const { data: original, error: downloadError } = await admin.storage
    .from('moments')
    .download(moment.original_storage_path);
  if (downloadError || !original) return json({ error: downloadError?.message ?? 'download_failed' }, 500);

  const settings = new MagickReadSettings();
  // Lets the JPEG decoder scale down while decoding, a fraction of a full decode.
  settings.setDefine(MagickFormat.Jpeg, 'size', `${WIDTH * 2}x${WIDTH * 2}`);

  const blurred = ImageMagick.read(new Uint8Array(await original.arrayBuffer()), settings, (image) => {
    image.resize(WIDTH, 0);
    image.blur(0, 4);
    image.quality = 70;
    // The callback's buffer is only valid inside it, so copy it out.
    return image.write(MagickFormat.Jpeg, (data) => new Uint8Array(data));
  });

  const fileName = moment.original_storage_path.split('/').pop();
  const path = `blurred/${moment.author_id}/${fileName}`;

  const { error: uploadError } = await admin.storage
    .from('moments')
    .upload(path, blurred, { contentType: 'image/jpeg', upsert: true });
  if (uploadError) return json({ error: uploadError.message }, 500);

  const { error: updateError } = await admin
    .from('moments')
    .update({ blurred_storage_path: path })
    .eq('id', moment.id);
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ blurred_storage_path: path });
});
