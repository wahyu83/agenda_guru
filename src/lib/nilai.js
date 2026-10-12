export const JENIS_OPTIONS = [
  { value: 'tugas', label: 'Tugas', abbr: 'TG' },
  { value: 'ulangan', label: 'Ulangan Harian', abbr: 'UH' },
  { value: 'mid', label: 'Mid', abbr: 'MID' },
  { value: 'semester', label: 'Semester', abbr: 'SEM' },
];

export const JENIS_LABEL = {
  tugas: 'Tugas',
  ulangan: 'Ulangan Harian',
  mid: 'Mid',
  semester: 'Semester',
};

export const JENIS_ABBR = {
  tugas: 'TG',
  ulangan: 'UH',
  mid: 'MID',
  semester: 'SEM',
};

export const JENIS_COLOR = {
  tugas: 'var(--info)',
  ulangan: 'var(--warning)',
  mid: 'var(--primary)',
  semester: 'var(--secondary-hover)',
};

export const DEFAULT_BOBOT = { tugas: 30, ulangan: 30, mid: 20, semester: 20 };

export const jenisLabel = (jenis) => JENIS_LABEL[jenis] || jenis || '-';

export const bobotFromRow = (row) => ({
  tugas: row?.bobotTugas ?? DEFAULT_BOBOT.tugas,
  ulangan: row?.bobotUlangan ?? DEFAULT_BOBOT.ulangan,
  mid: row?.bobotMid ?? DEFAULT_BOBOT.mid,
  semester: row?.bobotSemester ?? DEFAULT_BOBOT.semester,
});

export const bobotForMapel = (bobotNilaiList, mapelId) => {
  const row = (bobotNilaiList || []).find((b) => String(b.mapelId) === String(mapelId));
  return bobotFromRow(row);
};

// avgByJenis: { tugas, ulangan, mid, semester } angka atau null/undefined
// bobot: { tugas, ulangan, mid, semester } angka persen
// Jenis tanpa nilai dihitung 0 (tetap mengurangi nilai akhir).
export const hitungNilaiAkhir = (avgByJenis, bobot) => {
  const totalBobot = Object.values(bobot).reduce((a, b) => a + (Number(b) || 0), 0);
  if (!totalBobot) return null;
  const sum = Object.keys(bobot).reduce((acc, j) => acc + (avgByJenis[j] || 0) * (Number(bobot[j]) || 0), 0);
  return sum / totalBobot;
};
