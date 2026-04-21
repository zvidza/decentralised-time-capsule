/**
* Arweave Storage Helper
*
* For this prototype, I use a mock implementation that:
* 1. Stores files in IndexedDB (for demo purposes — handles large files unlike localStorage)
* 2. Can easily be swapped for real Arweave in production
*
* In production,:
* - going to choose to Use Irys (Bundlr) or Arweave directly
* - Pay with AR tokens for permanent storage
*/

const DB_NAME = 'timeCapsuleDB';
const STORE_NAME = 'capsules';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (e) => {
            e.target.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

function dbSet(db, key, value) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
    });
}

function dbGet(db, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(key);
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

// Mock upload - stores in IndexedDB for demo
// Returns a fake "transaction ID"
export async function uploadToArweave(encryptedData, metadata) {
    const txId = 'ar_' + Date.now() + '_' + Math.random().toString(36).substring(7);

    const storageItem = {
        data: encryptedData,
        metadata,
        timestamp: Date.now(),
    };

    const db = await openDB();
    await dbSet(db, txId, storageItem);
    console.log('File uploaded with ID:', txId);
    return txId;
}

// Fetch only metadata (title, name, type) without loading the full encrypted blob
export async function getMetadataFromArweave(txId) {
    const db = await openDB();
    const item = await dbGet(db, txId);
    if (!item) return null;
    return item.metadata;
}

// Mock download - retrieves from IndexedDB
export async function downloadFromArweave(txId) {
    const db = await openDB();
    const item = await dbGet(db, txId);
    if (!item) throw new Error('File not found');

    return {
        encryptedData: item.data instanceof Uint8Array ? item.data : new Uint8Array(item.data),
        metadata: item.metadata,
    };
}
