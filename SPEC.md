# SPEC — GTA 6 Cover Art Maker (gta6-cover-art-01)

Dokumen ini adalah satu-satunya referensi desain untuk worker. Isinya prosa saja.
Tidak ada satu baris kode pun di sini. Worker merancang dan menulis semua kode
sendiri dari uraian perilaku di bawah ini, tanpa menyalin apa pun dari dokumen
ini, dari hasil tool, atau dari pesan lain.

## Ringkasan

Bangun aplikasi web statis yang berjalan offline di desktop Chrome dari
file-filenya sendiri. Aplikasi mengubah foto milik pengguna dan sebuah caption
menjadi cover art bergaya poster GTA 6: tampilan poster multi-panel, huruf
caption yang tebal dan mencolok, serta gradasi warna senja Vice City atau neon
malam. Hasilnya diekspor sebagai PNG yang siap dibagikan. Semua foto dibaca di
mesin pengguna sendiri dan tidak pernah diunggah ke mana pun.

Kompetisi ini dinilai oleh juri AI yang membandingkan dua entri dari
screenshot dan garis besar sumbernya. Urutan kriteria juri, dari yang paling
penting: pertama kualitas seni cover yang diekspor seperti terlihat di
screenshot; kedua seberapa baik aplikasi menangani foto apa pun (crop,
penempatan, beberapa panel atau beberapa foto, caption yang bisa diedit);
ketiga cepat dan mudahnya dari foto ke PNG dalam ukuran postingan umum;
keempat kerapian editor, pratinjau langsung, huruf dan efek yang dibuat
dengan baik. Entri harus masuk 10 besar, dan idealnya mengalahkan tingkat
terkuat aplikasi house: panel berbingkai seperti seni poster, susunan
miring, judul halftone, ukuran story, serta undo dan redo.

## Yang harus diserahkan

Repositori berisi program utama di root, aplikasi di bawah direktori app,
tiga atau empat screenshot di bawah direktori screenshots, salinan library
dossier dari kit di bawah direktori vendor yang tidak diubah, dan lisensi
MIT di root. Program utama menyalin direktori app dan screenshots dari
repositori ke direktori output dan menulis dossier dot json di sana dengan
memanggil pembangun dossier dari library kit. Program utama hanya memakai
pustaka standar Node, berjalan tanpa jaringan, dan dua kali jalan harus
menulis byte yang sama persis.

## Aplikasi (direktori app)

Satu halaman web statis tanpa langkah build. Halaman utama membuka di desktop
Chrome dan bekerja tanpa satu pun permintaan jaringan. Setiap script, modul,
gambar, dan font yang dimuat adalah file di bawah direktori app atau URI
data. Tidak ada referensi ke alamat web luar di mana pun.

### Editor

Editor menampilkan pratinjau langsung dari cover yang sedang dibuat, berdampingan
dengan panel kontrol yang jelas. Alurnya hanya beberapa langkah: masukkan foto,
pilih susunan panel dan ukuran, atur caption, lalu ekspor PNG.

Fitur yang wajib ada:

- Unggah foto dari mesin pengguna (satu atau beberapa foto), dibaca lokal dan
  tidak pernah diunggah. Foto yang sudah masuk bisa dipakai ulang.
- Dua foto contoh bawaan yang sudah tersedia di aplikasi tanpa unggah, yaitu
  dua foto contoh dari starter kit yang dibuat dengan model gambar untuk
  make.fun dan bebas dipakai. Tidak ada foto orang sungguhan tanpa izin dan
  tidak ada artwork game.
- Beberapa susunan panel: grid empat panel dengan satu panel hero besar dan
  tiga panel kecil, satu foto penuh memenuhi cover, dua panel berdampingan,
  tiga panel memanjang, dan grid sembilan panel kecil. Pengguna bisa mengisi
  beberapa panel dengan satu foto yang sama atau dengan foto yang berbeda,
  satu foto per panel.
- Untuk setiap panel: geser posisi foto di dalam panel, perbesar dan perkecil
  foto, dan atur ulang bingkai potongnya dengan seret langsung di pratinjau.
- Caption yang bisa ditulis dan diedit: satu judul besar dan satu subjudul
  pendek. Judul bisa dipindah posisinya di atas cover, diubah ukurannya, dan
  diberi pilihan gaya huruf. Teks judul memakai huruf display tebal dengan
  garis tepi dan bayangan yang membuatnya terbaca di atas foto.
- Pilihan gradasi warna: senja Vice City (oranye, magenta, ungu), neon malam
  (pink dan teal), senja palem (emas dan koral), serta satu gradasi dingin
  biru ungu. Gradasi diterapkan sebagai peta warna di atas foto dan sebagai
  pita langit di latar cover.
- Efek poster: bintik grain halus, vignette gelap di tepi, titik halftone di
  blok judul, garis bingkai putih tipis antar panel, dan siluet palem yang
  digambar secara prosedural sebagai hiasan, bukan gambar yang diambil dari
  mana pun.
- Ukuran ekspor: persegi 1080 kali 1080, potret 1080 kali 1350, dan
  lanskap 1920 kali 1080. Pengguna memilih ukuran lalu mengekspor PNG
  dengan satu tombol, dan file PNG diunduh ke mesinnya.
- Undo dan redo untuk perubahan editor.
- Tombol acak yang menyusun ulang panel, gradasi, dan penempatan judul dari
  pilihan yang ada, supaya pengguna cepat mendapat varian cover.
- Mode adegan untuk screenshot: membuka aplikasi dengan penanda adegan di
  alamat akan menampilkan satu adegan penuh, yaitu editor dengan foto contoh
  sudah dimuat, atau satu cover jadi yang digambar penuh oleh aplikasi
  sendiri. Mode ini dipakai untuk mengambil screenshot editor dan cover
  tanpa perlu mengklik.

### Gaya visual

Cover harus langsung terbaca sebagai poster bergaya GTA 6 versi orisinal:
panel-panel foto yang disusun seperti kolase poster, judul besar yang
mendominasi dengan huruf display tebal, pita langit senja bergradasi,
aksen neon, dan bingkai yang rapi. Semua elemen digambar oleh aplikasi
sendiri dari foto pengguna dan bentuk prosedural. Dilarang keras memakai
logo, wordmark, artwork resmi, karakter, atau file font apa pun dari
Rockstar Games atau dari game. Judul contoh yang tampil di aplikasi harus
judul karangan sendiri, bukan judul dari game. Font yang dipakai adalah
file font berlisensi SIL Open Font License yang disertakan di bawah
direktori app bersama teks lisensinya: satu font display yang sangat tebal
untuk judul dan satu font script untuk subjudul. Tidak ada font yang dimuat
dari jaringan.

### Batasan teknis aplikasi

- Direktori app berisi file dan direktori biasa saja, paling banyak 993
  entri dan 48 mebibyte seluruhnya, dan halaman utama paling besar 1
  mebibyte.
- Tidak ada symlink di dalam app.
- Semua referensi harus berupa URI data atau path ke file biasa di dalam
  app. Tidak ada satupun yang memuat dari jaringan.
- Library JavaScript apa pun yang dipakai harus berupa file minified yang
  diletakkan di bawah direktori bernama vendor atau bernama akhiran min dot
  js, supaya tercatat sebagai vendored dan tidak dihitung sebagai sumber
  yang ditulis worker. Sebaiknya hindari library sama sekali bila tidak
  diperlukan; gambar dan huruf digambar dengan canvas bawaan browser.
- Nama file dan nama fungsi harus menjelaskan apa yang dikerjakannya,
  karena garis besar sumber yang dibaca juri sebagian besar hanya
  menampilkan nama-nama itu.

## Screenshot (direktori screenshots)

Tiga atau empat gambar PNG atau JPEG. Masing-masing paling besar 256
kibibyte, sisi panjang paling besar 1280 piksel dan sisi pendek paling
sedikit 480 piksel. Nama file hanya huruf, angka, titik, garis bawah, dan
strip, tidak diawali titik atau strip.

Urutan dan isi yang ditargetkan:

- File pertama menurut nama adalah cover terbaik yang diekspor aplikasi,
  dalam ukuran lanskap 1920 kali 1080 yang ditampilkan pada 1280 kali 720,
  supaya tampil paling besar di lembar kontak juri. Ini adalah gambar
  terpenting dari seluruh entri.
- Satu gambar menunjukkan aplikasi di browser dengan foto sudah dimuat:
  editor, panel-panel, dan kontrolnya terlihat jelas.
- Satu gambar menunjukkan cover potret 1080 kali 1350 yang diekspor.
- Satu gambar menunjukkan cover persegi 1080 kali 1080 yang diekspor, atau
  varian cover kedua dengan gradasi berbeda.

Cover yang diekspor ditampilkan sebagai PNG yang ditulis aplikasi sendiri,
diperkecil sampai masuk batas ukuran, atau sebagai gambar yang digambar
aplikasi sendiri pada ukuran yang masuk batas. Tidak pernah diedit, digabung
secara manual, atau dipinjam dari tempat lain. Foto di screenshot adalah
foto contoh kit yang bebas dipakai atau foto yang dibuat dengan model
gambar; bukan foto orang sungguhan tanpa izin dan bukan artwork game.

Cara mengambil screenshot di mesin ini: periksa dulu perkakas browser
headless apa yang tersedia di mesin ini (peramban Chromium, Playwright,
atau sejenisnya) dan pakai yang ada untuk membuka aplikasi dari server
statis lokal, memuat foto contoh, dan mengambil screenshot. Bila tidak ada
peramban headless yang bisa berjalan, pakai mode adegan aplikasi dan jalur
ekspor PNG aplikasi sendiri untuk menghasilkan keempat gambar, dan pastikan
setiap gambar benar-benar berasal dari aplikasi yang dibangun, bukan
gambar yang dibuat di luar aplikasi.

## Program utama (root repositori)

Program utama ditulis dari nol oleh worker, mengikuti pola starter kit yang
boleh dibaca sebagai referensi perilaku, tetapi isinya harus tulisan worker
sendiri dengan setidaknya satu baris yang benar-benar ditulis worker.
Program utama menyalin seluruh isi direktori app dan direktori screenshots
ke direktori output, lalu menulis dossier dot json dengan pembangun dossier
dari library kit yang tidak diubah. Di luar grader, variabel lingkungan
output dari make.fun menunjuk direktori output pengganti. Program harus
deterministik dan selesai jauh di bawah batas waktu 10 detik.

## Lisensi dan berkas pendukung

- Lisensi MIT di root repositori.
- Berkas readme di root yang menjelaskan aplikasi dan memuat tiga lencana
  make.fun untuk kompetisi ini, dengan alamat pemilik dan nama repositori
  yang benar, tanpa placeholder.
- Library dossier dari kit di bawah direktori vendor, disalin dari kit
  tanpa diubah satu byte pun.
- Dua foto contoh starter kit disalin ke bawah direktori app sebagai aset,
  karena bebas dipakai dan dibuat dengan model gambar untuk make.fun.
- Font display dan font script berlisensi SIL Open Font License beserta
  teks lisensinya di bawah direktori app.

## Aturan kerja worker

- Semua kode hanya lewat aksi tulis dan edit worker sendiri di sesi ini.
  Worker boleh membaca file starter kit dan dokumen ini.
- Worker tidak pernah mengetik ulang atau menyalin kode yang dilihatnya di
  hasil tool, di pesan, atau di file lain. Kode yang ditulis harus
  karangan worker sendiri dari uraian perilaku dokumen ini.
- Setiap file utama, termasuk program utama dan file entrypoint aplikasi,
  direvisi masing-masing minimal dua kali: tulis versi pertama, uji,
  perbaiki, lalu uji lagi.
- Tes lokal harus deterministik: jalankan program utama dua kali dan
  bandingkan byte hasil keluarannya sampai identik, dan pastikan ukuran
  serta batas waktu terpenuhi. Ulangi tes sampai dua kali lolos
  byte-identical berturut-turut.
- Jangan sentuh lisensi, direktori dot makefun, dan direktori dot git.
  Jangan commit, bundle, atau submit. Laporkan daftar file, hasil tes,
  dan hash sha256 dari hasil keluaran.
- Semua konten harus orisinal: tidak ada logo, artwork, karakter, atau
  font dari Rockstar Games atau game mana pun.
