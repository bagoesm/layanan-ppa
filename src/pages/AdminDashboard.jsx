// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { UploadCloud, Loader2, XCircle } from 'lucide-react';
import { supabase } from '../supabaseClient';

function AdminServiceMini({ service }) {
  if (!service) {
    return (
      <p className="text-[11px] text-slate-400">
        Data lama tidak ditemukan.
      </p>
    );
  }
  return (
    <div className="space-y-1 text-[11px] text-slate-700">
      <p className="font-semibold text-slate-900">{service.name}</p>
      <p>{service.category}</p>
      <p className="text-slate-600">
        Layanan: {(service.service_types || []).join(', ') || '-'}
      </p>
      {service.about && (
        <p className="text-slate-600">
          Tentang: {service.about.length > 120 ? service.about.slice(0, 120) + '…' : service.about}
        </p>
      )}
      <p className="text-slate-600">Alamat: {service.address || '-'}</p>
      <p className="text-slate-600">Hotline: {service.phone || '-'}</p>
      <p className="text-slate-600">Jam buka: {service.hours || '-'}</p>
    </div>
  );
}

function AdminSubmissionModal({ submission, services, onClose }) {
  const isCorrection = submission.type === 'CORRECTION';
  const original =
    isCorrection && services
      ? services.find((s) => s.id === submission.target_id)
      : null;
  const proposed = submission.data || {};

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-lg max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Detail Pengajuan – {submission.type}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        </div>

        <div className="p-4 text-xs space-y-3">
          {isCorrection ? (
            <div className="grid md:grid-cols-2 gap-3">
              <div className="border rounded-lg p-3 bg-slate-50">
                <p className="font-semibold mb-1 text-slate-600">Data Lama</p>
                <AdminServiceMini service={original} />
              </div>
              <div className="border rounded-lg p-3 bg-emerald-50">
                <p className="font-semibold mb-1 text-emerald-700">
                  Usulan Perubahan
                </p>
                <AdminServiceMini service={proposed} />
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-3 bg-emerald-50">
              <p className="font-semibold mb-1 text-emerald-700">
                Usulan Layanan Baru
              </p>
              <AdminServiceMini service={proposed} />
            </div>
          )}

          {submission.reason && (
            <div className="mt-2 border-t pt-2 text-[11px] text-slate-700">
              <span className="font-semibold">Alasan / Catatan: </span>
              {submission.reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ServiceEditModal({ service, serviceTypes, onSave, onClose }) {
  const [form, setForm] = useState({
    id: service.id,
    name: service.name || '',
    category: service.category || '',
    about: service.about || '',
    address: service.address || '',
    phone: service.phone || '',
    hours: service.hours || '',
    lat: service.lat ?? '',
    lng: service.lng ?? '',
    selectedTypes: service.service_types || [],
  });

  const toggleType = (label) => {
    setForm((f) => {
      const already = f.selectedTypes.includes(label);
      return {
        ...f,
        selectedTypes: already
          ? f.selectedTypes.filter((t) => t !== label)
          : [...f.selectedTypes, label],
      };
    });
  };

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: form.id,
      name: form.name,
      category: form.category,
      about: form.about,
      service_types: form.selectedTypes,
      address: form.address,
      phone: form.phone,
      hours: form.hours,
      lat: form.lat === '' ? null : parseFloat(form.lat),
      lng: form.lng === '' ? null : parseFloat(form.lng),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white w-full max-w-lg rounded-xl shadow-lg max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center border-b px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Edit Layanan – {service.name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Lembaga
            </label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.name}
              onChange={handleChange('name')}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kategori (label tampilan)
            </label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.category}
              onChange={handleChange('category')}
              placeholder="Contoh: Fasyankes, UPTD PPA, FPL, dll."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tentang Lembaga (bio)
            </label>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20"
              value={form.about}
              onChange={handleChange('about')}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Layanan yang disediakan
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-40 overflow-auto">
              {serviceTypes.map((t) => (
                <label key={t.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.selectedTypes.includes(t.label)}
                    onChange={() => toggleType(t.label)}
                    className="rounded border-slate-300"
                  />
                  <span>{t.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Alamat
            </label>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-16"
              value={form.address}
              onChange={handleChange('address')}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Hotline
              </label>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                value={form.phone}
                onChange={handleChange('phone')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Jam buka
              </label>
              <input
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                value={form.hours}
                onChange={handleChange('hours')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                value={form.lat}
                onChange={handleChange('lat')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                value={form.lng}
                onChange={handleChange('lng')}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-slate-300 rounded px-3 py-1.5 text-xs text-slate-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-slate-900 text-white rounded px-3 py-1.5 text-xs font-semibold"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [adminTab, setAdminTab] = useState('queue'); // 'queue' | 'services' | 'master'

  const [services, setServices] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // CSV state
  const [csvPreview, setCsvPreview] = useState([]);
  const [csvError, setCsvError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  // Modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [serviceBeingEdited, setServiceBeingEdited] = useState(null);

  // Master data
  const [serviceTypes, setServiceTypes] = useState([]);
  const [orgCategories, setOrgCategories] = useState([]);

  const [stForm, setStForm] = useState({ id: null, code: '', label: '' });
  const [ocForm, setOcForm] = useState({ id: null, code: '', label: '' });

  // --- FETCH DATA ---

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('id', { ascending: true });
    if (!error) setServices(data || []);
  };

  const fetchSubmissions = async () => {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setSubmissions(data || []);
  };

  const fetchMasterData = async () => {
    const { data: st, error: stErr } = await supabase
      .from('service_types')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true });
    if (!stErr) setServiceTypes(st || []);

    const { data: oc, error: ocErr } = await supabase
      .from('org_categories')
      .select('*')
      .eq('is_active', true)
      .order('label', { ascending: true });
    if (!ocErr) setOrgCategories(oc || []);
  };

  useEffect(() => {
    fetchServices();
    fetchSubmissions();
    fetchMasterData();
  }, []);

  // --- CSV IMPORT LOGIC ---

  const parseCsvText = (text) => {
    try {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) {
        throw new Error('CSV kosong atau hanya berisi header.');
      }

      const headers = lines[0]
        .split(',')
        .map((h) => h.trim().toLowerCase());

      const rows = lines
        .slice(1)
        .filter((line) => line.trim().length > 0)
        .map((line) => {
          const cols = line.split(',').map((c) => c.trim());
          const rec = {};
          headers.forEach((h, idx) => {
            rec[h] = cols[idx] || '';
          });

          // service_types: bisa dipisah pakai ; atau |
          const rawTypes = rec.service_types || rec['service types'] || '';
          const service_types = rawTypes
            ? rawTypes
                .split(/[;|]/)
                .map((t) => t.trim())
                .filter(Boolean)
            : [];

          const latRaw = rec.lat || rec.latitude || '';
          const lngRaw = rec.lng || rec.longitude || '';

          return {
            name: rec.name || '',
            category: rec.category || 'Import CSV',
            org_category_code: rec.org_category_code || null,
            service_types,
            address: rec.address || '',
            phone: rec.phone || '',
            hours: rec.hours || '',
            about: rec.about || '',
            lat: latRaw ? parseFloat(latRaw) : null,
            lng: lngRaw ? parseFloat(lngRaw) : null,
            status: rec.status || 'Verified',
            last_updated: new Date().toISOString().slice(0, 10),
          };
        });

      setCsvPreview(rows);
      setCsvError('');
      alert(`Berhasil membaca ${rows.length} baris dari CSV.`);
    } catch (err) {
      console.error(err);
      setCsvError(err.message || 'Gagal mem-parsing CSV.');
      setCsvPreview([]);
      alert('Gagal mem-parsing CSV.');
    }
  };

  const handleCsvFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === 'string') {
        parseCsvText(text);
      }
    };
    reader.onerror = () => {
      setCsvError('Gagal membaca file CSV.');
      alert('Gagal membaca file CSV.');
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    if (!csvPreview.length) {
      alert('Tidak ada data untuk di-import.');
      return;
    }
    if (!confirm(`Import ${csvPreview.length} layanan ke database?`)) return;
    setCsvLoading(true);
    const { error } = await supabase.from('services').insert(csvPreview);
    setCsvLoading(false);
    if (error) {
      alert('Gagal import: ' + error.message);
      return;
    }
    alert(`Berhasil import ${csvPreview.length} layanan.`);
    setCsvPreview([]);
    setCsvError('');
    fetchServices();
  };

  // --- ADMIN: APPROVE / REJECT SUBMISSION ---

  const handleApprove = async (sub) => {
    if (!confirm('Setujui data ini?')) return;
    setLoading(true);
    let errorMsg = null;

    if (sub.type === 'NEW_LISTING') {
      const d = sub.data || {};
      const { error } = await supabase.from('services').insert([
        {
          name: d.name,
          category: d.category || '',
          org_category_code: d.org_category_code || null,
          service_types: d.service_types || [],
          address: d.address || '',
          phone: d.phone || '',
          hours: d.hours || '',
          about: d.about || '',
          status: 'Verified',
          last_updated: new Date().toISOString().slice(0, 10),
          lat: d.lat ?? null,
          lng: d.lng ?? null,
        },
      ]);
      if (error) errorMsg = error.message;
    } else if (sub.type === 'CORRECTION') {
      const d = sub.data || {};
      const { error } = await supabase
        .from('services')
        .update({
          name: d.name,
          service_types: d.service_types || [],
          address: d.address || '',
          phone: d.phone || '',
          hours: d.hours || '',
          about: d.about || '',
          last_updated: new Date().toISOString().slice(0, 10),
          lat: d.lat ?? null,
          lng: d.lng ?? null,
        })
        .eq('id', sub.target_id);
      if (error) errorMsg = error.message;
    }

    if (!errorMsg) {
      await supabase.from('submissions').delete().eq('id', sub.id);
      await fetchServices();
      await fetchSubmissions();
      alert('Sukses!');
    } else {
      alert('Error: ' + errorMsg);
    }
    setLoading(false);
  };

  const handleReject = async (id) => {
    if (!confirm('Tolak pengajuan?')) return;
    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('id', id);
    if (!error) {
      fetchSubmissions();
    }
  };

  // --- ADMIN: MANAGE SERVICES (MANUAL ADD, EDIT, STATUS) ---

  const handleAdminCreateService = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const orgCode = formData.get('org_category_code');
    const org = orgCategories.find((o) => o.code === orgCode);
    const categoryLabel = org ? org.label : 'Manual (Admin)';

    const selectedTypes = serviceTypes
      .filter((t) => formData.get(`type_${t.label}`))
      .map((t) => t.label);

    const latRaw = formData.get('lat');
    const lngRaw = formData.get('lng');

    const payload = {
      name: formData.get('name') || '',
      category: categoryLabel,
      org_category_code: orgCode || null,
      service_types: selectedTypes,
      address: formData.get('address') || '',
      phone: formData.get('phone') || '',
      hours: formData.get('hours') || '',
      about: formData.get('about') || '',
      status: 'Verified',
      last_updated: new Date().toISOString().slice(0, 10),
      lat: latRaw ? parseFloat(latRaw) : null,
      lng: lngRaw ? parseFloat(lngRaw) : null,
    };

    if (!payload.name || !payload.address) {
      alert('Nama dan alamat wajib diisi.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('services').insert([payload]);
    setLoading(false);

    if (error) {
      alert('Gagal membuat layanan: ' + error.message);
      return;
    }

    alert('Layanan baru berhasil ditambahkan.');
    e.target.reset();
    fetchServices();
  };

  const handleDeactivateService = async (service) => {
    if (
      !confirm(
        `Nonaktifkan layanan "${service.name}"? Layanan tidak akan tampil di publik.`
      )
    )
      return;
    setLoading(true);
    const { error } = await supabase
      .from('services')
      .update({ status: 'Nonaktif' })
      .eq('id', service.id);
    setLoading(false);

    if (error) {
      alert('Gagal menonaktifkan layanan: ' + error.message);
      return;
    }
    alert('Layanan dinonaktifkan.');
    fetchServices();
  };

  const handleActivateService = async (service) => {
    if (!confirm(`Aktifkan kembali layanan "${service.name}"?`)) return;
    setLoading(true);
    const { error } = await supabase
      .from('services')
      .update({ status: 'Verified' })
      .eq('id', service.id);
    setLoading(false);

    if (error) {
      alert('Gagal mengaktifkan layanan: ' + error.message);
      return;
    }
    alert('Layanan diaktifkan.');
    fetchServices();
  };

  const handleDeleteService = async (service) => {
    if (!confirm(`Hapus permanen layanan "${service.name}" dari database?`))
      return;
    setLoading(true);
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', service.id);
    setLoading(false);

    if (error) {
      alert('Gagal menghapus layanan: ' + error.message);
      return;
    }
    alert('Layanan dihapus.');
    fetchServices();
  };

  const handleSaveServiceEdit = async (updated) => {
    setLoading(true);
    const { error } = await supabase
      .from('services')
      .update({
        name: updated.name,
        category: updated.category,
        about: updated.about,
        service_types: updated.service_types,
        address: updated.address,
        phone: updated.phone,
        hours: updated.hours,
        lat: updated.lat,
        lng: updated.lng,
        last_updated: new Date().toISOString().slice(0, 10),
      })
      .eq('id', updated.id);
    setLoading(false);

    if (error) {
      alert('Gagal menyimpan perubahan: ' + error.message);
      return;
    }
    alert('Perubahan tersimpan.');
    setServiceBeingEdited(null);
    fetchServices();
  };

  // --- ADMIN: MASTER DATA (service_types, org_categories) ---

  const handleSaveServiceType = async (e) => {
    e.preventDefault();
    if (!stForm.code || !stForm.label) {
      alert('Code dan label wajib diisi.');
      return;
    }

    if (stForm.id) {
      const { error } = await supabase
        .from('service_types')
        .update({
          code: stForm.code,
          label: stForm.label,
        })
        .eq('id', stForm.id);
      if (error) {
        alert('Gagal update service type: ' + error.message);
        return;
      }
      alert('Service type diperbarui.');
    } else {
      const { error } = await supabase.from('service_types').insert([
        {
          code: stForm.code,
          label: stForm.label,
          is_active: true,
        },
      ]);
      if (error) {
        alert('Gagal menambah service type: ' + error.message);
        return;
      }
      alert('Service type ditambahkan.');
    }

    setStForm({ id: null, code: '', label: '' });
    fetchMasterData();
  };

  const handleToggleServiceTypeActive = async (st) => {
    const { error } = await supabase
      .from('service_types')
      .update({ is_active: !st.is_active })
      .eq('id', st.id);
    if (error) {
      alert('Gagal mengubah status: ' + error.message);
      return;
    }
    fetchMasterData();
  };

  const handleSaveOrgCategory = async (e) => {
    e.preventDefault();
    if (!ocForm.code || !ocForm.label) {
      alert('Code dan label kategori wajib diisi.');
      return;
    }

    if (ocForm.id) {
      const { error } = await supabase
        .from('org_categories')
        .update({
          code: ocForm.code,
          label: ocForm.label,
        })
        .eq('id', ocForm.id);
      if (error) {
        alert('Gagal update kategori: ' + error.message);
        return;
      }
      alert('Kategori lembaga diperbarui.');
    } else {
      const { error } = await supabase.from('org_categories').insert([
        {
          code: ocForm.code,
          label: ocForm.label,
          is_active: true,
        },
      ]);
      if (error) {
        alert('Gagal menambah kategori lembaga: ' + error.message);
        return;
      }
      alert('Kategori lembaga ditambahkan.');
    }

    setOcForm({ id: null, code: '', label: '' });
    fetchMasterData();
  };

  const handleToggleOrgCategoryActive = async (oc) => {
    const { error } = await supabase
      .from('org_categories')
      .update({ is_active: !oc.is_active })
      .eq('id', oc.id);
    if (error) {
      alert('Gagal mengubah status: ' + error.message);
      return;
    }
    fetchMasterData();
  };

  // --- RENDER ---

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* HEADER + TAB */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          <p className="text-sm text-slate-500">
            Kelola pengajuan, data layanan, master data, dan import CSV.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="inline-flex rounded-full bg-slate-200 p-1 text-xs">
            <button
              type="button"
              onClick={() => setAdminTab('queue')}
              className={`px-3 py-1 rounded-full ${
                adminTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Antrian & CSV
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('services')}
              className={`px-3 py-1 rounded-full ${
                adminTab === 'services'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Data Layanan
            </button>
            <button
              type="button"
              onClick={() => setAdminTab('master')}
              className={`px-3 py-1 rounded-full ${
                adminTab === 'master'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              Master Data
            </button>
          </div>
          <p className="text-[11px] text-slate-400">
            Total layanan: {services.length}
          </p>
        </div>
      </div>

      {/* TAB: QUEUE + CSV */}
      {adminTab === 'queue' && (
        <>
          {/* CSV IMPORT SECTION */}
          <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
            <div className="bg-white p-4 rounded-xl shadow border">
              <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
                <UploadCloud size={16} /> Import CSV Layanan
              </h3>
              <p className="text-xs text-slate-500 mb-2">
                Untuk menambahkan banyak layanan sekaligus. Format header yang
                disarankan:
              </p>
              <pre className="mt-1 rounded bg-slate-900 text-green-200 p-3 text-[11px] overflow-x-auto">
                name,category,org_category_code,service_types,address,phone,hours,about,lat,lng
              </pre>
              <p className="text-[11px] text-slate-500 mt-1">
                Kolom <code>service_types</code> dipisah dengan{' '}
                <code>;</code> atau <code>|</code>. Contoh:
                <br />
                <code>Hukum / Litigasi; Medis</code>
              </p>
              <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                Pilih File CSV
              </label>
              {csvError && (
                <p className="mt-2 text-xs text-red-600">Error: {csvError}</p>
              )}
              {csvPreview.length > 0 && (
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    {csvPreview.length} baris siap di-import.
                  </p>
                  <button
                    onClick={handleConfirmCsvImport}
                    disabled={csvLoading}
                    className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black flex items-center gap-1"
                  >
                    {csvLoading && (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    )}
                    Import ke Layanan
                  </button>
                </div>
              )}
            </div>

            {csvPreview.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow border max-h-72 overflow-auto">
                <h4 className="text-xs font-semibold text-slate-800">
                  Preview Data CSV
                </h4>
                <table className="mt-2 w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Name
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Category
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Types
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.map((row, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-200 px-2 py-1">
                          {row.name}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          {row.category}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          {(row.service_types || []).join(', ')}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          {row.phone}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* QUEUE SUBMISSIONS */}
          <div className="bg-white p-4 rounded-xl shadow border">
            <h3 className="text-sm font-bold mb-3">Inbox Pengajuan</h3>
            <div className="grid gap-4">
              {submissions.length === 0 ? (
                <p className="text-center text-slate-400 py-10">
                  Tidak ada antrian.
                </p>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="bg-slate-50 p-4 rounded border-l-4 border-blue-500"
                  >
                    <div className="flex justify-between mb-2">
                      <span className="font-bold text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {sub.type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="font-bold">{sub.data?.name}</h4>
                    <p className="text-sm italic text-slate-500 mb-3">
                      “{sub.reason || 'Pendaftaran Baru'}”
                    </p>
                    <div className="flex gap-2 mb-2 text-xs">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="px-3 py-1 border rounded"
                      >
                        Lihat detail
                      </button>
                      <button
                        onClick={() => handleReject(sub.id)}
                        className="px-3 py-1 border rounded"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => handleApprove(sub)}
                        disabled={loading}
                        className="px-3 py-1 bg-slate-900 text-white rounded"
                      >
                        {loading ? '...' : 'Approve'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* TAB: DATA LAYANAN */}
      {adminTab === 'services' && (
        <div className="space-y-4">
          {/* FORM TAMBAH LAYANAN MANUAL */}
          <div className="bg-white p-4 rounded-xl shadow border">
            <h3 className="text-sm font-bold mb-2">
              Tambah Layanan Manual (Admin)
            </h3>
            <p className="text-[11px] text-slate-500 mb-3">
              Gunakan form ini untuk menambahkan layanan yang sudah
              dikonfirmasi, tanpa melalui antrian pengajuan.
            </p>
            <form
              onSubmit={handleAdminCreateService}
              className="grid md:grid-cols-2 gap-3 text-sm"
            >
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nama Lembaga
                  </label>
                  <input
                    name="name"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kategori Lembaga
                  </label>
                  <select
                    name="org_category_code"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white"
                    required
                  >
                    <option value="">Pilih kategori…</option>
                    {orgCategories.map((o) => (
                      <option key={o.id} value={o.code}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Label kategori publik akan mengikuti master data.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tentang Lembaga (bio)
                  </label>
                  <textarea
                    name="about"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20"
                    placeholder="Deskripsi singkat lembaga (opsional)"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Layanan yang disediakan
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-32 overflow-auto">
                    {serviceTypes.map((t) => (
                      <label key={t.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name={`type_${t.label}`}
                          className="rounded border-slate-300"
                        />
                        <span>{t.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      No HP / Hotline
                    </label>
                    <input
                      name="phone"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Jam Buka
                    </label>
                    <input
                      name="hours"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    name="address"
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-16"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Latitude (opsional)
                    </label>
                    <input
                      name="lat"
                      type="number"
                      step="0.000001"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Longitude (opsional)
                    </label>
                    <input
                      name="lng"
                      type="number"
                      step="0.000001"
                      className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-slate-900 text-white rounded px-4 py-2 text-xs font-semibold"
                  >
                    {loading ? 'Menyimpan…' : 'Simpan Layanan'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* TABLE DATA LAYANAN */}
          <div className="bg-white p-4 rounded-xl shadow border">
            <h3 className="text-sm font-bold mb-3">Data Layanan</h3>
            {services.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada data layanan.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Nama
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Kategori
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Layanan
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Status
                      </th>
                      <th className="border border-slate-200 px-2 py-1 text-left">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc) => (
                      <tr key={svc.id}>
                        <td className="border border-slate-200 px-2 py-1">
                          {svc.name}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          {svc.category}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          {(svc.service_types || []).slice(0, 3).join(', ')}
                          {(svc.service_types || []).length > 3 &&
                            ` (+${svc.service_types.length - 3})`}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          {svc.status || 'Verified'}
                        </td>
                        <td className="border border-slate-200 px-2 py-1">
                          <div className="flex flex-wrap gap-1">
                            <button
                              onClick={() => setServiceBeingEdited(svc)}
                              className="px-2 py-1 border rounded text-[11px]"
                            >
                              Edit
                            </button>
                            {svc.status === 'Nonaktif' ? (
                              <button
                                onClick={() =>
                                  handleActivateService(svc)
                                }
                                className="px-2 py-1 border rounded text-[11px] text-emerald-700"
                              >
                                Aktifkan
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  handleDeactivateService(svc)
                                }
                                className="px-2 py-1 border rounded text-[11px] text-amber-700"
                              >
                                Nonaktif
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteService(svc)}
                              className="px-2 py-1 border rounded text-[11px] text-red-700"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: MASTER DATA */}
      {adminTab === 'master' && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* SERVICE TYPES */}
          <div className="bg-white p-4 rounded-xl shadow border">
            <h3 className="text-sm font-bold mb-2">Master Jenis Layanan</h3>
            <p className="text-[11px] text-slate-500 mb-2">
              Data di sini mengisi pilihan layanan di publik dan admin.
            </p>
            <table className="w-full border-collapse text-[11px] mb-3">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Code
                  </th>
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Label
                  </th>
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Status
                  </th>
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {serviceTypes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-slate-200 px-2 py-2 text-center text-slate-400"
                    >
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  serviceTypes.map((st) => (
                    <tr key={st.id}>
                      <td className="border border-slate-200 px-2 py-1">
                        {st.code}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {st.label}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {st.is_active ? 'Aktif' : 'Nonaktif'}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setStForm({
                                id: st.id,
                                code: st.code,
                                label: st.label,
                              })
                            }
                            className="px-2 py-1 border rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleToggleServiceTypeActive(st)
                            }
                            className="px-2 py-1 border rounded text-[11px]"
                          >
                            {st.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <form
              onSubmit={handleSaveServiceType}
              className="space-y-2 text-sm border-t pt-2 mt-2"
            >
              <p className="text-[11px] font-semibold text-slate-700">
                {stForm.id
                  ? 'Edit Jenis Layanan'
                  : 'Tambah Jenis Layanan Baru'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Code (unik, tanpa spasi)
                  </label>
                  <input
                    value={stForm.code}
                    onChange={(e) =>
                      setStForm((f) => ({
                        ...f,
                        code: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
                    placeholder="mis: hukum"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Label
                  </label>
                  <input
                    value={stForm.label}
                    onChange={(e) =>
                      setStForm((f) => ({
                        ...f,
                        label: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
                    placeholder="Hukum / Litigasi"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {stForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setStForm({ id: null, code: '', label: '' })
                    }
                    className="px-3 py-1 border rounded text-[11px]"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white rounded text-[11px]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>

          {/* ORG CATEGORIES */}
          <div className="bg-white p-4 rounded-xl shadow border">
            <h3 className="text-sm font-bold mb-2">
              Master Kategori Lembaga
            </h3>
            <p className="text-[11px] text-slate-500 mb-2">
              Dipakai sebagai kategori lembaga & filter di halaman publik.
            </p>
            <table className="w-full border-collapse text-[11px] mb-3">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Code
                  </th>
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Label
                  </th>
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Status
                  </th>
                  <th className="border border-slate-200 px-2 py-1 text-left">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {orgCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-slate-200 px-2 py-2 text-center text-slate-400"
                    >
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  orgCategories.map((oc) => (
                    <tr key={oc.id}>
                      <td className="border border-slate-200 px-2 py-1">
                        {oc.code}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {oc.label}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        {oc.is_active ? 'Aktif' : 'Nonaktif'}
                      </td>
                      <td className="border border-slate-200 px-2 py-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() =>
                              setOcForm({
                                id: oc.id,
                                code: oc.code,
                                label: oc.label,
                              })
                            }
                            className="px-2 py-1 border rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              handleToggleOrgCategoryActive(oc)
                            }
                            className="px-2 py-1 border rounded text-[11px]"
                          >
                            {oc.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <form
              onSubmit={handleSaveOrgCategory}
              className="space-y-2 text-sm border-t pt-2 mt-2"
            >
              <p className="text-[11px] font-semibold text-slate-700">
                {ocForm.id
                  ? 'Edit Kategori Lembaga'
                  : 'Tambah Kategori Lembaga Baru'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Code (unik, tanpa spasi)
                  </label>
                  <input
                    value={ocForm.code}
                    onChange={(e) =>
                      setOcForm((f) => ({
                        ...f,
                        code: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
                    placeholder="mis: fasyankes"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">
                    Label
                  </label>
                  <input
                    value={ocForm.label}
                    onChange={(e) =>
                      setOcForm((f) => ({
                        ...f,
                        label: e.target.value,
                      }))
                    }
                    className="w-full border border-slate-300 rounded px-2 py-1 text-[11px]"
                    placeholder="Fasyankes"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                {ocForm.id && (
                  <button
                    type="button"
                    onClick={() =>
                      setOcForm({ id: null, code: '', label: '' })
                    }
                    className="px-3 py-1 border rounded text-[11px]"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white rounded text-[11px]"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALS */}
      {selectedSubmission && (
        <AdminSubmissionModal
          submission={selectedSubmission}
          services={services}
          onClose={() => setSelectedSubmission(null)}
        />
      )}

      {serviceBeingEdited && (
        <ServiceEditModal
          service={serviceBeingEdited}
          serviceTypes={serviceTypes}
          onSave={handleSaveServiceEdit}
          onClose={() => setServiceBeingEdited(null)}
        />
      )}
    </div>
  );
}
