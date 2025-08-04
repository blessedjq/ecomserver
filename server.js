import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import * as dotenv from 'dotenv';
import passport from './Config/Passport';

dotenv.config();

const app = express();

app.use(express.json());

app.use(cors({ origin: "http://localhost:8080", credentials: true }));

app.use("/api", routes);

app.use(passport.initialize());

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected')).catch(e => console.error(e));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });

/* // Twilio example: fill in your Twilio API details and uncomment.
async function sendSMS(to, text) {
  return twilioClient.messages.create({ body: text, from: process.env.TWILIO_PHONE, to });
}
*/
// const twilio = require('twilio');
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
