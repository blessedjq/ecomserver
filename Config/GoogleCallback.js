import jwt from 'jsonwebtoken';

export const GoogleCallback = async (req, res) => {
    // After Google login, check if mobile verified
    if (!req.user.isMobileVerified) {
        // On frontend, ask mobile, then call /api/users/set-mobile-otp with JWT
        const token = jwt.sign({ id: req.user._id, username: req.user.username }, process.env.JWT_SECRET, { expiresIn: "6h" });
        // You could redirect to a special page that asks for mobile and does OTP
        res.json({
            requireMobile: true,
            token,
            userId: req.user._id,
            username: req.user.username,
            email: req.user.email
        });
    } else {
        // login complete
        const token = jwt.sign({ id: req.user._id, username: req.user.username }, process.env.JWT_SECRET, { expiresIn: "6h" });
        res.json({
            requireMobile: false,
            token,
            userId: req.user._id,
            username: req.user.username,
            email: req.user.email
        });
    }
}
