import { Cart } from "../Schema/CartSchema";

export const RemoveCartItem = async (req, res) => {
    let cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
        cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
        await cart.save();
    }
    res.json({ OK: true });
};
