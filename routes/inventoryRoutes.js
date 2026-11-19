const express = require('express');
const { getInventory, createProduct, updateProduct } = require('../controllers/inventoryController');
const validate = require('../middleware/validate');
const { createProductSchema, updateProductSchema } = require('../validators/productSchemas');

const router = express.Router();

router.get('/', getInventory);
router.post('/', validate(createProductSchema), createProduct);
router.put('/:id', validate(updateProductSchema), updateProduct);

module.exports = router;