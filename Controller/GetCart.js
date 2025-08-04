import { Cart } from "../Schema/CartSchema.js";

export const GetCart = async (req, res) => {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    res.json(cart || { items: [] });
}
