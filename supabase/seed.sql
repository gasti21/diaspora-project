-- ============================================================
-- KaryaDiaspora - Seed Data (jalankan setelah 0001_init.sql)
-- ============================================================

insert into public.categories (slug, name) values
  ('makanan-minuman', 'Makanan & Minuman'),
  ('aplikasi-software', 'Aplikasi & Software'),
  ('umkm-kerajinan', 'UMKM & Kerajinan'),
  ('fashion-accessories', 'Fashion & Accessories'),
  ('riset-inovasi', 'Riset & Inovasi'),
  ('pendidikan-edukasi', 'Pendidikan & Edukasi')
on conflict (slug) do nothing;

-- Produk contoh (published) - nama & isi mengikuti mockup desain.
insert into public.products
  (slug, name, category_id, stage, country, city, short_description, long_description,
   background_types, year_founded, needs, owner_name, owner_email, owner_whatsapp,
   website, status, created_at)
values
  ('cemilan-sehat-nusantara', 'Cemilan Sehat Nusantara',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Malaysia', 'Kuala Lumpur',
   'Cemilan sehat terbuat dari bahan alami khas Indonesia tanpa pengawet.',
   'Cemilan Sehat Nusantara adalah camilan yang dibuat dari bahan-bahan alami pilihan khas Indonesia. Diproses secara higienis tanpa bahan pengawet sehingga aman dan sehat untuk dikonsumsi setiap hari.

Kami memiliki beberapa varian rasa dan terus berinovasi untuk menghadirkan camilan sehat yang lezat dan bergizi.',
   '{UMKM}', 2021, '{Partner,Pembeli}', 'Devi Lestari', 'owner@cemilansehat.com',
   '+60 12-345-6789', 'www.cemilansehat.com', 'published', now() - interval '2 days'),

  ('eduplaner-app', 'EduPlaner App',
   (select id from public.categories where slug = 'aplikasi-software'),
   'Prototype', 'Jerman', 'Berlin',
   'Aplikasi perencanaan belajar untuk mahasiswa dan pelajar.',
   'EduPlaner adalah aplikasi perencanaan belajar yang membantu mahasiswa dan pelajar mengatur jadwal, tugas, dan target akademik mereka.

Fitur unggulan: pengingat tenggat, statistik kebiasaan belajar, mode fokus, serta komunitas belajar antar diaspora Indonesia.',
   '{Startup}', 2023, '{Investor,Partner}', 'Rizky Maulana', 'hello@eduplaner.app',
   '+49 151-2345-6789', 'www.eduplaner.app', 'published', now() - interval '3 days'),

  ('batik-nusa-collection', 'Batik Nusa Collection',
   (select id from public.categories where slug = 'fashion-accessories'),
   'Sudah Dijual', 'Australia', 'Sydney',
   'Koleksi batik modern dengan sentuhan desain kontemporer.',
   'Batik Nusa Collection menghadirkan batik asli Indonesia dengan desain modern yang cocok untuk gaya profesional maupun kasual di pasar internasional.

Setiap piece dibuat oleh perajin batik dari Yogyakarta dan Solo dengan pewarna alami.',
   '{UMKM,Komunitas}', 2020, '{Partner,Pembeli}', 'Intan Permata', 'info@batiknusa.com.au',
   '+61 412-345-678', 'www.batiknusa.com.au', 'published', now() - interval '4 days'),

  ('ecostraw-indonesia', 'EcoStraw Indonesia',
   (select id from public.categories where slug = 'umkm-kerajinan'),
   'Prototype', 'Belanda', 'Amsterdam',
   'Sedotan ramah lingkungan berbahan dasar bambu.',
   'EcoStraw Indonesia memproduksi sedotan minuman dari bambu pilihan yang ramah lingkungan dan dapat digunakan berulang kali.

Misi kami adalah mengurangi sampah plastik sambil memberdayakan petani bambu lokal di Indonesia.',
   '{UMKM}', 2022, '{Partner,Investor}', 'Bagas Prakoso', 'bagas@ecostraw.nl',
   '+31 6-1234-5678', null, 'published', now() - interval '5 days'),

  ('smart-hydroponic-system', 'Smart Hydroponic System',
   (select id from public.categories where slug = 'riset-inovasi'),
   'Riset', 'Singapura', null,
   'Sistem hidroponik pintar untuk pertanian urban.',
   'Smart Hydroponic System adalah riset teknologi pertanian urban yang menggabungkan IoT dan AI untuk mengoptimalkan pertumbuhan tanaman dalam ruangan dengan efisiensi air hingga 90%.

Saat ini kami mencari mentor dan investor untuk melanjutkan pengembangan prototipe komersial.',
   '{Komunitas,Startup}', 2024, '{Investor,Mentor}', 'Dr. Amara Wijaya', 'amara@hydroponic.sg',
   '+65 8123-4567', null, 'published', now() - interval '6 days'),

  ('buku-anak-dwibahasa', 'Buku Anak Dwibahasa',
   (select id from public.categories where slug = 'pendidikan-edukasi'),
   'Sudah Dijual', 'Amerika Serikat', 'New York',
   'Buku cerita anak dwibahasa Indonesia–Inggris.',
   'Buku Anak Dwibahasa membantu anak-anak diaspora Indonesia mengenal bahasa dan budaya Indonesia melalui cerita bergambar yang menghibur.

Tersedia dalam format cetak dan digital, dengan seri budaya nusantara, adab, dan kearifan lokal.',
   '{Produsen}', 2019, '{Partner,Pembeli}', 'Sari Wulandari', 'sari@bilingualkids.us',
   '+1 917-345-6789', 'www.bilingualkids.us', 'published', now() - interval '7 days'),

  ('kopi-rempah-nusantara', 'Kopi Rempah Nusantara',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Singapura', null,
   'Kopi arabika single origin dengan sentuhan rempah Indonesia.',
   'Kopi Rempah Nusantara menghadirkan biji kopi arabika pilihan dari Gayo, Toraja, dan Kintamani yang diproses bersama rempah pilihan seperti kayu manis, kapulaga, dan cengkih.

Roasted fresh setiap minggu di Singapura dan dikirim ke seluruh Asia Tenggara.',
   '{UMKM}', 2021, '{Pembeli,Distribusi}', 'Hendra Gunawan', 'hendra@kopirempah.sg',
   '+65 8567-1234', 'www.kopirempah.sg', 'published', now() - interval '8 days'),

  ('teh-herbal-indonesia', 'Teh Herbal Indonesia',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Belanda', 'Rotterdam',
   'Teh herbal premium dari jamu dan tanaman obat Indonesia.',
   'Teh Herbal Indonesia mengemas kekayaan jamu tradisional dalam bentuk teh modern yang praktis: temulawak, jahe merah, serai, dan rosela.

Semua bahan disuplai langsung dari petani di Jawa Tengah dan diproses tanpa gula tambahan.',
   '{UMKM}', 2022, '{Distribusi,Pembeli}', 'Ratna Kusuma', 'ratna@tehherbal.nl',
   '+31 6-8765-4321', null, 'published', now() - interval '9 days'),

  ('keripik-tempe-nusantara', 'Keripik Tempe Nusantara',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Jerman', 'Munich',
   'Keripik tempe renyah dengan bumbu khas nusantara.',
   'Keripik Tempe Nusantara adalah camilan berbahan tempe fermentasi pilihan, diiris tipis, digoreng renyah, dan dibalut bumbu khas seperti balado, keju, dan seaweed.

Produksi halal dan terdaftar resmi di Jerman.',
   '{Produsen}', 2020, '{Distribusi}', 'Ahmad Fauzi', 'fauzi@tempechips.de',
   '+49 176-2345-678', null, 'published', now() - interval '10 days'),

  ('abon-lele-premium', 'Abon Lele Premium',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Prototype', 'Arab Saudi', 'Riyadh',
   'Abon lele higienis kaya protein untuk keluarga diaspora.',
   'Abon Lele Premium memanfaatkan lele hasil budidaya bersertifikat yang diolah menjadi abon rendah garam tanpa MSG.

Sedang dalam tahap uji pasar di kalangan komunitas Indonesia di Riyadh sebelum produksi massal.',
   '{UMKM}', 2023, '{Mentor,Pembeli}', 'Yuni Astuti', 'yuni@abonlele.sa',
   '+966 55-345-6789', null, 'published', now() - interval '11 days'),

  ('kue-semprong-tradisional', 'Kue Semprong Tradisional',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Sudah Dijual', 'Malaysia', 'Johor Bahru',
   'Kue semprong renyah resep turun-temurun dari Riau.',
   'Kue Semprong Tradisional dibuat dengan resep asli turun-temurun menggunakan santan kelapa asli dan telur ayam kampung, tanpa pengenyal.

Cocok untuk hampers, acara hajatan, dan oleh-oleh khas Indonesia.',
   '{Produsen}', 2018, '{Pembeli}', 'Nurhayati', 'nurhayati@semprong.my',
   '+60 19-876-5432', null, 'published', now() - interval '12 days'),

  ('tenun-ikat-nusantara', 'Tenun Ikat Nusantara',
   (select id from public.categories where slug = 'fashion-accessories'),
   'Sudah Dijual', 'Australia', 'Melbourne',
   'Tenun ikat asli Sumba dan Toraja untuk fashion etnik modern.',
   'Tenun Ikat Nusantara bekerja sama langsung dengan 40+ penenun di Sumba dan Toraja untuk menghadirkan kain tenun berkualitas tinggi ke pasar Australia.

Setiap pembelian memberikan kontribusi langsung kepada perajin.',
   '{Komunitas}', 2019, '{Partner,Pembeli}', 'Maria Gozali', 'maria@tenunnusantara.au',
   '+61 423-456-789', null, 'published', now() - interval '13 days'),

  -- Contoh produk pending untuk demo dashboard admin
  ('keripik-ubi-ungu', 'Keripik Ubi Ungu',
   (select id from public.categories where slug = 'makanan-minuman'),
   'Prototype', 'Singapura', null,
   'Keripik ubi ungu premium tanpa bahan pengawet dengan rasa yang renyah dan manis alami.',
   'Keripik Ubi Ungu dibuat dari ubi ungu pilihan yang diiris tipis dan dipanggang, bukan digoreng. Kaya antioksidan dan serat.

Saat ini sedang mencari mitra distribusi untuk masuk ke ritel modern di Singapura.',
   '{UMKM}', 2024, '{Pembeli,Distribusi}', 'Budi Santoso', 'budi.santoso@email.com',
   '+65 9123-4567', null, 'pending', now() - interval '1 day'),

  ('tasbihku-arga', 'Tasbihku Arga',
   (select id from public.categories where slug = 'aplikasi-software'),
   'Prototype', 'Arab Saudi', 'Makkah',
   'Aplikasi digital tasbih dan pengingat ibadah harian untuk muslim diaspora.',
   'Tasbihku Arga adalah aplikasi penghitung tasbih digital lengkap dengan jadwal sholat, Al-Qur''an digital, dan komunitas ibadah.

Butuh investor untuk pengembangan versi iOS dan fitur premium.',
   '{Startup}', 2025, '{Investor}', 'Andi Wijaya', 'andi.wijaya@email.com',
   '+966 54-123-4567', null, 'pending', now() - interval '2 days'),

  ('gadget-organizer-kulit', 'Gadget Organizer Kulit',
   (select id from public.categories where slug = 'fashion-accessories'),
   'Sudah Dijual', 'Malaysia', 'Penang',
   'Organizer gadget berbahan kulit asli buatan pengrajin Garut.',
   'Gadget Organizer Kulit memadukan bahan kulit sapi asli Garut dengan desain minimalis untuk menyimpan kabel, charger, dan aksesori.

Perlu revisi foto produk dan penjelasan sertifikasi kulit sebelum tayang.',
   '{UMKM}', 2022, '{Pembeli}', 'Fajar Nugroho', 'fajar.nugroho@email.com',
   '+60 11-2345-6789', null, 'revision', now() - interval '4 days');
