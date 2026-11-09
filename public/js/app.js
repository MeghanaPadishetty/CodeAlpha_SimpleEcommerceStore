let selectedCategory = "All";
async function loadProducts() {
  const grid = document.getElementById("product-grid");
  const search = document.getElementById("search").value.trim();
  grid.innerHTML = '<p class="muted">Loading products...</p>';
  try {
    const products = await API.request(`/api/products?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCategory)}`);
    if (!products.length) { grid.innerHTML = '<div class="empty-state"><h2>No products found</h2><p>Try another search or category.</p></div>'; return; }
    grid.innerHTML = products.map(p => `
      <article class="product-card">
        <a href="/product.html?id=${p.id}" class="product-image"><img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" onerror="this.src='https://placehold.co/600x500/e8eee8/526b58?text=Product'"></a>
        <div class="product-info"><span class="product-category">${escapeHtml(p.category)}</span><h3><a href="/product.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
        <div class="product-bottom"><span class="price">${API.money(p.price)}</span><button class="add-btn" data-id="${p.id}">+ Add</button></div></div>
      </article>`).join("");
    grid.querySelectorAll(".add-btn").forEach(button => button.addEventListener("click", async () => {
      const product = products.find(p => p.id === Number(button.dataset.id));
      API.addToCart(product); button.textContent = "Added ✓"; setTimeout(() => button.textContent = "+ Add", 900);
    }));
  } catch (err) { grid.innerHTML = `<p class="form-message">${escapeHtml(err.message)}</p>`; }
}
document.addEventListener("DOMContentLoaded", () => {
  loadProducts();
  document.getElementById("search").addEventListener("input", loadProducts);
  document.getElementById("categories").addEventListener("click", e => {
    const button = e.target.closest("[data-category]"); if (!button) return;
    selectedCategory = button.dataset.category;
    document.querySelectorAll(".category").forEach(b => b.classList.toggle("active", b === button));
    loadProducts();
  });
});
