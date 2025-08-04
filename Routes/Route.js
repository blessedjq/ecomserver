import express from 'express';
import { body } from 'express-validator';
import { Passport } from 'passport';

import { GetProducts } from '../Controller/GetProducts';
import { PostUser } from '../Controller/PostUser';
import { VerifyMobile } from '../Controller/VerifyMobile';
import { Login } from '../Controller/Login';
import { GetCart } from '../Controller/GetCart';
import { UpdateCart } from '../Controller/UpdateCart';
import { RemoveCartItem } from '../Controller/RemoveCartItem';
import { CreateOrder } from '../Controller/CreateOrder';
import { SetMobileOTP } from '../Controller/SetMobileOTP';

import { Auth } from '../Config/Auth';
import { RequireMobileVerified } from '../Config/RequireMobileVerified';
import { GoogleCallback } from '../Config/GoogleCallback';
import { VerifyGoogle } from '../Controller/VerifyGoogle';

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
