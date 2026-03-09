//This track all the capsules that have been opened by user. 
const STORAGE_KEY = 'openedCapsules';

// Get all opened capsule IDs for an address
export function getOpenedCapsules(address) {
    if (!address) return [];
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return [];

        const allOpened = JSON.parse(data);
        return allOpened[address.toLowerCase()] || [];
    } catch {
        return [];
    }
}

// Mark a capsule as opened
export function markCapsuleAsOpened(address, capsuleId) {
    if (!address) return;

    try {
        const data = localStorage.getItem(STORAGE_KEY);
        const allOpened = data ? JSON.parse(data) : {};

        const userOpened = allOpened[address.toLowerCase()] || [];

        // Add if not already in list
        if (!userOpened.includes(capsuleId.toString())) {
            userOpened.push(capsuleId.toString());
            allOpened[address.toLowerCase()] = userOpened;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allOpened));
        }
    } catch (error) {
        console.error('Error saving opened capsule:', error);
    }
}

// Check if a capsule has been opened
export function isCapsuleOpened(address, capsuleId) {
    const opened = getOpenedCapsules(address);
    return opened.includes(capsuleId.toString());
}
