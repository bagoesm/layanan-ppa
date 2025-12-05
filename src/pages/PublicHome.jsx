// src/pages/PublicHome.jsx
import React, { useEffect, useState } from 'react';
import { Search, MapPin, PlusCircle, AlertCircle, Phone, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import MapView from '../components/MapView';


export default function PublicHome() {
  const [displayMode, setDisplayMode] = useState('list'); // 'list' | 'map'
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [orgFilter, setOrgFilter] = useState('');
  const [searchMode, setSearchMode] = useState('name');

  const [serviceTypes, setServiceTypes] = useState([]);
  const [orgCategories, setOrgCategories] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('home'); // 'home' | 'add-new' | 'correction-form'

  // === FETCH DATA ===
  const fetchServices = async () => {
  setLoading(true);

  const PAGE_SIZE = 1000;
  let all = [];
  let from = 0;
  let done = false;

  while (!done) {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('status', 'Verified')
      .order('id', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching services:', error);
      done = true;
      break;
    }

    if (!data || data.length === 0) {
      // sudah tidak ada data lagi
      done = true;
      break;
    }

    all = all.concat(data);

    // kalau sudah kurang dari PAGE_SIZE, artinya ini page terakhir
    if (data.length < PAGE_SIZE) {
      done = true;
    } else {
      from += PAGE_SIZE;
    }

    // safety guard: jangan ambil lebih dari 10.000 supaya gak brutal
    if (from > 9000) {
      done = true;
      console.warn('Stop at 10.000 rows (guard).');
    }
  }

  setServices(all);
  setLoading(false);
};


  const fetchMasterData = async () => {
    // service_types master
    const { data: st, error: stErr } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true });
    if (!stErr) setServiceTypes(st || []);

    // org_categories master
    const { data: oc, error: ocErr } = await supabase
      .from('org_categories')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true });
    if (!ocErr) setOrgCategories(oc || []);
  };

  useEffect(() => {
    fetchServices();
    fetchMasterData();
  }, []);

  // === FILTER & PAGINATION ===
  const term = searchTerm.trim().toLowerCase();

  const filteredServices = services.filter((s) => {
    const name = (s.name || '').toLowerCase();
    const category = (s.category || '').toLowerCase();
    const address = (s.address || '').toLowerCase();
    const types = s.service_types || [];
 if (s.status && s.status !== 'Verified') {
    return false;
  }
    const matchesSearch = !term
      ? true
      : searchMode === 'name'
      ? name.includes(term)
      : address.includes(term);

    const matchesServiceType = !selectedTypeFilter
      ? true
      : types.includes(selectedTypeFilter);

    let matchesOrgType = true;
    if (orgFilter) {
      // Kalau sudah ada kolom org_category_code di services:
      if (s.org_category_code) {
        matchesOrgType = s.org_category_code === orgFilter;
      } else {
        // fallback lama: pakai text category
        const cat = category;
        const org = orgCategories.find((o) => o.code === orgFilter);
        matchesOrgType = org ? cat.includes(org.label.toLowerCase()) : true;
      }
    }

    return matchesSearch && matchesServiceType && matchesOrgType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));
  const paginatedServices = filteredServices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTypeFilter, orgFilter, searchMode]);

  // === SUBMIT: DAFTAR BARU ===
  const handleSubmitNew = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);

    const selectedTypes = serviceTypes
      .filter((t) => formData.get(`type_${t.label}`))
      .map((t) => t.label);

    const latRaw = formData.get('lat');
    const lngRaw = formData.get('lng');

    const orgCode = formData.get('org_category_code') || '';
    const orgCat = orgCategories.find((o) => o.code === orgCode);
    const categoryLabel = orgCat ? orgCat.label : 'Masyarakat (FPL)';

    const { error } = await supabase.from('submissions').insert([
      {
        type: 'NEW_LISTING',
        status: 'Pending',
        data: {
          name: formData.get('name'),
          category: categoryLabel,
          org_category_code: orgCode,
          service_types: selectedTypes,
          address: formData.get('address'),
          phone: formData.get('phone'),
          hours: formData.get('hours'),
          about: formData.get('about') || '',
          contact_person: formData.get('cp_name'),
          contact_number: formData.get('cp_phone'),
          lat: latRaw ? parseFloat(latRaw) : null,
          lng: lngRaw ? parseFloat(lngRaw) : null
        }
      }
    ]);

    setLoading(false);
    if (error) {
      alert('Gagal: ' + error.message);
    } else {
      alert('Berhasil dikirim! Menunggu admin.');
      e.target.reset();
      setView('home');
    }
  };

  // === SUBMIT: KOREKSI ===
  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!selectedService) return;

    setLoading(true);
    const formData = new FormData(e.target);

    const selectedTypes = serviceTypes
      .filter((t) => formData.get(`type_${t.label}`))
      .map((t) => t.label);

    const latRaw = formData.get('lat');
    const lngRaw = formData.get('lng');

    const { error } = await supabase.from('submissions').insert([
      {
        type: 'CORRECTION',
        target_id: selectedService.id,
        status: 'Pending',
        reason: formData.get('reason'),
        data: {
          ...selectedService,
          name: formData.get('name'),
          service_types: selectedTypes,
          address: formData.get('address'),
          phone: formData.get('phone'),
          hours: formData.get('hours'),
          about: formData.get('about') || '',
          lat: latRaw ? parseFloat(latRaw) : selectedService.lat ?? null,
          lng: lngRaw ? parseFloat(lngRaw) : selectedService.lng ?? null
        }
      }
    ]);

    setLoading(false);
    if (error) {
      alert('Gagal: ' + error.message);
    } else {
      alert('Usulan koreksi dikirim!');
      setView('home');
      setSelectedService(null);
    }
  };

  // === VIEW: FORM DAFTAR BARU ===
  if (view === 'add-new') {
    return (
      <div className="container mx-auto p-4 max-w-lg">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-bold mb-3">Daftar Layanan Baru</h2>

          {/* Info box lembaga pemerintah */}
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900 space-y-1">
            <p className="font-semibold text-[11px]">
              Catatan untuk lembaga perlindungan perempuan dan anak berbasis pemerintah:
            </p>
            <p>
              Sebelum menambahkan data baru, mohon lakukan koordinasi dengan instansi pembina sesuai jenis lembaga:
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>
                <span className="font-semibold">UPTD PPA / UPTD terkait</span> → koordinasi dengan
                <span className="font-semibold"> Dinas PPPA Provinsi / Kabupaten / Kota</span>
              </li>
              <li>
                <span className="font-semibold">Fasilitas kesehatan negeri (RSUD, Puskesmas)</span> → koordinasi dengan
                <span className="font-semibold"> Dinas Kesehatan / manajemen RS</span>
              </li>
              <li>
                <span className="font-semibold">Rumah aman / shelter pemerintah</span> → koordinasi dengan
                <span className="font-semibold"> Dinas Sosial</span>
              </li>
              <li>
                <span className="font-semibold">Unit kepolisian (UPPA, unit PPA)</span> → koordinasi dengan
                <span className="font-semibold"> Polres / Polda melalui UPPA</span>
              </li>
            </ul>
            <p className="mt-1">
              Setelah koordinasi dilakukan, silakan lanjutkan pengajuan. Data akan diverifikasi terlebih dahulu oleh admin pusat.
            </p>
          </div>

          <form onSubmit={handleSubmitNew} className="space-y-3">
            <input
              name="name"
              placeholder="Nama Lembaga"
              className="w-full border p-2 rounded"
              required
            />

            {/* pilih kategori lembaga dari org_categories */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Kategori Lembaga
              </label>
              <select
                name="org_category_code"
                className="w-full border p-2 rounded text-sm"
                required
              >
                <option value="">Pilih kategori...</option>
                {orgCategories.map((o) => (
                  <option key={o.id} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              name="about"
              placeholder="Deskripsi singkat / profil lembaga (opsional)"
              className="w-full border p-2 rounded text-sm h-20"
            />

            <div className="p-2 border rounded bg-slate-50 text-xs grid grid-cols-2 gap-2">
              {serviceTypes.map((t) => (
                <label key={t.id} className="flex gap-1">
                  <input type="checkbox" name={`type_${t.label}`} /> {t.label}
                </label>
              ))}
            </div>

            <input
              name="phone"
              placeholder="No HP/Hotline"
              className="w-full border p-2 rounded"
              required
            />
            <input
              name="hours"
              placeholder="Jam Buka"
              className="w-full border p-2 rounded"
              required
            />
            <textarea
              name="address"
              placeholder="Alamat Lengkap"
              className="w-full border p-2 rounded"
              required
            />

            <div className="grid grid-cols-2 gap-2">
              <input
                name="lat"
                placeholder="Latitude (opsional)"
                className="border p-2 rounded"
                type="number"
                step="0.000001"
              />
              <input
                name="lng"
                placeholder="Longitude (opsional)"
                className="border p-2 rounded"
                type="number"
                step="0.000001"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                name="cp_name"
                placeholder="Nama Kontak (Admin)"
                className="border p-2 rounded"
                required
              />
              <input
                name="cp_phone"
                placeholder="No HP Kontak"
                className="border p-2 rounded"
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setView('home')}
                className="flex-1 border p-2 rounded"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white p-2 rounded font-bold"
              >
                {loading ? '...' : 'Kirim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // === VIEW: FORM KOREKSI ===
  if (view === 'correction-form' && selectedService) {
    return (
      <div className="min-h-[80vh] bg-slate-100 py-10 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Koreksi: {selectedService.name}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Ajukan pembaruan data untuk layanan ini. Admin akan meninjau sebelum
                dipublikasikan.
              </p>
            </div>
            <button
              onClick={() => {
                setView('home');
                setSelectedService(null);
              }}
              className="text-slate-400 hover:text-slate-600"
              type="button"
            >
              <XCircle />
            </button>
          </div>

          <form onSubmit={handleSubmitCorrection} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Nama Lembaga
              </label>
              <input
                name="name"
                defaultValue={selectedService.name}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tentang Lembaga (bio)
              </label>
              <textarea
                name="about"
                defaultValue={selectedService.about || ''}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Layanan yang disediakan
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2">
                {serviceTypes.map((t) => (
                  <label key={t.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name={`type_${t.label}`}
                      defaultChecked={selectedService.service_types?.includes(t.label)}
                      className="rounded border-slate-300"
                    />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  No HP / Hotline
                </label>
                <input
                  name="phone"
                  defaultValue={selectedService.phone || ''}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Jam Buka
                </label>
                <input
                  name="hours"
                  defaultValue={selectedService.hours || ''}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Alamat Lengkap
              </label>
              <textarea
                name="address"
                defaultValue={selectedService.address || ''}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Koordinat Lokasi (opsional)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  name="lat"
                  type="number"
                  step="0.000001"
                  placeholder="Latitude"
                  defaultValue={selectedService.lat ?? ''}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <input
                  name="lng"
                  type="number"
                  step="0.000001"
                  placeholder="Longitude"
                  defaultValue={selectedService.lng ?? ''}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Jika tidak tahu, boleh dikosongkan. Koordinat membantu menampilkan lembaga di peta.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Alasan perubahan / catatan ke admin
              </label>
              <textarea
                name="reason"
                placeholder="Contoh: Nomor hotline sebelumnya sudah tidak aktif, diganti ke nomor baru."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 text-sm"
                required
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setView('home');
                  setSelectedService(null);
                }}
                className="flex-1 border border-slate-300 rounded-lg py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-rose-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-rose-700 disabled:opacity-60"
              >
                {loading ? 'Mengirim...' : 'Kirim'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // === VIEW: HOME ===
  return (
    <div className="bg-slate-100">
      {/* HERO */}
      <div className="py-10 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-slate-800">
              Repository Layanan Perlindungan
            </h1>
            <p className="text-slate-600 text-sm">
              Database terpadu UPTD PPA, fasilitas kesehatan, Kepolisian, Mitra layanan PPA.
            </p>
          </div>

          {/* Search + mode */}
          <div className="max-w-2xl mx-auto">
            <div className="flex gap-2 items-stretch">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={
                    searchMode === 'name'
                      ? 'Cari berdasarkan nama instansi...'
                      : 'Cari berdasarkan nama daerah / alamat...'
                  }
                  className="w-full p-3 pl-10 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                />
                <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
              </div>
              <select
                value={searchMode}
                onChange={(e) => setSearchMode(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm text-slate-700"
              >
                <option value="name">Nama instansi</option>
                <option value="area">Nama daerah</option>
              </select>
            </div>
          </div>

          {/* Filters */}
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Filter Layanan
              </label>
              <select
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Semua layanan</option>
                {serviceTypes.map((t) => (
                  <option key={t.id} value={t.label}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-500">
                Filter Jenis Instansi
              </label>
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="mt-1 w-full p-2 border rounded-lg text-sm bg-white shadow-sm focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Semua jenis</option>
                {orgCategories.map((o) => (
                  <option key={o.id} value={o.code}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setView('add-new')}
              className="inline-flex items-center gap-2 bg-white text-rose-600 border border-rose-200 px-5 py-2 rounded-full text-xs font-bold shadow-sm hover:bg-rose-50"
            >
              <PlusCircle size={16} /> Daftarkan Lembaga Anda
            </button>
          </div>
        </div>
      </div>

      {/* LIST / MAP */}
      <div className="container mx-auto px-4 pb-8">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-600">
          <span>
            Menampilkan <span className="font-semibold">{filteredServices.length}</span> layanan
          </span>
          <div className="inline-flex rounded-full bg-slate-200 p-1">
            <button
              type="button"
              onClick={() => setDisplayMode('list')}
              className={`px-3 py-1 rounded-full text-[11px] ${
                displayMode === 'list'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('map')}
              className={`px-3 py-1 rounded-full text-[11px] ${
                displayMode === 'map'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {displayMode === 'map' ? (
          <MapView services={filteredServices} />
        ) : (
          <>
            <div className="grid md:grid-cols-3 gap-4">
              {loading && services.length === 0 ? (
                <p className="col-span-3 text-center text-sm text-slate-500">
                  Loading...
                </p>
              ) : paginatedServices.length === 0 ? (
                <p className="col-span-3 text-center text-sm text-slate-500">
                  Tidak ada layanan yang cocok dengan pencarian.
                </p>
              ) : (
                paginatedServices.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50/40 transition-colors cursor-pointer flex flex-col gap-2"
                    onClick={() => setSelectedService(s)}
                  >
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase tracking-wide">
                      {s.category}
                    </span>
                    <h3 className="font-semibold text-base text-slate-900 leading-snug">
                      {s.name}
                    </h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {s.service_types?.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[11px]"
                        >
                          {t}
                        </span>
                      ))}
                      {s.service_types?.length > 3 && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                          +{s.service_types.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                      <p className="flex gap-1 items-center">
                        <MapPin size={12} className="text-slate-400" />
                        {s.address
                          ? s.address.length > 55
                            ? s.address.slice(0, 55) + '...'
                            : s.address
                          : '-'}
                      </p>
                      <p className="flex gap-1 items-center font-medium text-emerald-700">
                        <Phone size={12} className="text-emerald-600" />
                        {s.phone || '-'}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="mt-2 self-start text-xs font-semibold text-rose-700 hover:text-rose-800 hover:underline underline-offset-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedService(s);
                      }}
                    >
                      Lihat detail
                    </button>
                  </div>
                ))
              )}
            </div>

            {filteredServices.length > ITEMS_PER_PAGE && (
              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-600">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={`px-3 py-1 rounded-full border ${
                    currentPage === 1
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  ‹ Prev
                </button>
                <span className="px-2">
                  Halaman <span className="font-semibold">{currentPage}</span> dari{' '}
                  <span className="font-semibold">{totalPages}</span>
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={`px-3 py-1 rounded-full border ${
                    currentPage === totalPages
                      ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Next ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedService && view === 'home' && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between mb-4 items-start">
                <h2 className="text-xl font-semibold text-slate-900">
                  {selectedService.name}
                </h2>
                <button
                  onClick={() => setSelectedService(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle />
                </button>
              </div>

              {selectedService.about && (
                <div className="mb-3">
                  <p className="font-bold text-xs text-slate-400 mb-1">
                    TENTANG LEMBAGA
                  </p>
                  <p className="text-sm text-slate-800 whitespace-pre-line">
                    {selectedService.about}
                  </p>
                </div>
              )}

              <div className="bg-slate-50 p-3 rounded mb-3">
                <p className="font-bold text-xs text-slate-400">LAYANAN</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedService.service_types?.map((t) => (
                    <span
                      key={t}
                      className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                  {(!selectedService.service_types ||
                    selectedService.service_types.length === 0) && (
                    <span className="text-xs text-slate-500">
                      Belum ada data layanan.
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                <div className="bg-slate-50 p-3 rounded">
                  <p className="font-bold text-xs text-slate-400">HOTLINE</p>
                  <p className="font-mono text-lg font-bold text-emerald-700">
                    {selectedService.phone || '-'}
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded">
                  <p className="font-bold text-xs text-slate-400">JAM BUKA</p>
                  <p className="text-sm text-slate-800">
                    {selectedService.hours || '-'}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded mb-4">
                <p className="font-bold text-xs text-slate-400">ALAMAT</p>
                <p className="text-sm text-slate-800">
                  {selectedService.address || '-'}
                </p>
              </div>

              <div className="bg-amber-50 p-4 rounded border border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-2 flex gap-1 items-center">
                  <AlertCircle size={14} /> PENGELOLA?
                </p>
                <button
                  onClick={() => setView('correction-form')}
                  className="w-full bg-white border border-amber-300 text-amber-700 py-2 rounded text-xs font-semibold hover:bg-amber-50"
                >
                  Ajukan Perubahan Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
