# 📍 LayananPPA – Repository Layanan Perlindungan Perempuan & Anak

LayananPPA adalah direktori nasional untuk memetakan dan mengelola **layanan perlindungan perempuan dan anak** di Indonesia:  
UPTD PPA, fasilitas kesehatan, kepolisian, rumah aman/shelter, dan mitra FPL/NGO.

Aplikasi ini menyediakan:

- **Tampilan publik** (list + peta) untuk mencari layanan terdekat
- **Mekanisme update data terstruktur** (API, CSV, dan pengajuan FPL)
- **Dashboard admin** untuk kurasi dan moderasi data
- **Open API** berbasis Supabase REST untuk diintegrasikan ke sistem K/L lain

---

## ✨ Fitur Utama

### 👀 Tampilan Publik

- Pencarian layanan:
  - Berdasarkan **nama instansi**
  - Berdasarkan **nama daerah / alamat**
- Filter:
  - **Jenis layanan** (Hukum / Litigasi, Medis, Konseling, dll.)
  - **Jenis lembaga** (Fasyankes, FPL/NGO, UPTD Provinsi, UPTD Kabupaten/Kota)
- Dua mode tampilan:
  - **List view**: kartu lembaga yang minimalis
  - **Map view**: peta Indonesia dengan marker tiap lembaga (Leaflet + OpenStreetMap)
- Detail lembaga dalam bentuk popup (modal):
  - Nama
  - Kategori
  - Jenis layanan
  - Alamat
  - Hotline
  - Jam buka

### 📝 Pengajuan & Koreksi Data (FPL/NGO & Publik)

- Form **“Daftarkan Lembaga Anda”** untuk FPL/NGO
- Form **“Ajukan Perubahan Data”** di tiap lembaga:
  - Koreksi nomor hotline
  - Koreksi jam buka
  - Koreksi alamat, jenis layanan, dan koordinat peta
- Semua pengajuan masuk ke tabel **`submissions`** dengan status `Pending` untuk direview admin

### 🗺 Map View

- Menggunakan **react-leaflet** + **OpenStreetMap**
- Marker hanya tampil jika lembaga memiliki `lat` dan `lng`
- Tooltip ringkas saat hover:
  - Nama lembaga
  - Alamat singkat
  - 1–2 jenis layanan utama
  - Hotline

### 🛠 Admin Dashboard

Mode admin dilindungi password sederhana untuk MVP (default: `admin123`):

- Tab **Antrian Pengajuan**
  - Lihat daftar pengajuan (NEW_LISTING & CORRECTION)
  - Lihat detail perbandingan:
    - Data lama vs usulan baru (untuk koreksi)
  - Aksi:
    - ✅ Approve → data masuk / update ke tabel `services`
    - ❌ Reject → pengajuan dihapus

- Tab **Data Layanan**
  - Tabel semua layanan terverifikasi
  - Pencarian & filter dasar (bisa dikembangkan)
  - Aksi per lembaga:
    - ✏️ Edit (popup modal)
      - Nama
      - Kategori
      - Jenis layanan (via checkbox dari `SERVICE_TYPES`)
      - Alamat
      - Hotline
      - Jam buka
      - Koordinat (lat, lng)
      - Keterangan / bio / tentang lembaga
    - 🚫 Nonaktifkan (ubah `status` → `Nonaktif`, tidak tampil di publik)
    - 🗑 Hapus permanen

- Form **Tambah Layanan Manual (Admin)**
  - Admin dapat langsung menambahkan lembaga baru ke tabel `services` tanpa melalui antrian `submissions`

### 📂 Import CSV (Bulk Import)

Admin dapat meng-import banyak lembaga sekaligus via CSV:

- Format header minimal:

  ```text
  name,category,service_types,address,phone,hours,lat,lng,about

  service_types dipisah dengan ; atau |, contoh:
  Hukum / Litigasi; Konseling & Psikologis; Shelter / Rumah Aman
  lat & lng optional (untuk map)
  about optional (keterangan / bio lembaga)

Preview CSV akan muncul sebelum import, lalu admin klik “Import ke Layanan”.

### 🧱 Arsitektur Singkat

- Frontend

 - React + Vite
 - TailwindCSS (class utility)
 - react-leaflet untuk peta
 - lucide-react untuk ikon

- Backend / Data Layer
 - Supabase (PostgreSQL + REST API)

### 🚀 Menjalankan Aplikasi Secara Lokal
1. Prasyarat

Node.js (disarankan versi LTS, misalnya 18+)

Akun Supabase + 1 project baru

Git (untuk kolaborasi di GitHub)

2. Clone Repository
git clone https://github.com/bagoesm/layanan-ppa.git
cd layanan-ppa

3. Install Dependencies
npm install

4. Setup .env
cp .env.example .env

lalu edit .env dan isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY

5. Jalankan Dev Server
npm run dev

Buka di browser:
http://localhost:5173 (default Vite)

### 🌐 Open API (Supabase REST)

Seluruh data layanan dapat diakses melalui Supabase REST API (read-only untuk publik):
 ```GET {VITE_SUPABASE_URL}/rest/v1/services?select=*&status=eq.Verified
 Headers:
  apikey: {VITE_SUPABASE_ANON_KEY}

K/L atau pemerintah daerah yang sudah punya sistem sendiri dapat:

- Mengambil data terkini (sinkronisasi)

Di tahap lanjut: mengupdate data terpusat via API (dengan kunci khusus / service role)

