import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Search, MapPin, PlusCircle, AlertCircle, 
  Database, Phone, Shield, LogOut, XCircle, UploadCloud, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';


// --- KONFIGURASI SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SERVICE_TYPES = [
  "Hukum / Litigasi", "Konseling & Psikologis", "Medis",
  "Pelatihan & Keterampilan", "Pemberdayaan Ekonomi", "Pendampingan Spiritual",
  "Reintegrasi & Repatriasi", "Rujukan & Pengaduan", "Shelter / Rumah Aman", "Lainnya"
];

const ORG_FILTERS = [
  { value: "",            label: "Semua jenis" },
  { value: "fasyankes",   label: "Fasyankes" },
  { value: "fpl",         label: "FPL / NGO" },
  { value: "uptd_prov",   label: "UPTD Provinsi" },
  { value: "uptd_kab",    label: "UPTD Kabupaten/Kota" },
];

const handleLogout = () => {
  setIsAdmin(false);
  setView('home');
};

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function MapView({ services }) {
  // hanya layanan yang punya lat & lng valid
  const points = services.filter(
    (s) => typeof s.lat === 'number' && typeof s.lng === 'number'
  );

  const fallbackCenter = [-2.5, 118]; // kira2 tengah Indonesia
  const center = points.length
    ? [points[0].lat, points[0].lng]
    : fallbackCenter;

  return (
    <div className="mt-2 h-[480px] rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
      <MapContainer
        center={center}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.map((s) => (
          <Marker key={s.id} position={[s.lat, s.lng]}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-xs">
                <div className="font-semibold text-slate-900">
                  {s.name}
                </div>
                <div className="text-slate-700">
                  {(s.address || '').length > 40
                    ? (s.address || '').slice(0, 40) + '...'
                    : s.address || '-'}
                </div>
                <div className="mt-1 text-[10px] text-rose-700">
                  {(s.service_types || []).slice(0, 2).join(', ')}
                </div>
                <div className="mt-1 text-[10px] text-emerald-700">
                  {s.phone || '-'}
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
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

        <div className="p-4 text-xs">
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
            <div className="mt-3 border-t pt-2 text-[11px] text-slate-700">
              <span className="font-semibold">Alasan / Catatan: </span>
              {submission.reason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminServiceMini({ service }) {
  if (!service) {
    return <p className="text-[11px] text-slate-400">Data lama tidak ditemukan.</p>;
  }
  return (
    <div className="space-y-1 text-[11px] text-slate-700">
      <p className="font-semibold text-slate-900">{service.name}</p>
      <p>{service.category}</p>
      <p className="text-slate-600">
        Layanan: {(service.service_types || []).join(', ') || '-'}
      </p>
      <p className="text-slate-600">Alamat: {service.address || '-'}</p>
      <p className="text-slate-600">Hotline: {service.phone || '-'}</p>
      <p className="text-slate-600">Jam buka: {service.hours || '-'}</p>
      {service.description && (
  <p className="text-slate-600">
    Tentang: {service.description.length > 80
      ? service.description.slice(0, 80) + '...'
      : service.description}
  </p>
)}
    </div>
  );
}

function ServiceEditModal({ service, onSave, onClose }) {
  const [form, setForm] = React.useState(() => ({
    id: service.id,
    name: service.name || '',
    category: service.category || '',
    // pastikan selalu array
    service_types: Array.isArray(service.service_types)
      ? service.service_types
      : [],
    address: service.address || '',
    phone: service.phone || '',
    hours: service.hours || '',
    description: service.description || '',
    lat: service.lat ?? '',
    lng: service.lng ?? '',
  }));

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const toggleType = (type) => {
    setForm((prev) => {
      const current = Array.isArray(prev.service_types)
        ? prev.service_types
        : [];
      if (current.includes(type)) {
        return {
          ...prev,
          service_types: current.filter((t) => t !== type),
        };
      }
      return {
        ...prev,
        service_types: [...current, type],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const cleanTypes = (form.service_types || []).filter(Boolean);

    onSave({
      id: form.id,
      name: form.name.trim(),
      category: form.category.trim(),
      service_types: cleanTypes,
      address: form.address.trim(),
      phone: form.phone.trim(),
      hours: form.hours.trim(),
      description: (form.description || '').trim(),
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
          {/* Nama */}
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

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kategori
            </label>
            <input
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm"
              value={form.category}
              onChange={handleChange('category')}
            />
          </div>

          {/* Picker Layanan (checkbox) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Jenis Layanan
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2">
              {SERVICE_TYPES.map((t) => (
                <label key={t} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300"
                    checked={(form.service_types || []).includes(t)}
                    onChange={() => toggleType(t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Alamat */}
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

          {/* Hotline & Jam buka */}
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

          {/* Tentang Lembaga */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tentang lembaga / bio singkat
            </label>
            <textarea
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm h-20"
              value={form.description}
              onChange={handleChange('description')}
            />
          </div>

          {/* Koordinat */}
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

          {/* Tombol */}
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




export default function App() {


  const [displayMode, setDisplayMode] = useState('list'); // 'list' | 'map'
const [view, setView] = useState('home');
const [services, setServices] = useState([]);
const [submissions, setSubmissions] = useState([]);
const [selectedSubmission, setSelectedSubmission] = useState(null);
const [serviceBeingEdited, setServiceBeingEdited] = useState(null);
const [adminTab, setAdminTab] = useState('queue'); // 'queue' | 'services'
const [adminServiceSearch, setAdminServiceSearch] = useState('');
const [adminServiceStatusFilter, setAdminServiceStatusFilter] = useState('all');
const [adminServiceTypeFilter, setAdminServiceTypeFilter] = useState('');



const [selectedService, setSelectedService] = useState(null);
const [isAdmin, setIsAdmin] = useState(false);

const [searchTerm, setSearchTerm] = useState('');
const [selectedTypeFilter, setSelectedTypeFilter] = useState(''); // filter layanan
const [orgFilter, setOrgFilter] = useState('');                    // filter jenis lembaga
const [searchMode, setSearchMode] = useState('name');              // 'name' | 'area'

const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 12;

const [loading, setLoading] = useState(false);


  // CSV state
  const [csvPreview, setCsvPreview] = useState([]);   // array row yang siap di-insert
  const [csvError, setCsvError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);

  // FILTER & PAGINATION
const term = searchTerm.trim().toLowerCase();

const filteredServices = services.filter((s) => {
  const status = (s.status || 'Verified').toLowerCase();

  // ⬅️ hanya tampilkan yang aktif di muka publik
  const isActive = status === 'verified';

  if (!isActive) return false;

  const name = (s.name || '').toLowerCase();
  const category = (s.category || '').toLowerCase();
  const address = (s.address || '').toLowerCase();
  const types = s.service_types || [];

  const matchesSearch = !term
    ? true
    : searchMode === 'name'
      ? name.includes(term)
      : address.includes(term);

  const matchesServiceType =
    !selectedTypeFilter ? true : types.includes(selectedTypeFilter);

  let matchesOrgType = true;
  if (orgFilter === 'fasyankes') {
    matchesOrgType = category.includes('fasilitas');
  } else if (orgFilter === 'fpl') {
    matchesOrgType =
      category.includes('ngo') || category.includes('fpl');
  } else if (orgFilter === 'uptd_prov') {
    matchesOrgType =
      category.includes('uptd') && name.includes('prov');
  } else if (orgFilter === 'uptd_kab') {
    matchesOrgType =
      category.includes('uptd') && !name.includes('prov');
  }

  return matchesSearch && matchesServiceType && matchesOrgType;
});


// FILTER UNTUK TAB ADMIN "DATA LAYANAN"
const managedServices = services.filter((s) => {
  const term = adminServiceSearch.trim().toLowerCase();
  const name = (s.name || '').toLowerCase();
  const category = (s.category || '').toLowerCase();
  const types = s.service_types || [];
  const status = (s.status || 'Verified');

  const matchSearch =
    !term ||
    name.includes(term) ||
    category.includes(term);

  const matchStatus =
    adminServiceStatusFilter === 'all'
      ? true
      : status === adminServiceStatusFilter;

  const matchType =
    !adminServiceTypeFilter
      ? true
      : types.includes(adminServiceTypeFilter);

  return matchSearch && matchStatus && matchType;
});


const totalPages = Math.max(1, Math.ceil(filteredServices.length / ITEMS_PER_PAGE));
const paginatedServices = filteredServices.slice(
  (currentPage - 1) * ITEMS_PER_PAGE,
  currentPage * ITEMS_PER_PAGE
);

// ⚠️ RESET PAGE HANYA SAAT FILTER BERUBAH
useEffect(() => {
  setCurrentPage(1);
}, [selectedTypeFilter, orgFilter, searchMode]);



  // FETCH DATA
  const fetchServices = async () => {
  setLoading(true);
  const { data, error } = await supabase
    .from('services')
    .select('*')          // ⬅️ ambil semua status
    .order('id', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error);
  } else {
    setServices(data || []);
  }
  setLoading(false);
};


  const fetchSubmissions = async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setSubmissions(data || []);
  };

  useEffect(() => { fetchServices(); }, []);
  useEffect(() => { if (isAdmin) fetchSubmissions(); }, [isAdmin]);

  // LOGIC
  const handleLogin = (e) => {
    e.preventDefault();
    if (e.target.password.value === 'admin123') {
      setIsAdmin(true); 
      setView('admin');
    } else {
      alert('Password salah! Hint: admin123');
    }
  };

  const handleSubmitNew = async (e) => {
  e.preventDefault();
  setLoading(true);
  const formData = new FormData(e.target);
  const selectedTypes = SERVICE_TYPES.filter(type => formData.get(`type_${type}`));

  const latRaw = formData.get('lat');
  const lngRaw = formData.get('lng');

  const { error } = await supabase.from('submissions').insert([{
    type: 'NEW_LISTING',
    status: 'Pending',
    data: {
  name: formData.get('name'),
  category: 'Masyarakat (FPL)',
  service_types: selectedTypes,
  address: formData.get('address'),
  phone: formData.get('phone'),
  hours: formData.get('hours'),
  description: formData.get('description') || '',
  contact_person: formData.get('cp_name'),
  contact_number: formData.get('cp_phone'),
  lat: latRaw ? parseFloat(latRaw) : null,
  lng: lngRaw ? parseFloat(lngRaw) : null,
}

  }]);

  setLoading(false);
  if (!error) {
    alert('Berhasil dikirim! Menunggu admin.');
    setView('home');
  } else {
    alert('Gagal: ' + error.message);
  }
};


  const handleSubmitCorrection = async (e) => {
  e.preventDefault();
  setLoading(true);
  const formData = new FormData(e.target);
  const selectedTypes = SERVICE_TYPES.filter(type => formData.get(`type_${type}`));

  const latRaw = formData.get('lat');
  const lngRaw = formData.get('lng');

  const { error } = await supabase.from('submissions').insert([{
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
  description: formData.get('description') || selectedService.description || '',
  lat: latRaw ? parseFloat(latRaw) : selectedService.lat ?? null,
  lng: lngRaw ? parseFloat(lngRaw) : selectedService.lng ?? null,
}

  }]);

  setLoading(false);
  if (!error) {
    alert('Usulan koreksi dikirim!');
    setView('home');
    setSelectedService(null);
  } else {
    alert('Gagal: ' + error.message);
  }
};

const handleDeactivateService = async (service) => {
  if (!confirm(`Nonaktifkan layanan "${service.name}"? Layanan tidak akan tampil di publik.`)) return;
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

const handleDeleteService = async (service) => {
  if (!confirm(`Hapus permanen layanan "${service.name}" dari database?`)) return;
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

const handleReactivateService = async (service) => {
  if (!confirm(`Aktifkan kembali layanan "${service.name}" dan tampilkan ke publik?`)) return;

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
  alert('Layanan diaktifkan kembali.');
  fetchServices();
};


const handleSaveServiceEdit = async (updatedService) => {
  // service_types dikirim sebagai array
  setLoading(true);
  const { error } = await supabase
  .from('services')
  .update({
    name: updatedService.name,
    category: updatedService.category,
    service_types: updatedService.service_types,
    address: updatedService.address,
    phone: updatedService.phone,
    hours: updatedService.hours,
    description: updatedService.description || '',
    lat: updatedService.lat,
    lng: updatedService.lng,
  })
  .eq('id', updatedService.id);

  setLoading(false);

  if (error) {
    alert('Gagal menyimpan perubahan: ' + error.message);
    return;
  }
  alert('Perubahan tersimpan.');
  setServiceBeingEdited(null);
  fetchServices();
};


  const handleApprove = async (sub) => {
  if (!confirm("Setujui data ini?")) return;
  setLoading(true);
  let errorMsg = null;

  if (sub.type === 'NEW_LISTING') {
    // HANYA kirim kolom yang ada di tabel services
    const { error } = await supabase.from('services').insert([{
  name: sub.data.name,
  category: sub.data.category,
  service_types: sub.data.service_types,
  address: sub.data.address,
  phone: sub.data.phone,
  hours: sub.data.hours,
  description: sub.data.description || '',
  status: 'Verified',
  last_updated: new Date().toISOString().slice(0, 10),
  lat: sub.data.lat ?? null,
  lng: sub.data.lng ?? null,
}]);

    if (error) errorMsg = error.message;
  } else if (sub.type === 'CORRECTION') {
    const { error } = await supabase.from('services').update({
  name: sub.data.name,
  service_types: sub.data.service_types,
  address: sub.data.address,
  phone: sub.data.phone,
  hours: sub.data.hours,
  description: sub.data.description || '',
  last_updated: new Date().toISOString().slice(0, 10),
  lat: sub.data.lat ?? null,
  lng: sub.data.lng ?? null,
}).eq('id', sub.target_id);
    if (error) errorMsg = error.message;
  }

  if (!errorMsg) {
    await supabase.from('submissions').delete().eq('id', sub.id);
    await fetchServices();
    await fetchSubmissions();
    alert("Sukses!");
  } else {
    alert("Error: " + errorMsg);
  }
  setLoading(false);
};


  const handleReject = async (id) => {
    if (confirm("Tolak pengajuan?")) {
      const { error } = await supabase.from('submissions').delete().eq('id', id);
      if (!error) fetchSubmissions();
    }
  };

  // --- CSV IMPORT LOGIC ---

  const parseCsvText = (text) => {
  try {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) {
      throw new Error("CSV kosong atau hanya berisi header.");
    }

    const headers = lines[0]
      .split(",")
      .map((h) => h.trim().toLowerCase());

    const rows = lines
      .slice(1)
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim());
        const rec = {};
        headers.forEach((h, idx) => {
          rec[h] = cols[idx] || "";
        });

        // service_types: bisa dipisah dengan ; atau |
        const rawTypes = rec.service_types || rec["service types"] || "";
        const service_types = rawTypes
          ? rawTypes
              .split(/[;|]/)
              .map((t) => t.trim())
              .filter(Boolean)
          : [];

        // lat / lng bisa pakai header lat,lng atau latitude,longitude
        const latRaw = rec.lat || rec.latitude || "";
        const lngRaw = rec.lng || rec.longitude || "";

        // description/bio: support beberapa nama header
        const description =
          rec.description ||
          rec.bio ||
          rec["tentang"] ||
          "";

        return {
          name: rec.name || "",
          category: rec.category || "Import CSV",
          service_types,
          address: rec.address || "",
          phone: rec.phone || "",
          hours: rec.hours || "",
          lat: latRaw ? parseFloat(latRaw) : null,
          lng: lngRaw ? parseFloat(lngRaw) : null,
          description, // ⬅️ field baru
          status: rec.status || "Verified",
          last_updated: new Date().toISOString().slice(0, 10),
        };
      });

    setCsvPreview(rows);
    setCsvError("");
    alert(`Berhasil membaca ${rows.length} baris dari CSV.`);
  } catch (err) {
    console.error(err);
    setCsvError(err.message || "Gagal mem-parsing CSV.");
    setCsvPreview([]);
    alert("Gagal mem-parsing CSV.");
  }
};


  const handleCsvFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text === "string") {
        parseCsvText(text);
      }
    };
    reader.onerror = () => {
      setCsvError("Gagal membaca file CSV.");
      alert("Gagal membaca file CSV.");
    };
    reader.readAsText(file);
  };

  const handleConfirmCsvImport = async () => {
    if (!csvPreview.length) {
      alert("Tidak ada data untuk di-import.");
      return;
    }
    if (!confirm(`Import ${csvPreview.length} layanan ke database?`)) return;
    setCsvLoading(true);
    const { error } = await supabase.from('services').insert(csvPreview);
    setCsvLoading(false);
    if (error) {
      alert("Gagal import: " + error.message);
      return;
    }
    alert(`Berhasil import ${csvPreview.length} layanan.`);
    setCsvPreview([]);
    setCsvError("");
    fetchServices();
  };

  const handleAdminCreateService = async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);

  const selectedTypes = SERVICE_TYPES.filter((t) =>
    formData.get(`type_${t}`)
  );

  const latRaw = formData.get('lat');
  const lngRaw = formData.get('lng');

  const payload = {
  name: formData.get('name') || '',
  category: formData.get('category') || 'Manual (Admin)',
  service_types: selectedTypes,
  address: formData.get('address') || '',
  phone: formData.get('phone') || '',
  hours: formData.get('hours') || '',
  description: formData.get('description') || '',
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
  fetchServices(); // refresh list & map
};


  // COMPONENTS UI
  const Navbar = () => (
  <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow">
    <div className="container mx-auto flex justify-between items-center">
      {/* Logo / Title */}
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setView('home')}
      >
        <Shield className="text-rose-500" />
        <span className="font-bold text-lg">LayananPPA</span>
      </div>

      {/* Right nav */}
      <div className="flex gap-3 text-sm items-center">
        <button onClick={() => setView('home')}>Cari</button>
        <button
          onClick={() => setView('api-docs')}
          className="flex gap-1 items-center"
        >
          <Database size={14} /> API
        </button>

        {isAdmin ? (
          <>
            {/* balik ke dashboard tanpa login ulang */}
            <button
              onClick={() => setView('admin')}
              className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 flex items-center gap-1"
            >
              Dashboard
            </button>

            {/* EXIT benar-benar logout */}
            <button
              onClick={() => {
                setIsAdmin(false);   // keluar dari mode admin
                setView('home');     // balik ke home
              }}
              className="flex gap-1 text-red-300 items-center text-xs"
            >
              <LogOut size={14} /> Exit
            </button>
          </>
        ) : (
          <button
            onClick={() => setView('login')}
            className="bg-rose-600 px-3 py-1 rounded text-xs"
          >
            Admin
          </button>
        )}
      </div>
    </div>
  </nav>
);




  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-10">
      <Navbar />

      {/* HOME + LIST/MAP */}
{view === 'home' && (
  <div className="bg-slate-100">
    {/* HERO: search + filter */}
    <div className="py-10 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-800">
            Repository Layanan Perlindungan
          </h1>
          <p className="text-slate-600 text-sm">
            Database terpadu UPTD PPA, fasilitas kesehatan, Kepolisian, Mitra layanan PPA
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

        {/* Dropdown Filter */}
        <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
          {/* FILTER LAYANAN */}
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
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* FILTER JENIS INSTANSI */}
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
              <option value="fasyankes">Fasyankes</option>
              <option value="fpl">FPL / NGO</option>
              <option value="uptd_prov">UPTD Provinsi</option>
              <option value="uptd_kab">UPTD Kabupaten/Kota</option>
            </select>
          </div>
        </div>

        {/* CTA daftar NGO */}
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

    {/* LIST / MAP SECTION */}
    <div className="container mx-auto px-4 pb-8">
      {/* Info + Toggle mode */}
      <div className="flex items-center justify-between mb-3 text-xs text-slate-600">
        <span>
          Menampilkan{' '}
          <span className="font-semibold">{filteredServices.length}</span> layanan
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

      {/* MODE LIST / MAP */}
      {displayMode === 'map' ? (
        /* === MODE MAP === */
        <MapView services={filteredServices} />
      ) : (
        /* === MODE LIST === */
        <>
          <div className="grid md:grid-cols-3 gap-4">
            {loading && services.length === 0 ? (
              <p className="col-span-3 text-center text-sm text-slate-500">
                <Loader2 className="animate-spin inline mr-1" /> Loading...
              </p>
            ) : paginatedServices.length === 0 ? (
              <p className="col-span-3 text-center text-sm text-slate-500">
                Tidak ada layanan yang cocok dengan pencarian.
              </p>
            ) : (
              paginatedServices.map((s) => (
                <div
                  key={s.id}
                  className="
                    bg-white p-4 rounded-xl border border-slate-200 
                    hover:border-rose-300 hover:bg-rose-50/40
                    transition-colors cursor-pointer flex flex-col gap-2
                  "
                  onClick={() => {
                    setSelectedService(s); // buka popup detail
                  }}
                >
                  {/* kategori */}
                  <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full uppercase tracking-wide">
                    {s.category}
                  </span>

                  {/* nama */}
                  <h3 className="font-semibold text-base text-slate-900 leading-snug">
                    {s.name}
                  </h3>

                  {/* layanan utama */}
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

                  {/* alamat & hotline */}
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

          {/* pagination hanya saat list */}
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
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
  </div>
)}






      {/* DETAIL MODAL */}
      {/* MODAL DETAIL LAYANAN */}
{selectedService && view === 'home' && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
    <div className="bg-white w-full max-w-lg rounded-xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        {/* Header */}
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

        {/* LAYANAN */}
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
              <span className="text-xs text-slate-500">Belum ada data layanan.</span>
            )}
          </div>
        </div>

        {/* HOTLINE & JAM BUKA */}
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

        {/* ALAMAT */}
        <div className="bg-slate-50 p-3 rounded mb-4">
          <p className="font-bold text-xs text-slate-400">ALAMAT</p>
          <p className="text-sm text-slate-800">
            {selectedService.address || '-'}
          </p>
        </div>

        {/* TENTANG LEMBAGA */}
{selectedService.description && (
  <div className="bg-slate-50 p-3 rounded mb-4">
    <p className="font-bold text-xs text-slate-400">
      TENTANG LEMBAGA
    </p>
    <p className="text-sm text-slate-800 whitespace-pre-line">
      {selectedService.description}
    </p>
  </div>
)}


        {/* BOX PENGELOLA */}
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




      {/* FORM DAFTAR BARU */}
      {/* FORM DAFTAR BARU */}
{view === 'add-new' && (
  <div className="container mx-auto p-4 max-w-lg">
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-3">Daftar Layanan Baru</h2>

      {/* 🔶 INFO BOX UNTUK LEMBAGA PEMERINTAH */}
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

      {/* FORM ASLI */}
      <form onSubmit={handleSubmitNew} className="space-y-3">
        <input
          name="name"
          placeholder="Nama Lembaga"
          className="w-full border p-2 rounded"
          required
        />

        <div className="p-2 border rounded bg-slate-50 text-xs grid grid-cols-2 gap-2">
          {SERVICE_TYPES.map((t) => (
            <label key={t} className="flex gap-1">
              <input type="checkbox" name={`type_${t}`} /> {t}
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
        <textarea
  name="description"
  placeholder="Tentang lembaga / profil singkat (opsional)"
  className="w-full border p-2 rounded text-sm"
  rows={3}
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
            onClick={() => {
              setView('home');
              setSelectedService(null);
            }}
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
)}


      {/* FORM KOREKSI DATA */}
{view === 'correction-form' && selectedService && (
  <div className="min-h-[80vh] bg-slate-100 py-10 px-4">
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-4">
      {/* Header */}
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
        {/* Nama lembaga */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Nama Lembaga
          </label>
          <input
            name="name"
            defaultValue={selectedService.name}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
        </div>

        {/* Jenis layanan (checkbox) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-2">
            Layanan yang disediakan
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2">
            {SERVICE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={`type_${t}`}
                  defaultChecked={selectedService.service_types?.includes(t)}
                  className="rounded border-slate-300"
                />
                <span>{t}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hotline & jam buka */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              No HP / Hotline
            </label>
            <input
              name="phone"
              defaultValue={selectedService.phone || ''}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>
        </div>

        {/* Alamat */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Alamat Lengkap
          </label>
          <textarea
            name="address"
            defaultValue={selectedService.address || ''}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
        </div>

        {/* Tentang Lembaga */}
<div>
  <label className="block text-xs font-semibold text-slate-600 mb-1">
    Tentang lembaga / bio singkat (opsional)
  </label>
  <textarea
    name="description"
    defaultValue={selectedService.description || ''}
    className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
  />
</div>


        {/* Koordinat */}
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
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <input
              name="lng"
              type="number"
              step="0.000001"
              placeholder="Longitude"
              defaultValue={selectedService.lng ?? ''}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Jika tidak tahu, boleh dikosongkan. Koordinat membantu menampilkan
            lembaga di peta.
          </p>
        </div>

        {/* Alasan koreksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Alasan perubahan / catatan ke admin
          </label>
          <textarea
            name="reason"
            placeholder="Contoh: Nomor hotline sebelumnya sudah tidak aktif, diganti ke nomor baru."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-rose-500"
            required
          />
        </div>

        {/* Tombol aksi */}
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
)}



      {/* LOGIN ADMIN */}
      {view === 'login' && (
        <div className="flex justify-center items-center h-[80vh]">
          <form
            onSubmit={handleLogin}
            className="bg-white p-8 rounded shadow w-full max-w-sm"
          >
            <h2 className="text-xl font-bold mb-4 text-center">
              Admin Login
            </h2>
            <input
              type="password"
              name="password"
              placeholder="admin123"
              className="w-full border p-3 rounded mb-4"
            />
            <button className="w-full bg-slate-900 text-white p-3 rounded font-bold">
              Masuk
            </button>
            <button
              type="button"
              onClick={() => setView('home')}
              className="w-full mt-4 text-sm text-center text-slate-400"
            >
              Batal
            </button>
          </form>
        </div>
      )}

      {/* ADMIN DASHBOARD + CSV IMPORT */}
      {view === 'admin' && (
  <div className="container mx-auto p-4 space-y-6">
    {/* HEADER + TAB */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div>
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <p className="text-sm text-slate-500">
          Kelola pengajuan, data layanan, dan import CSV.
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
            Antrian Pengajuan
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
        </div>
        <p className="text-[11px] text-slate-400">
          Total layanan terverifikasi: {services.length}
        </p>
      </div>
    </div>

    {/* TAB: ANTRIAN + CSV (SEPERTI SEBELUMNYA) */}
    {adminTab === 'queue' && (
  <>
    {/* CSV IMPORT + FORM TAMBAH MANUAL */}
    <div className="grid gap-4 lg:grid-cols-2">
      {/* CARD: IMPORT CSV */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
          <UploadCloud size={16} /> Import CSV Layanan
        </h3>
        <p className="text-xs text-slate-500 mb-2">
          Untuk menambahkan banyak layanan sekaligus. Format header yang
          disarankan:
        </p>
        <pre className="mt-1 rounded bg-slate-900 text-green-200 p-3 text-[11px] overflow-x-auto">
          name,category,service_types,address,phone,hours,lat,lng
        </pre>
        <p className="text-[11px] text-slate-500 mt-1">
          Kolom <code>service_types</code> dipisah dengan <code>;</code> atau{' '}
          <code>|</code>. Contoh:
          <br />
          <code>Hukum / Litigasi; Medis</code>
          <br />
          Kolom <code>lat</code> dan <code>lng</code> berisi koordinat (opsional).
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

      {/* CARD: ADMIN TAMBAH LAYANAN MANUAL */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h3 className="text-sm font-bold mb-2">
          Tambah Layanan Manual (Admin)
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">
          Digunakan oleh admin pusat untuk menambahkan layanan K/L, UPTD, atau
          mitra pemerintah yang sudah terkonfirmasi.
        </p>

        <form onSubmit={handleAdminCreateService} className="space-y-2 text-xs">
          <input
            name="name"
            placeholder="Nama Lembaga"
            className="w-full border border-slate-300 rounded px-2 py-1.5"
            required
          />

          <input
            name="category"
            placeholder="Kategori (mis. UPTD PPA, Fasilitas Kesehatan)"
            className="w-full border border-slate-300 rounded px-2 py-1.5"
          />

          <div className="border border-slate-200 rounded bg-slate-50 p-2 grid grid-cols-2 gap-1">
            {SERVICE_TYPES.map((t) => (
              <label key={t} className="flex items-center gap-1">
                <input
                  type="checkbox"
                  name={`type_${t}`}
                  className="rounded border-slate-300"
                />
                <span>{t}</span>
              </label>
            ))}
          </div>

          <input
            name="phone"
            placeholder="No HP / Hotline"
            className="w-full border border-slate-300 rounded px-2 py-1.5"
          />

          <input
            name="hours"
            placeholder="Jam buka (mis. 08.00–16.00 / 24 jam)"
            className="w-full border border-slate-300 rounded px-2 py-1.5"
          />

          <textarea
            name="address"
            placeholder="Alamat lengkap"
            className="w-full border border-slate-300 rounded px-2 py-1.5 h-14"
          />

          <textarea
  name="description"
  placeholder="Tentang lembaga (opsional)"
  className="w-full border p-2 rounded text-sm"
  rows={3}
/>


          <div className="grid grid-cols-2 gap-2">
            <input
              name="lat"
              type="number"
              step="0.000001"
              placeholder="Latitude (opsional)"
              className="w-full border border-slate-300 rounded px-2 py-1.5"
            />
            <input
              name="lng"
              type="number"
              step="0.000001"
              placeholder="Longitude (opsional)"
              className="w-full border border-slate-300 rounded px-2 py-1.5"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-slate-900 text-white rounded px-3 py-1.5 text-xs font-semibold hover:bg-black disabled:opacity-60"
          >
            {loading ? 'Menyimpan...' : 'Simpan Layanan'}
          </button>
        </form>
      </div>
    </div>

    {/* PREVIEW DATA CSV (FULL-WIDTH) */}
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

    {/* QUEUE SUBMISSIONS – BAGIAN BAWAH TETAP */}
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
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() => setSelectedSubmission(sub)}
                  className="px-3 py-1 border rounded text-xs"
                >
                  Lihat detail
                </button>
                <button
                  onClick={() => handleReject(sub.id)}
                  className="px-3 py-1 border rounded text-xs"
                >
                  Tolak
                </button>
                <button
                  onClick={() => handleApprove(sub)}
                  disabled={loading}
                  className="px-3 py-1 bg-slate-900 text-white rounded text-xs"
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


    {/* TAB: DATA LAYANAN (MANAGE) */}
    {adminTab === 'services' && (
  <div className="bg-white p-4 rounded-xl shadow border">
    <h3 className="text-sm font-bold mb-3">Data Layanan</h3>

    {/* FILTER & SEARCH BAR */}
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-3">
      <div className="flex-1 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={adminServiceSearch}
          onChange={(e) => setAdminServiceSearch(e.target.value)}
          placeholder="Cari nama / kategori..."
          className="flex-1 border border-slate-300 rounded px-3 py-2 text-xs"
        />
        <select
          value={adminServiceStatusFilter}
          onChange={(e) => setAdminServiceStatusFilter(e.target.value)}
          className="border border-slate-300 rounded px-2 py-2 text-xs bg-white"
        >
          <option value="all">Semua status</option>
          <option value="Verified">Aktif / Verified</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
        <select
          value={adminServiceTypeFilter}
          onChange={(e) => setAdminServiceTypeFilter(e.target.value)}
          className="border border-slate-300 rounded px-2 py-2 text-xs bg-white"
        >
          <option value="">Semua layanan</option>
          {SERVICE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <p className="text-[11px] text-slate-500">
        Menampilkan {managedServices.length} dari {services.length} layanan
      </p>
    </div>

    {/* TABEL DATA LAYANAN */}
    {managedServices.length === 0 ? (
      <p className="text-sm text-slate-400">
        Tidak ada layanan dengan filter tersebut.
      </p>
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
            {managedServices.map((svc) => {
              const status = svc.status || 'Verified';
              return (
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
                    {status}
                  </td>
                  <td className="border border-slate-200 px-2 py-1">
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => setServiceBeingEdited(svc)}
                        className="px-2 py-1 border rounded text-[11px]"
                      >
                        Edit
                      </button>

                      {status === 'Nonaktif' ? (
                        <button
                          onClick={() => handleReactivateService(svc)}
                          className="px-2 py-1 border rounded text-[11px] text-emerald-700"
                        >
                          Aktifkan
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateService(svc)}
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
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

  </div>
)}


      {/* API DOCS */}
      {view === 'api-docs' && (
        <div className="container mx-auto p-4">
          <h2 className="text-2xl font-bold mb-4">Public API Docs</h2>
          <div className="bg-slate-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
            GET {supabaseUrl}/rest/v1/services?select=*&status=eq.Verified
          </div>
          <p className="mt-2 text-sm">
            Header: <code>apikey: {supabaseAnonKey}</code>
          </p>
          <button
            onClick={() => setView('home')}
            className="mt-4 text-rose-600 font-bold"
          >
            Kembali
          </button>
        </div>
      )}

      {/* Modal detail submission */}
{selectedSubmission && (
  <AdminSubmissionModal
    submission={selectedSubmission}
    services={services}
    onClose={() => setSelectedSubmission(null)}
  />
)}

{/* Modal edit layanan */}
{serviceBeingEdited && (
  <ServiceEditModal
    service={serviceBeingEdited}
    onSave={handleSaveServiceEdit}
    onClose={() => setServiceBeingEdited(null)}
  />
)}

    </div>
  );
}
