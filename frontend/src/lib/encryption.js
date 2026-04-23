// AES-GCM encryption via the Web Crypto API, no external deps needed

// Generate random encryption key
export async function generateKey() {
    const key = await window.crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: 256,
        },
        true, // extractable so it can be exported and stored
        ['encrypt', 'decrypt']
    );
    return key;
}

// Export key to a string (so we can store it)
export async function exportKey(key) {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    // Convert to base64 string
    return btoa(String.fromCharCode(...new Uint8Array(exported)));
}

// Importing key from string
export async function importKey(keyString) {
    // Converting from base64 string
    const keyData = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
    return await window.crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

// Encrypting a file
export async function encryptFile(file) {
    // Generate a random key for this file
    const key = await generateKey();

    // Generate a random IV (initialization vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Read file as array buffer
    const fileBuffer = await file.arrayBuffer();

    // Encrypt the file
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM',iv: iv,},
        key,
        fileBuffer
    );

    // Combine IV + encypted data (IV used for decryption later))
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    // Export the key as a string
    const keyString = await exportKey(key);

    return {
        encryptedData: combined,
        encryptionKey: keyString,
        originalName: file.name,
        originalType: file.type,
    };
}

// Decrypt a file
export async function decryptFile(encryptedData, keyString, fileName, fileType) {
    // Import the key
    const key = await importKey(keyString);

    // Extract the IV (first 12 bytes) and encrpyted content
    const iv = encryptedData.slice(0, 12);
    const content = encryptedData.slice(12);

    // Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv,
        },
        key,
        content
    );

    // Create a File object
    return new File([decryptedBuffer], fileName, { type: fileType });
}
