const db = require('./database');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  try {
    console.log('Setting up database...');

    // Create coffee_shops table
    const createCoffeeShopsTable = `
      CREATE TABLE IF NOT EXISTS coffee_shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(255) NOT NULL,
        specialty VARCHAR(255),
        price_range VARCHAR(10),
        hours VARCHAR(100),
        image VARCHAR(500),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create reviews table
    const createReviewsTable = `
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        coffee_shop_id INTEGER REFERENCES coffee_shops(id) ON DELETE CASCADE,
        author VARCHAR(255) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await db.query(createCoffeeShopsTable);
    console.log('Coffee shops table created successfully');

    await db.query(createReviewsTable);
    console.log('Reviews table created successfully');

    // Check if data already exists
    const existingData = await db.query('SELECT COUNT(*) FROM coffee_shops');
    if (parseInt(existingData.rows[0].count) > 0) {
      console.log('Database already contains data. Skipping seed data insertion.');
      return;
    }

    // Load and insert seed data
    const dataPath = path.join(__dirname, 'data', 'coffeeshops.json');
    const coffeeShopsData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log('Inserting seed data...');

    for (const shop of coffeeShopsData) {
      // Insert coffee shop
      const insertShopQuery = `
        INSERT INTO coffee_shops (name, address, specialty, price_range, hours, image, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
      
      const shopValues = [
        shop.name,
        shop.address,
        shop.specialty,
        shop.priceRange,
        shop.hours,
        shop.image,
        shop.lat,
        shop.lng
      ];

      const shopResult = await db.query(insertShopQuery, shopValues);
      const shopId = shopResult.rows[0].id;

      // Insert reviews for this shop
      if (shop.reviews && shop.reviews.length > 0) {
        for (const review of shop.reviews) {
          const insertReviewQuery = `
            INSERT INTO reviews (coffee_shop_id, author, text)
            VALUES ($1, $2, $3);
          `;
          
          const reviewValues = [shopId, review.author, review.text];
          await db.query(insertReviewQuery, reviewValues);
        }
      }

      console.log(`Inserted: ${shop.name}`);
    }

    console.log('Database setup completed successfully!');
    console.log(`Inserted ${coffeeShopsData.length} coffee shops with reviews.`);

  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    // Close the database connection
    await db.pool.end();
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
