export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Try serving static asset directly
    let response = await env.ASSETS.fetch(request);

    // If 404 and requesting an /app route, fallback to /app/index.html for SPA routing
    if (response.status === 404 && url.pathname.startsWith('/app')) {
      const fallbackUrl = new URL('/app/index.html', request.url);
      const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl));
      if (fallbackResponse.status === 200) {
        return fallbackResponse;
      }
    }

    return response;
  },
};
