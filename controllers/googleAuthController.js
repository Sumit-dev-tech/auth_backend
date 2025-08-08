const supabase = require('../config/supabase');
const { createServerClient } = require('@supabase/ssr');
const { parseCookieHeader, serializeCookieHeader } = require('@supabase/ssr');

// Initiate Google OAuth
const initiateGoogleAuth = async (req, res) => {
  try {
    const { frontendUrl, redirectUrl } = req.body;
    
    if (!frontendUrl) {
      return res.status(400).json({ error: 'Frontend URL is required' });
    }

    // Default redirect URL if not provided
    const finalRedirectUrl = redirectUrl || '/home';

    // Build callback URL to this backend, carrying along the frontendUrl and intended redirect
    const inferredProtocol = (req.headers['x-forwarded-proto'] || '').toString().split(',')[0] || 'http';
    const inferredHost = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
    const backendUrl = process.env.BACKEND_URL || (inferredHost ? `${inferredProtocol}://${inferredHost}` : '');
    if (!backendUrl) {
      return res.status(500).json({ error: 'Unable to determine BACKEND_URL. Configure env BACKEND_URL or ensure host headers are present.' });
    }

    const callbackUrl = `${backendUrl}/api/auth/callback?frontendUrl=${encodeURIComponent(frontendUrl)}&redirectUrl=${encodeURIComponent(finalRedirectUrl)}`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Redirect back to this backend so we can exchange the code for a session
        redirectTo: callbackUrl,
        flowType: 'pkce',
      },
    });

    if (error) {
      console.error('Google OAuth error:', error);
      return res.status(400).json({ error: error.message });
    }

    if (data.url) {
      return res.json({ url: data.url });
    }

    return res.status(400).json({ error: 'Failed to generate OAuth URL' });
  } catch (error) {
    console.error('Google OAuth initiation error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle OAuth callback
const handleOAuthCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const frontendUrl = req.query.frontendUrl;
    const redirectUrl = req.query.redirectUrl || '/home';

    if (!code) {
      const redirectUrl = frontendUrl 
        ? `${frontendUrl}/auth/login?error=no_code`
        : '/auth/login?error=no_code';
      return res.redirect(303, redirectUrl);
    }

    if (!frontendUrl) {
      return res.redirect(303, '/auth/login?error=no_frontend_url');
    }

    // Create server client for handling cookies
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return parseCookieHeader(req.headers.cookie ?? '');
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              res.appendHeader('Set-Cookie', serializeCookieHeader(name, value, options))
            );
          },
        },
      }
    );

    // Exchange code for session
    const { data, error } = await supabaseServer.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('OAuth callback error:', error);
      return res.redirect(303, `${frontendUrl}/auth/login?error=oauth_failed`);
    }

    // Get user data
    const { data: { user }, error: userError } = await supabaseServer.auth.getUser();

    if (userError || !user) {
      console.error('Failed to get user data:', userError);
      return res.redirect(303, `${frontendUrl}/auth/login?error=user_fetch_failed`);
    }

    // Create a simple token for frontend session management
    const sessionToken = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email,
      provider: 'google'
    })).toString('base64');

    // Redirect to frontend with success, token, and the original redirect URL
    return res.redirect(303, `${frontendUrl}${redirectUrl}?auth=success&token=${encodeURIComponent(sessionToken)}`);
  } catch (error) {
    console.error('OAuth callback processing error:', error);
    const frontendUrl = req.query.frontendUrl;
    const redirectUrl = frontendUrl 
      ? `${frontendUrl}/auth/login?error=server_error`
      : '/auth/login?error=server_error';
    return res.redirect(303, redirectUrl);
  }
};

module.exports = {
  initiateGoogleAuth,
  handleOAuthCallback
};
