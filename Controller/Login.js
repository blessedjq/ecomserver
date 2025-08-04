import { User } from "../Schema/UserSchema.js";

export const Login = async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
        return res.status(400).json({ message: "Invalid email or password" });
    if (!user.isMobileVerified) return res.status(403).json({ message: "Mobile not verified" });
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "6h" });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
}
