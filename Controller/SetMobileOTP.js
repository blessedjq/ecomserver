import { User } from "../Schema/UserSchema";

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// For Google users, set mobile and send OTP:
export const SetMobileOTP = async (req, res) => {
    // Only for already Google-authenticated user without isMobileVerified
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isMobileVerified) return res.json({ message: "Mobile already verified" });
    // Require unique mobile!
    if (await User.findOne({ mobile: req.body.mobile })) return res.status(400).json({ message: "Mobile already used" });
    const otp = generateOTP();
    // await sendSMS(req.body.mobile, `Your OTP is ${otp}`);
    user.mobile = req.body.mobile; user.mobileOTP = otp;
    await user.save();
    res.json({ message: "OTP sent to mobile", demo_otp: otp });
}
