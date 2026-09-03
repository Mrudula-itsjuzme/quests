const DB_NAME = 'wild-realm-local-captures';
const DB_VERSION = 2;
const IMAGE_STORE = 'images';
const KEY_STORE = 'keys';
const KEY_ID = 'local-media-key-v1';
const REF_PREFIX = 'wild-local://capture/';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IMAGE_STORE)) db.createObjectStore(IMAGE_STORE);
      if (!db.objectStoreNames.contains(KEY_STORE)) db.createObjectStore(KEY_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return dbPromise;
}

function transact(storeName, mode, run) {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = run(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

export function localCaptureRef(id) {
  return `${REF_PREFIX}${encodeURIComponent(id)}`;
}

export function isLocalCaptureRef(ref) {
  return typeof ref === 'string' && ref.startsWith(REF_PREFIX);
}

function idFromRef(ref) {
  return decodeURIComponent(ref.slice(REF_PREFIX.length));
}

function hasCrypto() {
  return Boolean(globalThis.crypto?.subtle && globalThis.crypto?.getRandomValues);
}

function bytesToBase64(bytes) {
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function getLocalMediaKey() {
  if (!hasCrypto()) return null;
  const existing = await transact(KEY_STORE, 'readonly', (store) => store.get(KEY_ID));
  if (existing) return existing;
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  await transact(KEY_STORE, 'readwrite', (store) => store.put(key, KEY_ID));
  return key;
}

async function encryptDataUrl(dataUrl) {
  const key = await getLocalMediaKey();
  if (!key) return { v: 1, dataUrl };

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(dataUrl);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  return {
    v: 2,
    alg: 'AES-GCM',
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

async function decryptRecord(record) {
  if (!record) return null;
  if (typeof record === 'string') return record;
  if (record.v === 1) return record.dataUrl || null;
  if (record.v !== 2 || record.alg !== 'AES-GCM') return null;

  const key = await getLocalMediaKey();
  if (!key) return null;
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(record.iv) },
    key,
    base64ToBytes(record.data),
  );
  return new TextDecoder().decode(plaintext);
}

export async function saveLocalCaptureImage(id, dataUrl) {
  if (!dataUrl) return null;
  if (!String(dataUrl).startsWith('data:image/')) throw new Error('invalid_local_capture_image');
  const record = await encryptDataUrl(dataUrl);
  await transact(IMAGE_STORE, 'readwrite', (store) => store.put(record, id));
  return localCaptureRef(id);
}

export async function readLocalCaptureImage(ref) {
  if (!isLocalCaptureRef(ref)) return null;
  const record = await transact(IMAGE_STORE, 'readonly', (store) => store.get(idFromRef(ref)));
  return decryptRecord(record);
}

export async function deleteLocalCaptureImage(ref) {
  if (!isLocalCaptureRef(ref)) return;
  await transact(IMAGE_STORE, 'readwrite', (store) => store.delete(idFromRef(ref)));
}
