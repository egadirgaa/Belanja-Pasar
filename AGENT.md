# Catatan Agen

## Keputusan teknis

- Aplikasi dibuat dengan HTML, CSS, dan JavaScript murni agar cocok untuk GitHub Pages tanpa build step dan tanpa backend.
- CSS dan JavaScript dipisahkan ke `style.css` dan `script.js` agar struktur lebih mudah dibaca dan dirawat.
- Data produk diambil dari Google Sheets CSV publik melalui `fetch(CSV_URL)`.
- URL Google Sheets publik saat ini memakai format CSV: `https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`.
- Jika CSV gagal dimuat, aplikasi otomatis memakai data contoh lokal. Ini membuat halaman tetap bisa dites saat koneksi atau publish sheet bermasalah.
- Keranjang disimpan di `localStorage` agar pilihan tidak hilang saat halaman tidak sengaja tertutup atau di-refresh.
- Link WhatsApp memakai `https://wa.me/?text=...`, sehingga pengguna bisa memilih kontak sendiri tanpa API berbayar.
- Desain dibuat mobile-first dengan tombol besar, input sederhana, filter kategori, pencarian, ringkasan total bawah layar, dan keranjang dalam modal.

## Struktur file

- `index.html`
  - Markup aplikasi utama.
  - Memuat `style.css` dan `script.js`.
- `style.css`
  - CSS responsif mobile-first untuk layout, kartu produk, modal keranjang, dan ringkasan total bawah layar.
- `script.js`
  - JavaScript untuk memuat CSV, render produk, mengelola keranjang, membuat teks belanja, dan membuka WhatsApp.
- `AGENT.md`
  - Catatan keputusan teknis dan panduan pengembangan berikutnya.

## Fungsi penting di `script.js`

- `loadProducts()`: mengambil CSV dari Google Sheets, lalu fallback ke data dummy jika gagal.
- `parseCsv(text)`: membaca CSV dengan header `nama, harga, satuan, kategori`.
- `renderProducts()`: menampilkan daftar produk sesuai pencarian dan kategori aktif.
- `addToCart(productId)`: menambahkan produk ke keranjang dengan jumlah dari input.
- `updateCartQty(productName, qty)`: mengubah jumlah barang atau menghapus jika jumlah kosong/nol.
- `createMessage()`: membuat teks belanja otomatis yang dikelompokkan per kategori untuk disalin atau dikirim ke WhatsApp.
- `renderCart()`: menampilkan item keranjang, total, teks belanja, dan link WhatsApp terbaru.
- `openCartModal()` / `closeCartModal()`: membuka dan menutup modal keranjang.

## Hal yang perlu diingat

- Jika sumber Google Sheets berubah, ganti nilai `CSV_URL` di `script.js` dan gunakan format `/pub?output=csv`, bukan `/pubhtml`.
- Pastikan Google Sheets dipublikasikan dan kolomnya tetap persis: `nama, harga, satuan, kategori`.
- Kolom `harga` sebaiknya angka polos seperti `25000`, tetapi parser juga masih menerima format seperti `Rp 25.000`.
- Karena GitHub Pages static only, tidak ada stok real-time, login, pembayaran, atau penyimpanan order di server.
- Link WhatsApp saat ini tidak mengunci nomor tujuan. Jika ingin langsung ke nomor kakak, ubah menjadi `https://wa.me/62NOMOR?text=...`.

## Potensi improvement berikutnya

- Tambahkan nomor WhatsApp tetap lewat konstanta, supaya tombol langsung membuka chat penjual.
- Tambahkan catatan pesanan, nama pembeli, alamat, dan pilihan waktu antar.
- Tambahkan badge produk habis jika nanti sheet punya kolom stok/status.
- Tambahkan gambar produk bila Google Sheets punya kolom `gambar`.
- Tambahkan tombol cepat jumlah seperti `0.5`, `1`, dan `2` untuk barang kiloan.
