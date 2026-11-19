const Product = require('../models/Product');

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getAnalytics = async (req, res) => {
  try {
    const { category } = req.query;

    // Optional filter: ?category=electronics
    const matchStage = category
      ? { category: { $regex: `^${escapeRegex(category)}$`, $options: 'i' } }
      : {};

    const [result] = await Product.aggregate([
      { $match: matchStage },
      {
        $facet: {
          // Widget 1: 10 products with the lowest stock
          restockPriority: [
            { $sort: { stockQuantity: 1 } },
            { $limit: 10 },
            {
              $project: {
                _id: 0,
                productName: 1,
                sku: 1,
                category: 1,
                stockQuantity: 1,
                reorderLevel: 1,
              },
            },
          ],

          // Widget 2: inventory value per category
          categoryValuation: [
            {
              $group: {
                _id: '$category',
                totalValuation: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
                productCount: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                category: '$_id',
                productCount: 1,
                totalValuation: { $round: ['$totalValuation', 2] },
              },
            },
            { $sort: { totalValuation: -1 } },
          ],

          // Widget 3: KPI summary cards
          summary: [
            {
              $group: {
                _id: null,
                totalSKUs: { $sum: 1 },
                totalInventoryValue: { $sum: { $multiply: ['$price', '$stockQuantity'] } },
                outOfStockItems: {
                  $sum: { $cond: [{ $eq: ['$stockQuantity', 0] }, 1, 0] },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalSKUs: 1,
                outOfStockItems: 1,
                totalInventoryValue: { $round: ['$totalInventoryValue', 2] },
              },
            },
          ],
        },
      },
    ]);

    res.json({
      summary: result.summary[0] || { totalSKUs: 0, totalInventoryValue: 0, outOfStockItems: 0 },
      categoryValuation: result.categoryValuation,
      restockPriority: result.restockPriority,
    });
  } catch (error) {
    console.error('getAnalytics error:', error.message);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
};

module.exports = { getAnalytics };