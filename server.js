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

// Detail view
app.get('/coffeeshops/:shopname', (req, res) => {
  const shop = shops.find(s => encodeURIComponent(s.name) === req.params.shopname);
  if (!shop) {
    return res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
  }
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${shop.name} - Local Coffee Shops Guide</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/picocss@1.5.10/dist/pico.min.css">
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
        </div>
      </main>
    </body>
    </html>
  `);
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
