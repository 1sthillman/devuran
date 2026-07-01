/**
 * Cloudflare Workers - R2 Upload Handler
 * Deploy this to Cloudflare Workers
 */

interface Env {
  R2_BUCKET: R2Bucket;
  ALLOWED_ORIGINS?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || '*',
      'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    try {
      // Upload endpoint
      if (url.pathname === '/upload' && request.method === 'POST') {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const key = formData.get('key') as string;

        if (!file || !key) {
          return new Response(
            JSON.stringify({ error: 'Missing file or key' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Upload to R2
        await env.R2_BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });

        const publicUrl = `https://images.devuran.com/${key}`;

        return new Response(
          JSON.stringify({ 
            success: true, 
            url: publicUrl,
            key 
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Delete endpoint
      if (url.pathname === '/delete' && request.method === 'DELETE') {
        const { key } = await request.json() as { key: string };

        if (!key) {
          return new Response(
            JSON.stringify({ error: 'Missing key' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await env.R2_BUCKET.delete(key);

        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get endpoint (optional - for direct access)
      if (request.method === 'GET') {
        const key = url.pathname.slice(1); // Remove leading slash

        const object = await env.R2_BUCKET.get(key);

        if (!object) {
          return new Response('Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', env.ALLOWED_ORIGINS || '*');

        return new Response(object.body, { headers });
      }

      return new Response('Method Not Allowed', { status: 405 });
    } catch (error: any) {
      console.error('R2 Error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Internal Server Error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
};
