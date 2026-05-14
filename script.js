const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTJ1zz32qvO7pf67zqyBphtmXaIOMJW9D78vmXI3DUNHgeVYIzroQyrrKhBM6x5FptcR_xjXpB34tx8/pub?output=csv';

    const fallbackProducts = [
      { nama: 'Ikan Bandeng', harga: 25000, satuan: 'kg', kategori: 'Ikan' },
      { nama: 'Ikan Lele', harga: 22000, satuan: 'kg', kategori: 'Ikan' },
      { nama: 'Telur Ayam', harga: 28000, satuan: 'kg', kategori: 'Telur' },
      { nama: 'Ayam Potong', harga: 38000, satuan: 'kg', kategori: 'Daging' },
      { nama: 'Bayam', harga: 5000, satuan: 'ikat', kategori: 'Sayur' },
      { nama: 'Kangkung', harga: 5000, satuan: 'ikat', kategori: 'Sayur' },
      { nama: 'Cabai Merah', harga: 45000, satuan: 'kg', kategori: 'Bumbu' },
      { nama: 'Bawang Merah', harga: 36000, satuan: 'kg', kategori: 'Bumbu' },
      { nama: 'Tempe', harga: 6000, satuan: 'papan', kategori: 'Lauk' },
      { nama: 'Tahu Putih', harga: 8000, satuan: 'bungkus', kategori: 'Lauk' }
    ];

    const state = {
      products: [],
      cart: loadCart(),
      activeCategory: 'Semua',
      query: ''
    };

    const productList = document.querySelector('#productList');
    const categoryRow = document.querySelector('#categoryRow');
    const statusBox = document.querySelector('#statusBox');
    const searchInput = document.querySelector('#searchInput');
    const cartItems = document.querySelector('#cartItems');
    const cartTotal = document.querySelector('#cartTotal');
    const cartPill = document.querySelector('#cartPill');
    const cartPillCount = document.querySelector('#cartPillCount');
    const messageBox = document.querySelector('#messageBox');
    const whatsAppButton = document.querySelector('#whatsAppButton');
    const copyButton = document.querySelector('#copyButton');
    const clearButton = document.querySelector('#clearButton');
    const jumpCart = document.querySelector('#jumpCart');
    const cartPanel = document.querySelector('#cartPanel');
    const cartBackdrop = document.querySelector('#cartBackdrop');
    const closeCartButton = document.querySelector('#closeCartButton');
    const bottomCount = document.querySelector('#bottomCount');
    const bottomTotal = document.querySelector('#bottomTotal');

    const formatRupiah = new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    });

    function normalizePrice(value) {
      const cleaned = String(value || '').replace(/[^\d]/g, '');
      return Number(cleaned || 0);
    }

    function money(value) {
      return formatRupiah.format(value).replace(/\u00a0/g, ' ');
    }

    function slug(value) {
      return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char]);
    }

    function loadCart() {
      try {
        return JSON.parse(localStorage.getItem('belanjaPasarCart')) || [];
      } catch (error) {
        return [];
      }
    }

    function saveCart() {
      localStorage.setItem('belanjaPasarCart', JSON.stringify(state.cart));
    }

    function parseCsv(text) {
      const rows = [];
      let row = [];
      let cell = '';
      let quoted = false;

      for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        const next = text[index + 1];

        if (char === '"' && quoted && next === '"') {
          cell += '"';
          index += 1;
        } else if (char === '"') {
          quoted = !quoted;
        } else if (char === ',' && !quoted) {
          row.push(cell.trim());
          cell = '';
        } else if ((char === '\n' || char === '\r') && !quoted) {
          if (char === '\r' && next === '\n') index += 1;
          row.push(cell.trim());
          if (row.some(Boolean)) rows.push(row);
          row = [];
          cell = '';
        } else {
          cell += char;
        }
      }

      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);

      const headers = rows.shift()?.map((item) => item.toLowerCase()) || [];
      return rows.map((values) => {
        const item = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
        return {
          nama: item.nama,
          harga: normalizePrice(item.harga),
          satuan: item.satuan,
          kategori: item.kategori || 'Lainnya'
        };
      }).filter((item) => item.nama && item.harga > 0 && item.satuan);
    }

    async function loadProducts() {
      try {
        const response = await fetch(CSV_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('CSV tidak bisa dimuat');
        const products = parseCsv(await response.text());
        if (!products.length) throw new Error('CSV kosong');
        state.products = products.map((product, index) => ({ ...product, id: String(index) }));
        statusBox.textContent = 'Data produk dari Google Sheets berhasil dimuat.';
      } catch (error) {
        state.products = fallbackProducts.map((product, index) => ({ ...product, id: String(index) }));
        statusBox.textContent = 'Memakai data contoh karena Google Sheets belum bisa dimuat.';
      }

      renderAll();
    }

    function getCategories() {
      return ['Semua', ...new Set(state.products.map((item) => item.kategori))];
    }

    function getFilteredProducts() {
      const query = state.query.trim().toLowerCase();
      return state.products.filter((item) => {
        const matchCategory = state.activeCategory === 'Semua' || item.kategori === state.activeCategory;
        const matchQuery = !query || `${item.nama} ${item.kategori}`.toLowerCase().includes(query);
        return matchCategory && matchQuery;
      });
    }

    function renderCategories() {
      categoryRow.innerHTML = getCategories().map((category) => `
        <button class="chip ${category === state.activeCategory ? 'active' : ''}" type="button" data-category="${escapeHtml(category)}">
          ${escapeHtml(category)}
        </button>
      `).join('');
    }

    function renderProducts() {
      const products = getFilteredProducts();

      if (!products.length) {
        productList.innerHTML = '<div class="empty">Produk tidak ditemukan.</div>';
        return;
      }

      productList.innerHTML = products.map((product) => {
        const id = slug(product.nama);
        return `
          <article class="product-card">
            <div class="product-main">
              <div>
                <h2 class="product-name">${escapeHtml(product.nama)}</h2>
                <span class="product-category">${escapeHtml(product.kategori)}</span>
              </div>
              <div class="price">
                ${money(product.harga)}
                <small>per ${product.satuan}</small>
              </div>
            </div>
            <div class="buy-row">
              <input class="qty-input" id="qty-${id}" type="number" min="0.1" step="0.1" value="1" inputmode="decimal" aria-label="Jumlah ${escapeHtml(product.nama)}">
              <button class="add-btn" type="button" data-add="${product.id}">Tambah</button>
            </div>
          </article>
        `;
      }).join('');
    }

    function addToCart(productId) {
      const product = state.products.find((item) => item.id === productId);
      const input = document.querySelector(`#qty-${slug(product?.nama || '')}`);
      const qty = Number(input?.value || 1);

      if (!product || !Number.isFinite(qty) || qty <= 0) return;

      const existing = state.cart.find((item) => item.nama === product.nama);
      if (existing) {
        existing.jumlah = Number((existing.jumlah + qty).toFixed(2));
      } else {
        state.cart.push({ ...product, jumlah: qty });
      }

      saveCart();
      renderCart();
    }

    function updateCartQty(productName, qty) {
      const item = state.cart.find((entry) => entry.nama === productName);
      if (!item) return;

      if (!Number.isFinite(qty) || qty <= 0) {
        state.cart = state.cart.filter((entry) => entry.nama !== productName);
      } else {
        item.jumlah = Number(qty.toFixed(2));
      }

      saveCart();
      renderCart();
    }

    function getItemTotal(item) {
      return item.harga * item.jumlah;
    }

    function getCartTotal() {
      return state.cart.reduce((sum, item) => sum + getItemTotal(item), 0);
    }

    function formatQty(item) {
      return `${Number(item.jumlah.toFixed(2))} ${item.satuan}`;
    }

    function createMessage() {
      if (!state.cart.length) return 'Keranjang masih kosong.';

      const groupedItems = state.cart.reduce((groups, item) => {
        const category = item.kategori || 'Lainnya';
        if (!groups[category]) groups[category] = [];
        groups[category].push(item);
        return groups;
      }, {});

      const lines = Object.entries(groupedItems).flatMap(([category, items]) => {
        const itemLines = items.map((item) => {
          return `- ${item.nama} ${formatQty(item)} - ${money(getItemTotal(item))}`;
        });
        return [`${category}:`, ...itemLines, ''];
      });

      if (lines[lines.length - 1] === '') lines.pop();
      lines.push(`Total: ${money(getCartTotal())}`);
      return lines.join('\n');
    }

    function renderCart() {
      if (!state.cart.length) {
        cartItems.innerHTML = '<div class="empty">Belum ada barang di keranjang.</div>';
      } else {
        cartItems.innerHTML = state.cart.map((item) => `
          <div class="cart-item">
            <div>
              <strong>${escapeHtml(item.nama)}</strong>
              <span>${formatQty(item)} x ${money(item.harga)} = ${money(getItemTotal(item))}</span>
            </div>
            <div class="cart-actions">
              <input class="mini-input" type="number" min="0" step="0.1" value="${item.jumlah}" inputmode="decimal" data-qty="${escapeHtml(item.nama)}" aria-label="Ubah jumlah ${escapeHtml(item.nama)}">
              <button class="remove-btn" type="button" data-remove="${escapeHtml(item.nama)}" aria-label="Hapus ${escapeHtml(item.nama)}">x</button>
            </div>
          </div>
        `).join('');
      }

      const total = getCartTotal();
      const count = state.cart.length;
      const message = createMessage();

      cartTotal.textContent = money(total);
      bottomTotal.textContent = money(total);
      bottomCount.textContent = count ? `${count} jenis barang` : 'Keranjang kosong';
      cartPillCount.textContent = count;
      messageBox.textContent = message;
      whatsAppButton.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
      whatsAppButton.classList.toggle('disabled', !count);
    }

    function renderAll() {
      renderCategories();
      renderProducts();
      renderCart();
    }

    function openCartModal() {
      cartPanel.classList.add('is-open');
      cartPanel.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
      closeCartButton.focus();
    }

    function closeCartModal() {
      cartPanel.classList.remove('is-open');
      cartPanel.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');
    }

    categoryRow.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.activeCategory = button.dataset.category;
      renderCategories();
      renderProducts();
    });

    productList.addEventListener('click', (event) => {
      const button = event.target.closest('[data-add]');
      if (button) addToCart(button.dataset.add);
    });

    cartItems.addEventListener('input', (event) => {
      const input = event.target.closest('[data-qty]');
      if (input) updateCartQty(input.dataset.qty, Number(input.value));
    });

    cartItems.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove]');
      if (button) updateCartQty(button.dataset.remove, 0);
    });

    searchInput.addEventListener('input', (event) => {
      state.query = event.target.value;
      renderProducts();
    });

    copyButton.addEventListener('click', async () => {
      await navigator.clipboard.writeText(createMessage());
      copyButton.textContent = 'Tersalin';
      setTimeout(() => {
        copyButton.textContent = 'Salin Teks';
      }, 1200);
    });

    clearButton.addEventListener('click', () => {
      state.cart = [];
      saveCart();
      renderCart();
    });

    jumpCart.addEventListener('click', () => {
      openCartModal();
    });

    cartPill.addEventListener('click', () => {
      openCartModal();
    });

    closeCartButton.addEventListener('click', closeCartModal);

    cartBackdrop.addEventListener('click', closeCartModal);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && cartPanel.classList.contains('is-open')) {
        closeCartModal();
      }
    });

    loadProducts();
