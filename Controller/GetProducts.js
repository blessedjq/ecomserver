import { Product } from '../Schema/ProductSchema.js'

export const GetProducts = async (req, res) => {
    res.json(await Product.find());
};
