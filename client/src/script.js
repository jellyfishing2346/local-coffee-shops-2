// Initialize an empty array to store coffee shop data
let shopsData = [];
let currentPage = 1;
const pageSize = 4;
let map;
let markers = [];

// Function to render coffee shops on the page
function renderShops(shops) {
  const list = document.getElementById('shop-list');
  const errorMsg = document.getElementById('error-message');
  const pagination = document.getElementById('pagination');
  if (shops.length === 0) {
    list.innerHTML = '';
    errorMsg.style.display = 'block';
    errorMsg.textContent = 'No coffee shops match your search or filter.';
    pagination.innerHTML = '';
    return;
  } else {
    errorMsg.style.display = 'none';
  }
  const totalPages = Math.ceil(shops.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageShops = shops.slice(start, end);
  list.innerHTML = pageShops.map(shop => `
    <a href="/coffeeshops/${encodeURIComponent(shop.name)}" class="card" tabindex="0">
      <img src="${shop.image}" alt="${shop.name} coffee shop image">
      <h2>${shop.name}</h2>
      <p><strong>Specialty:</strong> ${shop.specialty}</p>
      <p><strong>Price Range:</strong> ${shop.priceRange}</p>
    </a>
  `).join('');
  // Pagination controls
  let pagBtns = '';
  for (let i = 1; i <= totalPages; i++) {
    pagBtns += `<button type="button" class="${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  pagination.innerHTML = pagBtns;
  Array.from(pagination.querySelectorAll('button')).forEach(btn => {
    btn.onclick = () => {
      currentPage = Number(btn.getAttribute('data-page'));
      renderShops(shops);
    };
  });
  renderMap(shops);
}

// Function to sort coffee shops based on the selected option
function sortShops(shops, sortBy) {
  if (sortBy === 'name') {
    return [...shops].sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortBy === 'price') {
    const priceOrder = { '$': 1, '$$': 2, '$$$': 3 };
    return [...shops].sort((a, b) => priceOrder[a.priceRange] - priceOrder[b.priceRange]);
  } else if (sortBy === 'specialty') {
    return [...shops].sort((a, b) => a.specialty.localeCompare(b.specialty));
  }
  return shops;
}

// Function to render the map with coffee shop locations
function renderMap(shops) {
  if (!map) {
    map = L.map('map').setView([39.8283, -98.5795], 4); // Center USA
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  }
  // Remove old markers
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  shops.forEach(shop => {
    if (shop.lat && shop.lng) {
      const marker = L.marker([shop.lat, shop.lng]).addTo(map);
      marker.bindPopup(`<strong>${shop.name}</strong><br>${shop.address}`);
      markers.push(marker);
    }
  });
}

// Fetch coffee shop data from the server
fetch('/api/coffeeshops')
  .then(res => {
    console.log('API Response status:', res.status);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log('Fetched coffee shops:', data);
    shopsData = data; // Store the data in the shopsData variable
    renderShops(shopsData); // Render the shops on the page
  })
  .catch(error => {
    console.error('Error loading coffee shops:', error);
    const errorMsg = document.getElementById('error-message');
    if (errorMsg) {
      errorMsg.style.display = 'block';
      errorMsg.textContent = 'Failed to load coffee shops. Please try again later.';
    }
  });

// Event listener for the search form submission
document.getElementById('searchForm').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the default form submission
  currentPage = 1;
  const search = document.getElementById('searchInput').value.toLowerCase(); // Get the search input
  const price = document.getElementById('priceFilter').value; // Get the selected price range
  const sortBy = document.getElementById('sortSelect').value; // Get the selected sort option
  let filtered = shopsData.filter(shop => {
    // Case-insensitive, partial match for name or specialty
    const nameMatch = shop.name.toLowerCase().includes(search);
    const specialtyMatch = shop.specialty.toLowerCase().includes(search);
    const priceMatch = price ? shop.priceRange === price : true;
    return (nameMatch || specialtyMatch) && priceMatch;
  });
  filtered = sortShops(filtered, sortBy); // Sort the filtered shops
  renderShops(filtered); // Render the filtered and sorted shops
});
