/**
* Arweave Storage Helper — Mock Implementation
*
* This is a prototype implementation that stores files in IndexedDB rather than
* the Arweave permaweb. It is designed to be swapped out for production implementation
*
* Production upgrade path:
* - Replace uploadToArweave / downloadFromArweave with calls to Irys ( Bundlr) or the Arweave HTTP API
* - Transactions are paid with AR tokens and result in permanent, content-addressed storage
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

// Mock upload - stores in IndexDB for demo
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

// Fetch only metadata (title, name, type) without loading full encrypted blob
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
