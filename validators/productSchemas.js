const { z } = require('zod');

const baseProduct = z.object({
  productName: z.string().trim().min(1, 'productName is required'),
  sku: z.string().trim().min(1, 'sku is required'),
  category: z.string().trim().min(1, 'category is required'),
  price: z.number({ error: 'price must be a number' }).min(0, 'price cannot be negative'),
  cost: z.number({ error: 'cost must be a number' }).min(0, 'cost cannot be negative'),
  stockQuantity: z
    .number({ error: 'stockQuantity must be a number' })
    .int('stockQuantity must be a whole number')
    .min(0, 'stockQuantity cannot be negative'),
  reorderLevel: z.number().int().min(0, 'reorderLevel cannot be negative'),
});

const createProductSchema = baseProduct.refine((data) => data.price >= data.cost, {
  message: 'price cannot be lower than cost',
  path: ['price'],
});

const updateProductSchema = baseProduct.partial().refine(
  (data) => data.price === undefined || data.cost === undefined || data.price >= data.cost,
  { message: 'price cannot be lower than cost', path: ['price'] }
);

module.exports = { createProductSchema, updateProductSchema };