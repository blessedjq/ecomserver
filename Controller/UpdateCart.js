import { Cart } from "../Schema/CartSchema";

export const UpdateCart = async (req, res) => {
    const { productId, quantity } = req.body;
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) cart = new Cart({ user: req.user.id, items: [] });
    const idx = cart.items.findIndex(i => i.product.toString() === productId);
    if (idx > -1) cart.items[idx].quantity = quantity;
    else cart.items.push({ product: productId, quantity });
    await cart.save();
    res.json(await cart.populate('items.product'));
}
