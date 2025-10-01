const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all coffee shops
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        cs.*,
        json_agg(
          json_build_object(
            'id', r.id,
            'author', r.author,
            'text', r.text,
            'created_at', r.created_at
          )
        ) FILTER (WHERE r.id IS NOT NULL) as reviews
      FROM coffee_shops cs
      LEFT JOIN reviews r ON cs.id = r.coffee_shop_id
      GROUP BY cs.id
      ORDER BY cs.name;
    `;

    const result = await db.query(query);
    
    // Transform the data to match the original format
    const coffeeShops = result.rows.map(shop => ({
      name: shop.name,
      address: shop.address,
      specialty: shop.specialty,
      priceRange: shop.price_range,
      hours: shop.hours,
      image: shop.image,
      lat: parseFloat(shop.latitude),
      lng: parseFloat(shop.longitude),
      reviews: shop.reviews || []
    }));

    res.json(coffeeShops);
  } catch (error) {
    console.error('Error fetching coffee shops:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific coffee shop by name
router.get('/:shopname', async (req, res) => {
  try {
    const shopName = decodeURIComponent(req.params.shopname);
    
    const query = `
      SELECT 
        cs.*,
        json_agg(
          json_build_object(
            'id', r.id,
            'author', r.author,
            'text', r.text,
            'created_at', r.created_at
          )
        ) FILTER (WHERE r.id IS NOT NULL) as reviews
      FROM coffee_shops cs
      LEFT JOIN reviews r ON cs.id = r.coffee_shop_id
      WHERE cs.name = $1
      GROUP BY cs.id;
    `;

    const result = await db.query(query, [shopName]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Coffee shop not found' });
    }

    const shop = result.rows[0];
    
    // Transform the data to match the original format
    const coffeeShop = {
      name: shop.name,
      address: shop.address,
      specialty: shop.specialty,
      priceRange: shop.price_range,
      hours: shop.hours,
      image: shop.image,
      lat: parseFloat(shop.latitude),
      lng: parseFloat(shop.longitude),
      reviews: shop.reviews || []
    };

    res.json(coffeeShop);
  } catch (error) {
    console.error('Error fetching coffee shop:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new review (stretch feature for later)
router.post('/:shopname/reviews', async (req, res) => {
  try {
    const shopName = decodeURIComponent(req.params.shopname);
    const { author, text } = req.body;

    if (!author || !text) {
      return res.status(400).json({ error: 'Author and text are required' });
    }

    // First, find the coffee shop
    const shopQuery = 'SELECT id FROM coffee_shops WHERE name = $1';
    const shopResult = await db.query(shopQuery, [shopName]);

    if (shopResult.rows.length === 0) {
      return res.status(404).json({ error: 'Coffee shop not found' });
    }

    const shopId = shopResult.rows[0].id;

    // Insert the review
    const insertQuery = `
      INSERT INTO reviews (coffee_shop_id, author, text)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;

    const reviewResult = await db.query(insertQuery, [shopId, author, text]);
    const newReview = reviewResult.rows[0];

    res.status(201).json({
      id: newReview.id,
      author: newReview.author,
      text: newReview.text,
      created_at: newReview.created_at
    });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
