// Fetch and display coffee shops
fetch('/coffeeshops')
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById('shop-list');
    list.innerHTML = data.map(shop => `
      <a href="/coffeeshops/${encodeURIComponent(shop.name)}" class="card">
        <img src="${shop.image}" alt="${shop.name}">
        <h2>${shop.name}</h2>
        <p><strong>Specialty:</strong> ${shop.specialty}</p>
        <p><strong>Price Range:</strong> ${shop.priceRange}</p>
      </a>
    `).join('');
  });
