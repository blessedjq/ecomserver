import express from 'express';
import { body } from 'express-validator';
import Passport from 'passport';

import { GetProducts } from '../Controller/GetProducts.js';
import { PostUser } from '../Controller/PostUser.js';
import { VerifyMobile } from '../Controller/VerifyMobile.js';
import { Login } from '../Controller/Login.js';
import { GetCart } from '../Controller/GetCart.js';
import { UpdateCart } from '../Controller/UpdateCart.js';
import { RemoveCartItem } from '../Controller/RemoveCartItem.js';
import { CreateOrder } from '../Controller/CreateOrder.js';
import { SetMobileOTP } from '../Controller/SetMobileOTP.js';

import { Auth } from '../Config/Auth.js';
import { RequireMobileVerified } from '../Config/RequireMobileVerified.js';
import { GoogleCallback } from '../Config/GoogleCallback.js';
import { VerifyGoogle } from '../Controller/VerifyGoogle.js';

const Routes = express.Router();

Routes.get("/products", GetProducts);
Routes.post("/users/register", body("username").notEmpty(), body("email").isEmail(), body("password").isLength({ min: 6 }), body("mobile").notEmpty(), PostUser);
Routes.post("/users/verify-mobile", body("userId").notEmpty(), body("otp").notEmpty(), VerifyMobile);
Routes.post("/users/login", body("email").isEmail(), body("password").exists(), Login);
Routes.get("/cart", Auth, RequireMobileVerified, GetCart);
Routes.post("/cart", Auth, RequireMobileVerified, UpdateCart);
Routes.delete("/cart/:productId", Auth, RequireMobileVerified, RemoveCartItem);
Routes.post("/orders", Auth, RequireMobileVerified, CreateOrder);
Routes.get("/orders", Auth, RequireMobileVerified, GetCart);
Routes.post("/users/set-mobile-otp", Auth, body("mobile").notEmpty(), SetMobileOTP);
Routes.post("/users/google-verify-mobile", Auth, body("otp").notEmpty(), VerifyGoogle)

Routes.get("/users/auth/google", Passport.authenticate('google', { scope: ['profile', 'email'] }));
Routes.get("/users/auth/google/callback", GoogleCallback);

export default Routes;
