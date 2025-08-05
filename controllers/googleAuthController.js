const supabase = require('../config/supabase');
const { createServerClient } = require('@supabase/ssr');
const { parseCookieHeader, serializeCookieHeader } = require('@supabase/ssr');

// Initiate Google OAuth
const initiateGoogleAuth = async (req, res) => {
  try {
    const { frontendUrl } = req.body;
    
    if (!frontendUrl) {
      return res.status(400).json({ error: 'Frontend URL is required' });
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.BACKEND_URL}/api/auth/callback?frontendUrl=${encodeURIComponent(frontendUrl)}`,
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
    const next = req.query.next ?? '/';

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

    // Redirect to frontend with success and token
    return res.redirect(303, `${frontendUrl}/home?auth=success&token=${sessionToken}`);
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
