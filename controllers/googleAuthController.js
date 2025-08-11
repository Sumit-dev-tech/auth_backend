const { createClientForServer} = require('../config/server');
require('dotenv').config();

const googleAuthController = {
    async googleAuth(req, res) {
        const supabaseServerClient = await createClientForServer();
        try{

            const {redirectTo} =  req.body;
            const { data, error } = await supabaseServerClient.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo,
                },
            });
            if (error) {
                console.error('Error during Google OAuth sign-in:', error);
                return res.status(500).json({ error: 'OAuth sign-in failed' });
            }
            if (data) {
                console.log('Google OAuth sign-in successful:', data);
                return res.status(200).json({ message: 'Redirecting to Google OAuth', url: data.url });

            }
        }catch (error) {
            console.error('Error in googleAuth:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
     }
}

module.exports = googleAuthController;