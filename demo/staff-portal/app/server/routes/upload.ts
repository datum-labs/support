import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { EnvVariables } from '@/server/iface';
import { Hono } from 'hono';

const UPLOAD_DIR = '/tmp/support-uploads';
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export const uploadRoutes = new Hono<{ Variables: EnvVariables }>();

uploadRoutes.post('/image', async (c) => {
  const body = await c.req.parseBody();
  const file = body['file'];
  if (!(file instanceof File)) return c.json({ error: 'No file provided' }, 400);
  const ext = ALLOWED[file.type];
  if (!ext) return c.json({ error: 'Only PNG, JPEG, GIF, or WebP images are accepted' }, 400);
  if (file.size > MAX_BYTES) return c.json({ error: 'File exceeds 10 MB limit' }, 400);

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  await writeFile(path.join(UPLOAD_DIR, filename), Buffer.from(await file.arrayBuffer()));
  return c.json({ url: `/api/uploads/${filename}` });
});

uploadRoutes.get('/:filename', async (c) => {
  const filename = c.req.param('filename');
  if (!/^[0-9a-f-]{36}\.(png|jpg|gif|webp)$/.test(filename)) return c.notFound();
  try {
    const data = await readFile(path.join(UPLOAD_DIR, filename));
    const ext = filename.split('.').pop()!;
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return new Response(data, {
      headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' },
    });
  } catch {
    return c.notFound();
  }
});
