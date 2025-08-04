import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    image: String,
    stock: {
        type: Number,
        default: 0
    },
    category: String
});

export const Product = mongoose.model('product', productSchema);
