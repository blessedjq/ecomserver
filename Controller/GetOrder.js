import { Order } from "../Schema/OrderSchema";

export const GetOrder = async (req, res) => {
    const orders = await Order.find({ user: req.user.id }).populate('items.product');
    res.json(orders);
}
