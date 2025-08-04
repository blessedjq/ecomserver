import { User } from "../Schema/UserSchema.js";

export const VerifyMobile = async (req, res) => {
    const { userId, otp } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isMobileVerified) return res.json({ message: "Mobile already verified" });
    if (user.mobileOTP !== otp) return res.status(400).json({ message: "Wrong OTP" });
    user.isMobileVerified = true;
    user.mobileOTP = undefined;
    await user.save();
    res.json({ message: "Mobile verified. You can now login and purchase." });
}
