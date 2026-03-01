'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCapsule } from '@/hooks/useTimeCapsule';
import { downloadFromArweave } from '@/lib/arweave';
import { decryptFile } from '@/lib/encryption';

export default function CapsuleViewer() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const params = useParams();
    const capsuleId = params.id;

    const { data: capsule, isLoading } = useCapsule(BigInt(capsuleId));

    const [isDecrypting, setIsDecrypting] = useState(false);
    const [error, setError] = useState(null);
    const [decryptedContent, setDecryptedContent] = useState(null);
    const [contentType, setContentType] = useState(null);
    const [fileName, setFileName] = useState(null);

    // Redirect if not connected
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    if (!isConnected) return null;

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading capsule...</p>
                </div>
            </div>
        );
    }

    // Capsule not found
    if (!capsule) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-4xl mb-4">❌</p>
                    <p className="text-gray-500">Capsule not found</p>
                </div>
            </div>
        );
    }

    // Calculate status
    const unlockDate = new Date(Number(capsule.unlockTimestamp) * 1000);
    const now = new Date();
    const isUnlocked = now >= unlockDate;
    const isCancelled = capsule.isCancelled;
    const isBeneficiary = address?.toLowerCase() === capsule.beneficiary.toLowerCase();
    const isCreator = address?.toLowerCase() === capsule.creator.toLowerCase();

    // Calculate time remaining
    const getTimeRemaining = () => {
        if (isUnlocked) return 'Unlocked';

        const diff = unlockDate.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days} days, ${hours} hours`;
        if (hours > 0) return `${hours} hours, ${minutes} minutes`;
        return `${minutes} minutes`;
    };

    // Handle decrypt and view
    const handleDecrypt = async () => {
        if (!isUnlocked) {
            alert('This capsule is still locked!');
            return;
        }

        if (!isBeneficiary) {
            alert('Only the beneficiary can open this capsule');
            return;
        }

        setIsDecrypting(true);
        setError(null);

        try {
            // Step 1: Download from Arweave
            console.log('Downloading from Arweave...');
            const { encryptedData, metadata } = await downloadFromArweave(capsule.arweaveTxId);

            // Step 2: Decrypt the file
            console.log('Decrypting file...');
            const decryptedFile = await decryptFile(
                encryptedData,
                capsule.encryptedKey,
                metadata.name,
                metadata.type
            );

            // Step 3: Create URL for viewing
            const url = URL.createObjectURL(decryptedFile);
            setDecryptedContent(url);
            setContentType(decryptedFile.type);
            setFileName(decryptedFile.name);

        } catch (err) {
            console.error('Error decrypting:', err);
            setError('Failed to decrypt file. ' + err.message);
        } finally {
            setIsDecrypting(false);
        }
    };

    // Handle download
    const handleDownload = () => {
        if (!decryptedContent) return;

        const a = document.createElement('a');
        a.href = decryptedContent;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    // Render content based on file type
    const renderContent = () => {
        if (!decryptedContent) return null;

        // Image files
        if (contentType.startsWith('image/')) {
            return (
                <div className="mt-6">
                    <img
                        src={decryptedContent}
                        alt={fileName}
                        className="max-w-full rounded-lg shadow-lg mx-auto"
                    />
                </div>
            );
        }

        // Text files
        if (contentType.startsWith('text/') || contentType === 'application/json') {
            return (
                <TextViewer url={decryptedContent} />
            );
        }

        // PDF files
        if (contentType === 'application/pdf') {
            return (
                <div className="mt-6">
                    <iframe
                        src={decryptedContent}
                        className="w-full h-96 rounded-lg border border-gray-200"
                        title={fileName}
                    />
                </div>
            );
        }

        // Video files
        if (contentType.startsWith('video/')) {
            return (
                <div className="mt-6">
                    <video
                        src={decryptedContent}
                        controls
                        className="max-w-full rounded-lg shadow-lg mx-auto"
                    />
                </div>
            );
        }

        // Audio files
        if (contentType.startsWith('audio/')) {
            return (
                <div className="mt-6">
                    <audio
                        src={decryptedContent}
                        controls
                        className="w-full"
                    />
                </div>
            );
        }

        // Other files - show download option
        return (
            <div className="mt-6 text-center text-gray-500">
                <p className="text-4xl mb-4">📄</p>
                <p>This file type cannot be previewed.</p>
                <p className="text-sm">Click download to save it.</p>
            </div>
        );
    };

    // Shorten address for display
    const shortAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-purple-600 font-medium"
                    >
                        ← Back to Dashboard
                    </button>
                    <ConnectButton />
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto px-6 py-12">
                {/* Status Icon - Only show if not decrypted yet */}
                {!decryptedContent && (
                    <div className="text-center mb-8">
                        <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center ${
                            isCancelled
                                ? 'bg-red-100'
                                : isUnlocked
                                    ? 'bg-green-100'
                                    : 'bg-gray-200'
                        }`}>
                            <span className="text-5xl">
                                {isCancelled ? '❌' : isUnlocked ? '🔓' : '🔒'}
                            </span>
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mt-6">
                            {isCancelled
                                ? 'CAPSULE CANCELLED'
                                : isUnlocked
                                    ? 'THE TIME HAS COME'
                                    : 'THIS CAPSULE IS SEALED'}
                        </h1>

                        {!isCancelled && !isUnlocked && (
                            <p className="text-gray-500 mt-2">
                                Unlocks in: <span className="font-semibold">{getTimeRemaining()}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* Decrypted Content Display */}
                {decryptedContent && (
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">🎉 Capsule Opened!</h1>
                        <p className="text-gray-500">{fileName}</p>
                        {renderContent()}
                    </div>
                )}

                {/* Capsule Details */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Capsule Details</h2>

                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Capsule ID:</span>
                            <span className="font-medium">#{capsuleId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Creator:</span>
                            <span className="font-medium">{shortAddress(capsule.creator)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Beneficiary:</span>
                            <span className="font-medium">{shortAddress(capsule.beneficiary)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Unlock Date:</span>
                            <span className="font-medium">{unlockDate.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className={`font-medium ${
                                isCancelled
                                    ? 'text-red-600'
                                    : isUnlocked
                                        ? 'text-green-600'
                                        : 'text-yellow-600'
                            }`}>
                                {isCancelled ? 'Cancelled' : isUnlocked ? 'Unlocked' : 'Locked'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Action Buttons */}
                {!isCancelled && isBeneficiary && (
                    <div className="space-y-3">
                        {!decryptedContent ? (
                            <button
                                onClick={handleDecrypt}
                                disabled={!isUnlocked || isDecrypting}
                                className={`w-full py-4 rounded-full font-medium text-lg ${
                                    isUnlocked && !isDecrypting
                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {isDecrypting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Decrypting...
                                    </span>
                                ) : isUnlocked ? (
                                    'Open Capsule 🔓'
                                ) : (
                                    'Locked - Please Wait'
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={handleDownload}
                                className="w-full py-4 rounded-full font-medium text-lg bg-green-600 hover:bg-green-700 text-white"
                            >
                                Download File 📥
                            </button>
                        )}
                    </div>
                )}

                {/* Not beneficiary message */}
                {!isBeneficiary && !isCreator && (
                    <div className="text-center text-gray-500">
                        You are not the beneficiary of this capsule.
                    </div>
                )}

                {/* Creator message */}
                {isCreator && !isBeneficiary && (
                    <div className="text-center text-gray-500">
                        You created this capsule. Only the beneficiary can open it.
                    </div>
                )}
            </main>
        </div>
    );
}

// Component to display text content
function TextViewer({ url }) {
    const [text, setText] = useState('Loading...');

    useEffect(() => {
        fetch(url)
            .then(res => res.text())
            .then(setText)
            .catch(() => setText('Failed to load text content'));
    }, [url]);

    return (
        <div className="mt-6 bg-gray-900 rounded-lg p-4 text-left">
            <pre className="text-green-400 whitespace-pre-wrap overflow-auto max-h-96 text-sm">
                {text}
            </pre>
        </div>
    );
}
