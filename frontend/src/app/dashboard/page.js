'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('created');

    // Redirecting to home if wallet disconnects
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    // Don't render until we confirm wallet is connected
    if (!isConnected) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">

            {/* Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔐</span>
                        <span className="font-semibold text-gray-900">Decentralised Tim Capsule App</span>
                    </div>
                    <ConnectButton />
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('created')}
                        className={`px-4 py-2 rounded-full font-medium ${
                            activeTab === 'created'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                        My Sealed Capsules
                    </button>
                    <button
                        onClick={() => setActiveTab('received')}
                        className={`px-4 py-2 rounded-full font-medium ${
                            activeTab === 'received'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-600 border border-gray-200'
                        }`}
                    >
                        Incoming Capsules
                    </button>
                </div>

                {/* Create Button */}
                <button
                    onClick={() => router.push('/create')}
                    className="w-full sm:w-auto mb-8 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-full"
                >
                    Create New Capsule
                </button>

                {/* Content Area */}
                <div className="bg-white rounded-2xl border border-gray-200 p-8">
                    {activeTab === 'created' ? (
                        <div className="text-center text-gray-500 py-12">
                            <p className="text-4xl mb-4">📦</p>
                            <p>You haven't created any capsules yet.</p>
                            <p className="text-sm mt-2">Create your first time capsule to get started!</p>
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-12">
                            <p className="text-4xl mb-4">📬</p>
                            <p>No capsules addressed to you yet.</p>
                            <p className="text-sm mt-2">When someone sends you a capsule, it will appear here.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
