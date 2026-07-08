import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Trash2, Eye, X, Plus } from 'lucide-react';
import { useAppStore } from '../../../lib/store';

const RppScreen = () => {
  const { tugasId } = useParams();
  const navigate = useNavigate();
  const { tugasGuru, fetchRpp, uploadRpp, deleteRpp } = useAppStore();

  const currentTugas = tugasGuru.find(t => t.id === parseInt(tugasId));

  const [rppList, setRppList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form state
  const [judul, setJudul] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (tugasId) {
      loadRpp();
    }
  }, [tugasId]);

  const loadRpp = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRpp(parseInt(tugasId));
      setRppList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 50 * 1024 * 1024) {
        alert('Ukuran file maksimal 50MB');
        return;
      }
      setFile(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!judul || !file) {
      alert('Judul dan file wajib diisi!');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        try {
          await uploadRpp({
            pengampuId: parseInt(tugasId),
            judul,
            deskripsi,
            fileData: base64,
            fileName: file.name,
            fileType: file.type
          });
          alert('RPP berhasil diupload!');
          setShowUpload(false);
          setJudul('');
          setDeskripsi('');
          setFile(null);
          loadRpp();
        } catch (err) {
          alert(err.message || 'Gagal upload RPP');
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus RPP ini?')) {
      try {
        await deleteRpp(id);
        loadRpp();
      } catch (err) {
        alert('Gagal menghapus RPP');
      }
    }
  };

  const handleView = (rpp) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>${rpp.judul}</title></head>
          <body style="margin:0">
            <iframe src="${rpp.fileData}" style="width:100%;height:100vh;border:none;" />
          </body>
        </html>
      `);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/guru')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>RPP</h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {currentTugas ? `${currentTugas.kelas?.nama} - ${currentTugas.mapel?.nama}` : 'Memuat data...'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => navigate(`/guru/agenda/${tugasId}`)}
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}
        >
          Agenda
        </button>
        <button
          onClick={() => navigate(`/guru/absensi/${tugasId}`)}
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}
        >
          Absensi
        </button>
        <button
          onClick={() => navigate(`/guru/nilai/${tugasId}`)}
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', color: 'var(--text-muted)', fontWeight: '500', whiteSpace: 'nowrap' }}
        >
          Nilai
        </button>
        <button
          style={{ flex: '1 0 auto', padding: '0.75rem', border: 'none', background: 'none', borderBottom: '2px solid var(--primary)', color: 'var(--primary)', fontWeight: '600', whiteSpace: 'nowrap' }}
        >
          RPP
        </button>
      </div>

      {/* Upload Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowUpload(true)}
          className="btn btn-primary"
          style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Plus size={16} /> Upload RPP
        </button>
      </div>

      {/* RPP List */}
      {isLoading ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat RPP...</div>
      ) : rppList.length === 0 ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileText size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <p>Belum ada RPP yang diupload.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rppList.map((rpp) => (
            <div key={rpp.id} className="card" style={{ padding: '1rem' }}>
              <div className="flex justify-between items-start">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: '600', fontSize: '0.95rem', color: 'var(--primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {rpp.judul}
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {formatDate(rpp.tanggalUpload)} • {rpp.fileName}
                  </p>
                  {rpp.deskripsi && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {rpp.deskripsi}
                    </p>
                  )}
                </div>
                <div className="flex gap-2" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                  <button
                    onClick={() => handleView(rpp)}
                    className="text-info hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                    title="Lihat RPP"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(rpp.id)}
                    className="text-danger hover:opacity-80 transition-colors bg-transparent border-none cursor-pointer"
                    title="Hapus RPP"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <div className="modal-backdrop">
          <div className="modal-content animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Upload RPP Baru</h2>
              <button onClick={() => setShowUpload(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="var(--text-muted)" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="label">Judul RPP</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Contoh: RPP Matematika - Trigonometri"
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="label">Deskripsi (Opsional)</label>
                <textarea
                  className="input"
                  rows="2"
                  placeholder="Deskripsi singkat RPP"
                  value={deskripsi}
                  onChange={(e) => setDeskripsi(e.target.value)}
                />
              </div>
              <div>
                <label className="label">File RPP (PDF/Word/Excel, max 50MB)</label>
                <input
                  type="file"
                  className="input"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  required
                />
                {file && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Terpilih: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3" style={{ marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowUpload(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                  <Upload size={16} /> {isUploading ? 'Mengupload...' : 'Upload RPP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RppScreen;
