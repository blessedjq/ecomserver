const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// const twilio = require('twilio');
// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:8080", credentials: true }));

// ------------ SCHEMAS + MODELS -----------

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  email:    { type: String, unique: true },
  password: { type: String },
  mobile:   { type: String, unique: true },
  isMobileVerified: { type: Boolean, default: false },
  mobileOTP: String,          // For demo: store as plaintext (don't do this in prod!)
  googleId: String,           // For Google OAuth users
  createdAt: { type: Date, default: Date.now }
});
userSchema.pre("save", async function(next){
  if (this.password && this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
userSchema.methods.matchPassword = function(entered) {
  return bcrypt.compare(entered, this.password);
};
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name: String, description: String, price: Number, image: String,
  stock: { type: Number, default: 0 }, category: String
});
const Product = mongoose.model('Product', productSchema);

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, default: 1 }
});
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
  items: [cartItemSchema]
});
const Cart = mongoose.model('Cart', cartSchema);

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    quantity: Number,
    priceAtPurchase: Number,
  }],
  totalPrice: Number,
  status: { type: String, enum: ["Pending", "Processing", "Shipped", "Delivered"], default: "Pending" },
  deliveryAddress: String,
  createdAt: { type: Date, default: Date.now },
});
const Order = mongoose.model('Order', orderSchema);

// ------------ AUTH MIDDLEWARE ------------

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};
const requireMobileVerified = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(401).json({ message: "User not found" });
  if (!user.isMobileVerified)
    return res.status(403).json({ message: "Mobile verification required" });
  req.user = user;
  next();
};

// ------------ PASSPORT GOOGLE OAUTH ------------

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  process.env.GOOGLE_CALLBACK_URL
},
async (accessToken, refreshToken, profile, cb) => {
  let user = await User.findOne({ googleId: profile.id });
  if (!user) {
    // New user: save email, username as Google displayName, require mobile later!
    user = await User.create({
      username: profile.displayName,
      email: profile.emails?.[0]?.value,
      googleId: profile.id,
      isMobileVerified: false
    });
  }
  return cb(null, user);
}
));
app.use(passport.initialize());

// ------------ ROUTES ------------

// PRODUCTS = public
app.get('/api/products', async (req, res) => {
  res.json(await Product.find());
});

// --------- USER LOCAL SIGNUP (mail/password + mobile, send OTP) ---------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
app.post('/api/users/register',
  body("username").notEmpty(),
  body("email").isEmail(),
  body("password").isLength({ min: 6 }),
  body("mobile").notEmpty(),
  async (req, res) => {
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { username, email, password, mobile } = req.body;
    try {
      // Check unique constraints
      if (await User.findOne({ email }))   return res.status(400).json({ message: "Email already registered" });
      if (await User.findOne({ username }))return res.status(400).json({ message: "Username taken" });
      if (await User.findOne({ mobile }))  return res.status(400).json({ message: "Mobile already used" });
      // Create user with isMobileVerified=false, generate OTP:
      const mobileOTP = generateOTP();
      // await sendSMS(mobile, `Your OTP is ${mobileOTP}`); // Implement for real (with Twilio, etc.)
      const user = await User.create({ username, email, password, mobile, isMobileVerified: false, mobileOTP });
      res.json({ message: "Registered. OTP sent to phone.", userId: user._id, demo_otp: mobileOTP });
    } catch(e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// --------- USER LOCAL MOBILE OTP VERIFICATION ---------
app.post('/api/users/verify-mobile', body("userId").notEmpty(), body("otp").notEmpty(), async (req, res) => {
  const { userId, otp } = req.body;
  const user = await User.findById(userId);
  if (!user) return res.status(400).json({ message: "User not found" });
  if (user.isMobileVerified) return res.json({ message: "Mobile already verified"});
  if (user.mobileOTP !== otp) return res.status(400).json({ message: "Wrong OTP" });
  user.isMobileVerified = true;
  user.mobileOTP = undefined;
  await user.save();
  res.json({ message: "Mobile verified. You can now login and purchase." });
});

// --------- USER LOCAL LOGIN (must be mobile verified) ---------
app.post('/api/users/login',
  body("email").isEmail(),
  body("password").exists(),
  async (req, res) => {
    const errors = validationResult(req); if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(400).json({ message: "Invalid email or password" });
    if (!user.isMobileVerified) return res.status(403).json({ message: "Mobile not verified"});
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: "6h" });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  }
);

// --------- GOOGLE OAUTH routes -----------
// 1. Redirect to Google for login
app.get('/api/users/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// 2. Google callback
app.get('/api/users/auth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/' }),
  async (req, res) => {
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
);

// For Google users, set mobile and send OTP:
app.post('/api/users/set-mobile-otp', auth, body("mobile").notEmpty(), async (req, res) => {
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
});
// OTP verification for Google users (logged in)
app.post('/api/users/google-verify-mobile', auth, body("otp").notEmpty(), async (req, res) => {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.isMobileVerified) return res.json({ message: "Mobile already verified" });
    if (user.mobileOTP !== req.body.otp) return res.status(400).json({ message: "Wrong OTP" });
    user.isMobileVerified = true; user.mobileOTP = undefined; await user.save();
    res.json({ message: "Mobile verified. You can now purchase." });
});

// ----------- CART and ORDER ENDPOINTS (must be auth’d AND mobile verified)-----------

// Get cart
app.get('/api/cart', auth, requireMobileVerified, async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
  res.json(cart || { items: [] });
});
// Add/update cart
app.post('/api/cart', auth, requireMobileVerified, async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user.id });
  if (!cart) cart = new Cart({ user: req.user.id, items: [] });
  const idx = cart.items.findIndex(i => i.product.toString() === productId);
  if (idx > -1) cart.items[idx].quantity = quantity;
  else cart.items.push({ product: productId, quantity });
  await cart.save();
  res.json(await cart.populate('items.product'));
});
// Remove item
app.delete('/api/cart/:productId', auth, requireMobileVerified, async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id });
  if (cart) {
    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
  }
  res.json({ OK: true });
});
// Checkout (create order)
app.post('/api/orders', auth, requireMobileVerified, async (req, res) => {
  const { items, deliveryAddress } = req.body;
  let total = 0; const orderItems = [];
  for (const i of items) {
    const prod = await Product.findById(i.product);
    if (!prod) return res.status(400).json({ message: "Product not found" });
    orderItems.push({ product: i.product, quantity: i.quantity, priceAtPurchase: prod.price });
    total += prod.price * i.quantity;
  }
  const order = new Order({ user: req.user.id, items: orderItems, totalPrice: total, deliveryAddress });
  await order.save();
  res.json(order);
});
app.get('/api/orders', auth, requireMobileVerified, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('items.product');
  res.json(orders);
});

// ----------- DB AND SERVER STARTUP -----------

mongoose.connect(process.env.MONGO_URI).then(() => console.log('MongoDB connected')).catch(e => console.error(e));
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });

/* // Twilio example: fill in your Twilio API details and uncomment.
async function sendSMS(to, text) {
  return twilioClient.messages.create({ body: text, from: process.env.TWILIO_PHONE, to });
}
*/
