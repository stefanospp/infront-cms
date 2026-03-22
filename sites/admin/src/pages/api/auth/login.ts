import type { APIRoute } from 'astro';
import { verifyPassword, createSessionToken } from '@/lib/auth';
import { env } from '@/lib/env';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { password } = body as { password: string };

    if (!password || typeof password !== 'string') {
      return new Response(JSON.stringify({ error: 'Password is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = env('ADMIN_PASSWORD_HASH');
    const sessionSecret = env('SESSION_SECRET');

    if (!passwordHash || !sessionSecret) {
      console.error('Missing ADMIN_PASSWORD_HASH or SESSION_SECRET env vars');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const valid = await verifyPassword(password, passwordHash);

    if (!valid) {
      return new Response(JSON.stringify({ error: 'Invalid password' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = await createSessionToken(sessionSecret);

    cookies.set('session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 86400,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
