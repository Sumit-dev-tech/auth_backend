const supabase = require('../config/supabase');
const { createServerClient } = require('@supabase/ssr');
const { parseCookieHeader, serializeCookieHeader } = require('@supabase/ssr');

// Initiate Google OAuth
const initiateGoogleAuth = async (req, res) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.BACKEND_URL}/api/auth/callback`,
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
    const next = req.query.next ?? '/';

    if (!code) {
      return res.redirect(303, '/auth/login?error=no_code');
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
      return res.redirect(303, '/auth/login?error=oauth_failed');
    }

    // Redirect to frontend with success
    return res.redirect(303, `${process.env.FRONTEND_URL}/home?auth=success`);
  } catch (error) {
    console.error('OAuth callback processing error:', error);
    return res.redirect(303, '/auth/login?error=server_error');
  }
};

module.exports = {
  initiateGoogleAuth,
  handleOAuthCallback
};
