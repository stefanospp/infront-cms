import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async ({ request, url, cookies }, next) => {
  // Only intercept /preview/* routes
  if (!url.pathname.startsWith('/preview')) {
    return next();
  }

  const PREVIEW_SECRET = 'th-preview-v2-secret';

  // Check for token in query param or cookie
  const queryToken = url.searchParams.get('token');
  const cookieToken = cookies.get('preview_token')?.value;
  const token = queryToken || cookieToken;

  if (token !== PREVIEW_SECRET) {
    return new Response('Unauthorized — preview token required', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Set cookie so subsequent navigations work without the query param
  if (queryToken) {
    cookies.set('preview_token', queryToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/preview',
      maxAge: 3600, // 1 hour
    });
  }

  return next();
});
