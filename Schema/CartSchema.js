import mongoose from 'mongoose'
import { CartItemSchema } from './CartItemSchema';

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user', unique: true
    },
    items: [CartItemSchema]
});

export const Cart = mongoose.model('cart', cartSchema);
