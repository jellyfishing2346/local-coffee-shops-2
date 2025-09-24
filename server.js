const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Load coffee shop data
const shops = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/coffeeshops.json')));

// API endpoint for list
app.get('/coffeeshops', (req, res) => {
  res.json(shops);
});

let submittedReviews = {};

// Detail view
app.get('/coffeeshops/:shopname', (req, res) => {
  const shopName = decodeURIComponent(req.params.shopname);
  const shop = shops.find(s => s.name === shopName);
  if (!shop) {
    return res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
  }
  // Merge static and submitted reviews
  const allReviews = [...(shop.reviews || []), ...(submittedReviews[shopName] || [])];
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
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <main class="container">
        <a href="/">&larr; Back to list</a>
        <div class="card">
          <img src="${shop.image}" alt="${shop.name}">
          <h1>${shop.name}</h1>
          <p><strong>Address:</strong> ${shop.address}</p>
          <p><strong>Specialty:</strong> ${shop.specialty}</p>
          <p><strong>Price Range:</strong> ${shop.priceRange}</p>
          <p><strong>Hours:</strong> ${shop.hours}</p>
          ${reviewsHtml}
          <section>
            <h2>Submit a Review</h2>
            <form method="POST" action="/coffeeshops/${encodeURIComponent(shop.name)}/review">
              <input type="text" name="author" placeholder="Your name" required>
              <textarea name="text" placeholder="Your review" required></textarea>
              <button type="submit">Submit Review</button>
            </form>
          </section>
        </div>
      </main>
    </body>
    </html>
  `);
});

app.use(express.urlencoded({ extended: true }));
app.post('/coffeeshops/:shopname/review', (req, res) => {
  const shopName = decodeURIComponent(req.params.shopname);
  if (!submittedReviews[shopName]) submittedReviews[shopName] = [];
  submittedReviews[shopName].push({ author: req.body.author, text: req.body.text });
  res.redirect(`/coffeeshops/${encodeURIComponent(shopName)}`);
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
