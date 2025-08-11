const {createServerClient} =  require('@supabase/ssr');
require('dotenv').config();

const supabaseServerClient = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const googleAuthController = {
    async googleAuth(req, res) {
        try{

            const {redirectUrl} =  req.body;
            const { data, error } = await supabaseServerClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: redirectUrl,
                },
            });
            if (error) {
                console.error('Error during Google OAuth sign-in:', error);
                return res.status(500).json({ error: 'OAuth sign-in failed' });
            }
            if (data) {
                console.log('Google OAuth sign-in successful:', data);
                return res.status(200).json({ message: 'Redirecting to Google OAuth', data });
            }
        }catch (error) {
            console.error('Error in googleAuth:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
     }
}

module.exports = googleAuthController;