import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (token) => {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return {
      success: true,
      data: {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      }
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    return {
      success: false,
      error: 'Invalid Google token'
    };
  }
};
