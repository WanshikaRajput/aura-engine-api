const dns = require('node:dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
const Product = require('../models/Product');

const TOTAL = 50000;
const BATCH_SIZE = 5000;
const CATEGORIES = ['Electronics', 'Apparel', 'Home & Kitchen', 'Sports', 'Toys', 'Beauty', 'Books', 'Grocery'];

const makeProduct = (i) => {
  const cost = faker.number.int({ min: 5, max: 500 });
  const price = Math.round(cost * faker.number.float({ min: 1.1, max: 2 }) * 100) / 100;
  return {
    productName: faker.commerce.productName(),
    sku: `SKU-${String(i).padStart(6, '0')}`,
    category: faker.helpers.arrayElement(CATEGORIES),
    price,
    cost,
    stockQuantity: faker.number.int({ min: 0, max: 500 }),
    reorderLevel: faker.number.int({ min: 10, max: 50 }),
    lastUpdated: faker.date.recent({ days: 60 }),
  };
};

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected. Clearing old products...');
    await Product.deleteMany({});

    for (let start = 0; start < TOTAL; start += BATCH_SIZE) {
      const batch = [];
      for (let i = start; i < start + BATCH_SIZE; i++) {
        batch.push(makeProduct(i + 1));
      }
      await Product.insertMany(batch);
      console.log(`Inserted ${start + BATCH_SIZE} / ${TOTAL}`);
    }

    await Product.syncIndexes();
    console.log('Done. Indexes created.');
  } catch (error) {
    console.error('Seeding failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
};

seed();