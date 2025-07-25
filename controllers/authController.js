const supabase = require('../config/supabase');

const authController = {
    async signUp(req, res) {
        const { email, name , phone } = req.body;
        if (!email) {
      return res.status(400).json({ error: 'email are required' });
    }
        try{
            const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options:{
            data:{
                name,
                phone,
            },
        },
      });
            if (error) throw error;

             res.status(200).json({ message: 'User created, check email for confirmation', user: data.name });
        }catch(error){
            res.status(400).json({error: error.message});
        }
    },

    async verifyOtp(req, res){
        const {email, otp} = req.body;

        console.log('Received OTP request:', req.body);

        try{
            const {data, error} = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "email",
            });

            if (error) throw error ;
            res.status(200).json({
                message: 'OTP verified',
                access_token: data.session,
            });
        }catch (error){
            res.status(400).json({error: error.message});
        }
    },

    async setPassword (req, res) {
        const {access_token, password} = req.body;
        try{
            const {data, error} = await supabase.auth.updateUser(
                {
                    password: password,
                },
                {
                    access_token: access_token,
                }
            );
            if (error) throw error;
            res.status(200).json({ message: 'Password updated successfully' });
        }catch (error){
            res.status(400).json({error: error.message});
        }
    },

    async SignIn (req, res) {
        const {email, password, name, phone} = req.body;
        try{
            const {data, error} = await supabase.auth.signInWithPassword({
                email,
                password,
                options:{
                    data:{
                        name,
                        phone,
                    },
                },
            });
            if (error) throw error;
            res.status(200).json({
                 message: 'User signed in successfully',
                 id: data.user.id,
                 name: data.user.user_metadata.name,
                 phone: data.user.user_metadata.phone,
                 email: data.user.email,
                 access_token: data.session.access_token,
                 refresh_token: data.session.refresh_token,
                });
        }catch (error){
            res.status(400).json({error: error.message});
        }
    },
    async SignOut (req, res) {
        try{
            const {error} = await supabase.auth.signOut();
            if (error) throw error;
            res.status(200).json({ message: 'User signed out successfully' });
        }catch (error){
            res.status(400).json({error: error.message});
        }
    },
};  

module.exports = authController;
