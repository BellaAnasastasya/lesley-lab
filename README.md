# Lesley Lab L1 — PWA compact

Versi Lesley berdasarkan struktur Gord Lab V11 dan Miya Lab referensi pengguna. **133 profil hero dan dua pola URL gambar hero dipertahankan persis dari Gord Lab**. Tidak menambah hero, tidak membuat direktori `assets/`, dan tidak membundel JPG/PNG/SVG game. Yang diubah adalah katalog item Lesley, logika draft, rekomendasi spell, dan gaya main.

## Cara pakai

1. Upload semua file di folder ini ke hosting **HTTPS** (misalnya GitHub Pages / Netlify), atau gunakan `localhost`. Jangan buka dengan `file://` jika ingin PWA/offline.
2. Pilih sampai 5 musuh dan 4 teman. Build langsung menyesuaikan otomatis. Tekan **Counter dulu** untuk menaikkan prioritas pembelian counter, bukan untuk random reroll.
3. Buka **Simpan gambar untuk offline** lalu tekan **Simpan semua gambar online** saat internet tersedia. Cache disimpan oleh browser dan service worker, bukan folder `assets/`. Jika sumber gambar gagal, tampilkan fallback inisial; coba lagi saat internet tersedia.
4. Pasang dari menu browser **Install App / Add to Home Screen**. Buka minimal sekali saat online untuk memastikan file aplikasi tersimpan. Matikan internet dan uji PWA.

## File

- `index.html`: UI mobile compact, pencarian draft, hasil build.
- `data.js`: 133 hero dari Gord *tanpa edit*, item Lesley, URL item/emblem/spell online.
- `logic.js`: scoring deterministik draft dan counter Lesley.
- `app.js`: pencarian, layout, localStorage draft, tombol salin, unduh dan cache gambar.
- `manifest.webmanifest`: metadata PWA, ikon 192/512 dibuat otomatis saat online dari gambar Lesley URL Gord dan disimpan ke cache browser (tidak ada file ikon di ZIP).
- `sw.js`: offline shell + cache gambar online lintas domain.
- `tests/test-logic.js`: tes logika dengan Node.js.

## Prinsip logika

- Lesley = sniper **critical + empowered true damage**, bukan MM on-hit spam. Core pertama `Berserker's Fury`, kemudian `Endless Battle`, `Malefic Gun`, `Blade of Despair` sesuai ruang counter.
- Item counter: `Sea Halberd` vs sustain, `Wind of Nature` vs physical burst, `Rose Gold Meteor` vs burst magic, `Immortality` untuk dive campuran yang sangat berat. Sepatu adaptif (`Rapid`/`Tough`/`Warrior`).
- Tidak otomatis memaksa `Malefic Roar`/`Golden Staff` hanya karena enemy tank; empowered attack Lesley menghasilkan **true damage**, sementara physical penetration dari item dapat dikonversi menjadi bonus critical damage melalui pasifnya. Maka item penetration tetap bisa memberi manfaat, tetapi tidak wajib dipaksakan hanya karena musuh tank.
- Emblem statis: **Marksman · Fatal / Weapon Master / Quantum Charge**. Spell dinamis: **Flicker** default; **Purify** bila rantai CC dapat dibersihkan dan tidak didominasi suppress; **Sprint** jika slow/zoning tinggi dengan hard CC rendah.
- Hasil adalah **heuristik draft**, bukan data real-time equipment musuh atau jaminan optimal. Counter aktual dan patch game bisa mengubah kebutuhan item.

## Offline dan keterbatasan ikon PWA

Aplikasi bisa berjalan offline setelah service worker terpasang. Gambar online hanya tersedia offline jika request-nya sempat berhasil di-cache. **Tidak ada gambar yang disimpan di dalam ZIP**. PWA menghasilkan ikon `pwa-192.png` dan `pwa-512.png` secara **virtual** dengan Canvas dari gambar Lesley online, kemudian service worker menyajikannya dari CacheStorage. Tidak ada file ikon di ZIP. Buka sekali saat online, lalu refresh jika tombol instal belum tersedia supaya browser dapat memuat ikon yang sudah di-cache. Jika browser memblokir Canvas/CORS, fallback ikon monogram dibuat di perangkat. Halaman dan logika tetap dapat dipakai offline setelah shell tersimpan.

## Sumber referensi gameplay

- Data hero, naming, dan URL: Gord Lab V11 dari pengguna.
- MLBBHub: https://mlbbhub.com/heroes/lesley
- MLBB.io: https://mlbb.io/en/hero/lesley/build
- Liquipedia: https://liquipedia.net/mobilelegends/Lesley

Tes: `node tests/test-logic.js`.
