import { Product } from '../Schema/ProductSchema'

export const GetProducts = async (req, res) => {
    res.json(await Product.find());
};
