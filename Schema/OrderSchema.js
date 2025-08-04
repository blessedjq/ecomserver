import mongoose from 'mongoose'

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "product"
        },
        quantity: Number,
        priceAtPurchase: Number,
    }],
    totalPrice: Number,
    status: {
        type: String,
        enum: ["Pending", "Processing", "Shipped", "Delivered"],
        default: "Pending"
    },
    deliveryAddress: String,
},
    { timestamps: true }
);

export const Order = mongoose.model('order', orderSchema);
