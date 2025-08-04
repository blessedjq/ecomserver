import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../Schema/UserSchema.js';
import * as dotenv from 'dotenv';

dotenv.config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, cb) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    user = await User.create({
      username: profile.displayName,
      email: profile.emails?.[0]?.value,
      googleId: profile.id,
      isMobileVerified: false
    });
  }
  return cb(null, user);
}));

export default passport;
