const Product = require('../models/Product');
const mongoose = require('mongoose');
const ALLOWED_SORT_FIELDS = ['price', 'cost', 'stockQuantity', 'productName', 'lastUpdated'];

// Makes user input safe to use inside a regex
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getInventory = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 50, 1), 100);
    const { search, category, sort, minPrice, maxPrice, maxStock } = req.query;

    // Build the filter
    const filter = {};

    if (search) {
      filter.productName = { $regex: escapeRegex(search), $options: 'i' };
    }

    if (category) {
      filter.category = { $regex: `^${escapeRegex(category)}$`, $options: 'i' };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (maxStock) {
      filter.stockQuantity = { $lt: Number(maxStock) };
    }

    // Build the sort (e.g. sort=-price means highest price first)
    let sortOption = { lastUpdated: -1 };
    if (sort) {
      const field = sort.startsWith('-') ? sort.slice(1) : sort;
      if (ALLOWED_SORT_FIELDS.includes(field)) {
        sortOption = { [field]: sort.startsWith('-') ? -1 : 1 };
      }
    }

    const skip = (page - 1) * limit;

    const [products, totalRecords] = await Promise.all([
      Product.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / limit);

    res.json({
      data: products,
      totalRecords,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
    });
  } catch (error) {
    console.error('getInventory error:', error.message);
    res.status(500).json({ message: 'Server error while fetching inventory' });
  }
};
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A product with this sku already exists' });
    }
    console.error('createProduct error:', error.message);
    res.status(500).json({ message: 'Server error while creating product' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid product id' });
    }

    const existing = await Product.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Final check on the merged values (e.g. only price was sent)
    const finalPrice = req.body.price ?? existing.price;
    const finalCost = req.body.cost ?? existing.cost;
    if (finalPrice < finalCost) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: [{ field: 'price', message: 'price cannot be lower than cost' }],
      });
    }

    const updated = await Product.findByIdAndUpdate(
      id,
      { ...req.body, lastUpdated: Date.now() },
      { new: true }
    );
    res.json(updated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A product with this sku already exists' });
    }
    console.error('updateProduct error:', error.message);
    res.status(500).json({ message: 'Server error while updating product' });
  }
};
module.exports = { getInventory, createProduct, updateProduct };