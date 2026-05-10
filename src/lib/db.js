import { openDB } from 'idb';

const DB_NAME = 'agenda_guru_db';
const DB_VERSION = 1;

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('agenda_local')) {
        db.createObjectStore('agenda_local', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('absensi_local')) {
        db.createObjectStore('absensi_local', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
};

export const saveAgendaOffline = async (agendaData) => {
  const db = await initDB();
  const tx = db.transaction('agenda_local', 'readwrite');
  const store = tx.objectStore('agenda_local');
  
  const payload = {
    ...agendaData,
    status_sync: 'pending_insert',
    last_modified: new Date().toISOString()
  };
  
  await store.add(payload);
  await tx.done;
  return true;
};

export const getPendingAgenda = async () => {
  const db = await initDB();
  const tx = db.transaction('agenda_local', 'readonly');
  const store = tx.objectStore('agenda_local');
  const allData = await store.getAll();
  return allData.filter(item => item.status_sync !== 'synced');
};

export const saveAbsensiOffline = async (tugasId, tanggal, absensiList) => {
  const db = await initDB();
  const tx = db.transaction('absensi_local', 'readwrite');
  const store = tx.objectStore('absensi_local');
  
  const payload = {
    tugasId,
    tanggal,
    data: absensiList,
    status_sync: 'pending_insert',
    last_modified: new Date().toISOString()
  };
  
  await store.add(payload);
  await tx.done;
  return true;
};
