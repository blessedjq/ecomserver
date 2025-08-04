import { User } from "../Schema/UserSchema.js";
import { validationResult } from 'express-validator';

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export const PostUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, email, password, mobile } = req.body;
    try {
        // Check unique constraints
        if (await User.findOne({ email })) return res.status(400).json({ message: "Email already registered" });
        if (await User.findOne({ username })) return res.status(400).json({ message: "Username taken" });
        if (await User.findOne({ mobile })) return res.status(400).json({ message: "Mobile already used" });
        // Create user with isMobileVerified=false, generate OTP:
        const mobileOTP = generateOTP();
        // await sendSMS(mobile, `Your OTP is ${mobileOTP}`); // Implement for real (with Twilio, etc.)
        const user = await User.create({ username, email, password, mobile, isMobileVerified: false, mobileOTP });
        res.json({ message: "Registered. OTP sent to phone.", userId: user._id, demo_otp: mobileOTP });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
}
