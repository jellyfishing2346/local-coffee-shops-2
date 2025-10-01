const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from client directory
app.use(express.static(path.join(__dirname, '../client/src')));

// Import routes
const coffeeShopsRoutes = require('./routes/coffeeshops');

// API routes
app.use('/api/coffeeshops', coffeeShopsRoutes);

let submittedReviews = {};

// Detail view - Updated to work with database
app.get('/coffeeshops/:shopname', async (req, res) => {
  try {
    const shopName = decodeURIComponent(req.params.shopname);
    
    // Get shop data from database
    const db = require('./config/database');
    
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
      return res.status(404).sendFile(path.join(__dirname, '../client/src/404.html'));
    }

    const shop = result.rows[0];
    
    // Merge static and submitted reviews
    const dbReviews = shop.reviews || [];
    const submittedShopReviews = submittedReviews[shopName] || [];
    const allReviews = [...dbReviews, ...submittedShopReviews];
    
    const reviewsHtml = allReviews.length ? `
      <section>
        <h2>Reviews</h2>
        <ul>
          ${allReviews.map(r => `<li><strong>${r.author}:</strong> ${r.text}</li>`).join('')}
        </ul>
      </section>
    ` : '';
    
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${shop.name} - Local Coffee Shops Guide</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@1.5.10/css/pico.min.css">
        <link rel="stylesheet" href="/css/style.css">
      </head>
      <body>
        <main class="container">
          <a href="/">&larr; Back to list</a>
          <div class="card">
            <img src="${shop.image}" alt="${shop.name}">
            <h1>${shop.name}</h1>
            <p><strong>Address:</strong> ${shop.address}</p>
            <p><strong>Specialty:</strong> ${shop.specialty}</p>
            <p><strong>Price Range:</strong> ${shop.price_range}</p>
            <p><strong>Hours:</strong> ${shop.hours}</p>
            ${reviewsHtml}
          </div>
          <section>
            <h2>Add a Review</h2>
            <form action="/coffeeshops/${encodeURIComponent(shop.name)}/review" method="POST">
              <input type="text" name="author" placeholder="Your name" required>
              <textarea name="text" placeholder="Your review" required></textarea>
              <button type="submit">Submit Review</button>
            </form>
          </section>
        </main>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error fetching coffee shop details:', error);
    res.status(500).send('Internal server error');
  }
});

// Handle review submission
app.post('/coffeeshops/:shopname/review', (req, res) => {
  const shopName = decodeURIComponent(req.params.shopname);
  if (!submittedReviews[shopName]) submittedReviews[shopName] = [];
  submittedReviews[shopName].push({ author: req.body.author, text: req.body.text });
  res.redirect(`/coffeeshops/${encodeURIComponent(shopName)}`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../client/src/404.html'));
});

// Initialize database and start server
async function startServer() {
  try {
    // Only set up database if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      console.log('Setting up database...');
      const setupDatabase = require('./config/setup-database');
      await setupDatabase();
    } else {
      console.log('No DATABASE_URL found, skipping database setup');
    }
  } catch (error) {
    console.error('Database setup failed:', error.message);
    console.log('Server will start anyway, database setup will be retried on first request');
  }
  
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
