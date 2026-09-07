import React, { useState, useEffect, useRef } from 'react';
import { Save, Upload, Trash2, School, Building2, Image as ImageIcon, Loader } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const SettingsScreen = () => {
  const { settings, fetchSettings, saveSettings, saveSettingsLogo, deleteSettingsLogo } = useAppStore();
  const [namaSekolah, setNamaSekolah] = useState('');
  const [alamat, setAlamat] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (settings.namaSekolah && !namaSekolah) setNamaSekolah(settings.namaSekolah);
    if (settings.alamat && !alamat) setAlamat(settings.alamat);
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!namaSekolah.trim()) {
      alert('Nama sekolah tidak boleh kosong.');
      return;
    }
    setSaving(true);
    try {
      await saveSettings(namaSekolah.trim(), alamat.trim());
      alert('Pengaturan sekolah berhasil disimpan.');
    } catch (err) {
      alert('Gagal menyimpan pengaturan: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      setUploading(true);
      try {
        await saveSettingsLogo(reader.result);
        setLogoPreview(null);
        alert('Logo sekolah berhasil diunggah.');
      } catch (err) {
        alert('Gagal mengunggah logo: ' + (err.message || 'Terjadi kesalahan'));
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Yakin ingin menghapus logo sekolah?')) return;
    try {
      await deleteSettingsLogo();
      alert('Logo sekolah dihapus.');
    } catch (err) {
      alert('Gagal menghapus logo.');
    }
  };

  // URL untuk logo saat ini (relatif ke origin supaya ikut proxy dev)
  const currentLogoUrl = settings.logoPath
    ? (settings.logoPath.startsWith('http') ? settings.logoPath : settings.logoPath)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Pengaturan Sekolah</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Atur identitas sekolah (nama, alamat, dan logo) yang digunakan pada laporan &amp; ekspor.
        </p>
      </div>

      {/* Identitas Sekolah */}
      <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--primary)' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Building2 size={20} style={{ color: 'var(--primary)' }} />
          Identitas Sekolah
        </h2>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Nama Sekolah</label>
            <input
              type="text"
              className="input"
              value={namaSekolah}
              onChange={(e) => setNamaSekolah(e.target.value)}
              placeholder="Contoh: SMK NEGERI 1 ARAHAN"
              required
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Alamat Sekolah</label>
            <textarea
              className="input"
              rows="2"
              value={alamat}
              onChange={(e) => setAlamat(e.target.value)}
              placeholder="Contoh: Jl. Raya Arahan, Kabupaten Indramayu, Jawa Barat"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Menyimpan...' : 'Simpan Identitas'}
            </button>
          </div>
        </form>
      </div>

      {/* Logo Sekolah */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ImageIcon size={20} style={{ color: 'var(--primary)' }} />
          Logo Sekolah
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentLogoUrl ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img
                  src={currentLogoUrl}
                  alt="Logo Sekolah"
                  style={{ width: '96px', height: '96px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', backgroundColor: 'white' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ color: 'var(--info)', borderColor: 'var(--info)' }} onClick={() => fileRef.current?.click()}>
                    <Upload size={16} /> Ganti Logo
                  </button>
                  <button className="btn btn-secondary" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={handleRemoveLogo}>
                    <Trash2 size={16} /> Hapus Logo
                  </button>
                </div>
              </div>
            ) : logoPreview ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={logoPreview} alt="Pratinjau" style={{ width: '96px', height: '96px', objectFit: 'contain', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.5rem', backgroundColor: 'white' }} />
                <button className="btn btn-primary" disabled={uploading} onClick={async () => {
                  setUploading(true);
                  try {
                    await saveSettingsLogo(logoPreview);
                    setLogoPreview(null);
                    alert('Logo sekolah berhasil diunggah.');
                  } catch (err) {
                    alert('Gagal mengunggah logo: ' + (err.message || 'Terjadi kesalahan'));
                  } finally {
                    setUploading(false);
                  }
                }}>
                  {uploading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                  {uploading ? 'Mengunggah...' : 'Simpan Logo'}
                </button>
              </div>
            ) : (
              <div>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setLogoPreview(reader.result);
                  reader.readAsDataURL(file);
                }} />
                <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
                  <Upload size={16} /> Pilih Logo
                </button>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Format: PNG, JPG, WebP, atau SVG. Ukuran direkomendasikan persegi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;