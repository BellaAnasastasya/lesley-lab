# Lesley Lab L1

PWA mobile berbahasa Indonesia, dibuat dari aturan/interaksi Gord Lab dan Miya Lab unggahan pengguna. Fokus Lesley: critical burst/Lethal Shot; bukan salinan build attack-speed Miya.

## Pasang di hosting

ZIP siap hosting berisi folder `lesley-lab` dengan `index.html`, seluruh JS, service worker, manifest, dan folder `assets` langsung di dalamnya. Unggah **seluruh isi folder**, bukan hanya HTML, ke hosting HTTPS. Bisa di root atau subfolder. Semua URL internal relatif. Tidak memerlukan npm, backend, API key, CDN, font eksternal, atau koneksi ke sumber gambar ketika digunakan.

Untuk checkout pengembangan ini, file siap hosting berada di `dist/`.

### iPhone

1. Buka situs HTTPS di Safari saat online.
2. Bagikan → Tambah ke Layar Utama.
3. Buka aplikasi **dari ikon Layar Utama** saat masih online.
4. Tunggu indikator **Siap offline · seluruh gambar tersimpan**. Semua aset diprecache otomatis, termasuk hero yang belum pernah dicari.
5. Setelah itu internet boleh dimatikan. Tutup/buka aplikasi dan cari hero lain: gambar, database, dan analisis memakai berkas lokal yang dicache.

Status siap hanya muncul setelah semua entri cache berhasil disimpan. Jika unduhan gagal, aplikasi menampilkan status belum siap dan tombol coba lagi. Cache parsial tidak dianggap sukses. Cache yang kehilangan berkas dapat diperbaiki saat online. Draft disimpan pada perangkat, bukan server.

Batas iOS: browser dapat menghapus data karena penyimpanan menipis, penghapusan data situs, atau kebijakan OS. Tidak ada PWA yang dapat menjamin cache bertahan selamanya. Safari dan aplikasi Home Screen dapat mempunyai penyimpanan terpisah; tunggu siap di aplikasi yang akan dipakai. `file://` tidak mendukung service worker. Peladen harus menyajikan `.js` sebagai JavaScript, bukan HTML fallback.

## Fitur

- 5 slot musuh dan 4 teman; Lesley milik pengguna, dikecualikan dari pemilih.
- 133 profil hero dari contoh; pencarian dan pencegahan hero duplikat lintas tim.
- 6 item unik: sepatu + Berserker's Fury, Endless Battle, Blade of Despair + 2 slot situasional.
- Musuh menentukan sinyal fisik, magic, dive, CC, sustain, shield, dan frontline. Teman menentukan peel, frontline, healer, setup, serta ruang pickoff.
- Dua slot situasional dipilih melalui skor, bukan build statis. Counter fisik, magic burst/berulang, antiheal, range, sustain, ambush, dan revive memiliki aturan berbeda.
- Counter awal memajukan satu counter terpilih; tidak mengacak atau membuang core. Wind of Nature tidak ditempatkan pada slot 1–2.
- Spell Flicker/Purify adaptif. Suppression selalu mencegah pemilihan Purify.
- Emblem dan talent adaptif; seluruh artwork asli ikut dibundel.
- Penjelasan per item, ancaman yang belum tertutup, rencana main, reset draft, dan salin hasil.
- Tidak memakai tier/proMeta dari contoh sebagai bobot matchup.

## Data dan kejujuran rekomendasi

Profil hero mengikuti snapshot contoh unggahan, bukan sinkronisasi live roster/patch. Build adalah heuristik berbasis draft; tidak membaca gold, level, inventori, cooldown, pemain, atau perlindungan teman yang benar-benar terjadi. Tidak ada klaim DPS/angka damage atau jaminan menang. Cocokkan dengan item musuh dan deskripsi patch dalam game.

Ketiga core dipertahankan untuk identitas burst Lesley. Golden Staff/on-hit DHS tidak digunakan sebagai respons otomatis terhadap tank. True damage Lethal Shot membantu menghadapi defense, tetapi HP besar tetap memerlukan beberapa tembakan. Wind of Nature tidak memblokir true damage/magic. Tough Boots/Purify tidak menyelesaikan suppression. Keberadaan healer/roamer teman tidak diasumsikan berarti antiheal atau peel sudah tersedia setiap saat.

14 kandidat item, 155 raster game art lokal: 133 hero + 14 item + 2 emblem + 2 spell + 4 talent. Ikon aplikasi PNG menggunakan portrait Lesley yang sama. Tidak ada placeholder SVG, data URI, CSV, atau hotlink gambar di UI. `asset-sources.json` mencatat URL asli; artwork © MOONTON/pemilik masing-masing. Lihat `sources.html` untuk rujukan.

## Pengujian

Dengan Node.js 18+:

```sh
node tests/test-build.cjs
node tests/test-offline.cjs
```

Tes build mencakup 2.000 kombinasi draft, keutuhan core/slot, efek teman, urutan counter, suppression, serta skenario fisik/magic/sustain. Tes service worker menggunakan lingkungan cache/fetch simulasi: install seluruh berkas, putus jaringan, baca setiap rute/aset, deteksi cache rusak, perbaikan, dan kegagalan install. Semua lulus saat dibuat. Ini bukan pengujian perangkat Safari fisik. Preview browser lingkungan pembuat tidak tersedia sehingga tampilan dan lifecycle iOS belum diverifikasi langsung.

## Setelah mengedit

Jalankan generator agar daftar aset dan versi cache diperbarui:

```sh
python3 scripts/build-offline.py
node tests/test-build.cjs
node tests/test-offline.cjs
```

Unggah seluruh hasil bersama `sw.js` dan `offline-manifest.json` baru. Perubahan gambar/data tidak membutuhkan server saat analisis. Source di `scripts/sw-template.js` membentuk service worker; jangan hanya mengedit file hasil tanpa menjalankan generator. Generator mendukung struktur checkout `dist/` maupun ZIP siap hosting dengan file di root folder.
