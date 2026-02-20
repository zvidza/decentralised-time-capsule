/**
* Arweave Storage Helper
* 
* For this prototype, I use a mock implementation that:
* 1. Stores files in localStorage (for demo purposes)
* 2. Can easily be swapped for real Arweave in production
* 
* In production,:
* - going to choose to Use Irys (Bundlr) or Arweave directly
* - Pay with AR tokens for permanent storage
*/
// Mock upload - stores in localStorage for demo
// Returns a fake "transaction ID" 
export async function uploadToArweave(encryptedData, metadata) {
    // Create a unique ID (simulates Arweave transaction ID)
    const txId = 'ar_' + Date.now() + '_' + Math.random().toString(36).substring(7);
    
    // Convert Uint8Array to base64 for storage
    const base64Data = uint8ArrayToBase64(encryptedData);
    
    // Store in localStorage (mock storage)
    const storageItem = {
        data: base64Data,
        metadata: metadata,
        timestamp: Date.now(),
    };
    
    try {
        localStorage.setItem(txId, JSON.stringify(storageItem));
        console.log('File uploaded with ID:', txId);
        return txId;
    } catch (error) {
        console.error('Storage error:', error);
        throw new Error('Failed to upload file');
    }
}

// Mock download - retrieves from localStorage
export async function downloadFromArweave(txId) {
    try {
        const item = localStorage.getItem(txId);
        if (!item) {
            throw new Error('File not found');
        }
        
        const { data, metadata } = JSON.parse(item);
        
        // Convert base64 back to Uint8Array
        const encryptedData = base64ToUint8Array(data);
        
        return {
            encryptedData,
            metadata,
        };
    
    } catch (error) {
        console.error('Download error:', error);
        throw new Error('Failed to download file');
    }
}

// Helper: Convert Uint8Array to base64
function uint8ArrayToBase64(uint8Array) {
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
}

// Helper: Convert base64 to Uint8Array
function base64ToUint8Array(base64) {
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
    uint8Array[i] = binary.charCodeAt(i);
}
return uint8Array;
}