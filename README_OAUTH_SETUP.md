# Google OAuth Setup Instructions

## Environment Variables Required

Add these environment variables to your backend `.env` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Backend Configuration
BACKEND_URL=https://auth-backend-five-beta.vercel.app

# JWT Secret (for regular authentication)
JWT_SECRET=your_jwt_secret_here
```

## Supabase OAuth Configuration

1. Go to your Supabase dashboard
2. Navigate to Authentication > Providers
3. Enable Google provider
4. Add your Google OAuth credentials (Client ID and Client Secret)
5. Set the redirect URL to: `https://auth-backend-five-beta.vercel.app/api/auth/callback`

## Google OAuth Setup

1. Go to Google Cloud Console
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client IDs
5. Set authorized redirect URIs to: `https://auth-backend-five-beta.vercel.app/api/auth/callback`
6. Copy the Client ID and Client Secret to Supabase

## Installation

Install the required dependency:

```bash
cd auth_backend
npm install @supabase/ssr
```

## How it Works

1. **Frontend sends frontend URL**: When user clicks "Login with Google", frontend sends its URL to backend
2. **Backend generates OAuth URL**: Backend creates Google OAuth URL with callback that includes frontend URL
3. **User authenticates with Google**: Frontend redirects user to Google OAuth
4. **Google redirects back**: To backend callback with authorization code and frontend URL
5. **Backend processes callback**: Exchanges code for session and redirects to frontend with success
6. **Frontend stores user data**: And displays homepage with user information

## Flow Diagram

```
User → Login Page → Google OAuth → Callback → Homepage
  ↓         ↓           ↓           ↓         ↓
Click    API Call    Google     Backend    Success
Button   (with URL)  Login      Process    Redirect
```

## Key Features

- ✅ **Dynamic frontend URL**: No hardcoded URLs in backend
- ✅ **Works in any environment**: Development, staging, production
- ✅ **Automatic URL detection**: Uses `window.location.origin`
- ✅ **Error handling**: Proper error redirects to correct frontend URL

## Testing

1. Start your backend server
2. Start your frontend application
3. Navigate to login page
4. Click "Login with Google"
5. Complete Google OAuth flow
6. Should redirect to homepage with user information

## Frontend Integration

The frontend automatically sends its URL to the backend:

```javascript
const response = await axios.post('/api/auth/google/initiate', {
  frontendUrl: window.location.origin
});
```

This ensures the backend always redirects to the correct frontend URL, regardless of the environment (localhost:3000, production domain, etc.). 