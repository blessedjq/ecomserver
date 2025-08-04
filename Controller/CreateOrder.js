import { Order } from "../Schema/OrderSchema";
import { Product } from "../Schema/ProductSchema";

export const CreateOrder = async (req, res) => {
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
}
