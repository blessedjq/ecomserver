import { User } from "../Schema/UserSchema.js";

// OTP verification for Google users (logged in)
export const VerifyGoogle = async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isMobileVerified) return res.json({ message: "Mobile already verified" });
    if (user.mobileOTP !== req.body.otp) return res.status(400).json({ message: "Wrong OTP" });
    user.isMobileVerified = true; user.mobileOTP = undefined; await user.save();
    res.json({ message: "Mobile verified. You can now purchase." });
}
