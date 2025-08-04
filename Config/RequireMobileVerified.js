import { User } from '../Schema/UserSchema.js'

export const RequireMobileVerified = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isMobileVerified)
        return res.status(403).json({ message: "Mobile verification required" });
    req.user = user;
    next();
};
