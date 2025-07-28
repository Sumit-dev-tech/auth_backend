const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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

            const jwtSecret = process.env.NEXT_PUBLIC_JWT_KEY;

            const payload = {
                id: data.user.id,
                name: data.user.user_metadata.name,
                email: data.user.email,
            }

            const token = jwt.sign(payload, jwtSecret, {expiresIn: '1h'});

            res.status(200).json({
                 message: 'User signed in successfully',
                 token: token,
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

    
    async getUserDetails (req, res) {
        const {id} = req.params;
        try{
            const {data, error} = await supabase.auth.admin.getUserById(id);

            if (error) throw error;
            if (!data) return res.status(404).json({error: "User not found"});

            console.log("data", data);

            res.status(200).json({
                message: "User details fetched successfully",
                data,
            });
        }catch (error){
            res.status(400).json({error: error.message});
        }
    },
};  

module.exports = authController;
