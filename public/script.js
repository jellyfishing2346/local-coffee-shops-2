// Initialize an empty array to store coffee shop data
let shopsData = [];

// Function to render coffee shops on the page
function renderShops(shops) {
  const list = document.getElementById('shop-list');
  list.innerHTML = shops.map(shop => `
    <a href="/coffeeshops/${encodeURIComponent(shop.name)}" class="card">
      <img src="${shop.image}" alt="${shop.name}">
      <h2>${shop.name}</h2>
      <p><strong>Specialty:</strong> ${shop.specialty}</p>
      <p><strong>Price Range:</strong> ${shop.priceRange}</p>
    </a>
  `).join('');
}

// Fetch coffee shop data from the server
fetch('/coffeeshops')
  .then(res => res.json())
  .then(data => {
    shopsData = data; // Store the data in the shopsData variable
    renderShops(shopsData); // Render the shops on the page
  });

// Event listener for the search form submission
document.getElementById('searchForm').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the default form submission
  const search = document.getElementById('searchInput').value.toLowerCase(); // Get the search input
  const price = document.getElementById('priceFilter').value; // Get the selected price range
  const filtered = shopsData.filter(shop => {
    const specialtyMatch = shop.specialty.toLowerCase().includes(search); // Check if specialty matches the search
    const priceMatch = price ? shop.priceRange === price : true; // Check if price range matches
    return specialtyMatch && priceMatch; // Return true if both match
  });
  renderShops(filtered); // Render the filtered shops
});
