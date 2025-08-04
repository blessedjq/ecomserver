import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    mobile: {
        type: String,
        unique: true
    },
    isMobileVerified: {
        type: Boolean,
        default: false
    },
    mobileOTP: {
        type: String
    },
    googleId: {
        type: String
    }
},
    { timestamps: true }
);

userSchema.pre("save", async function (next) {
    if (this.password && this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

userSchema.methods.matchPassword = function (entered) {
    return bcrypt.compare(entered, this.password);
};

export const User = new userSchema.model("user", userSchema);
