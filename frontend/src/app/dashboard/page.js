'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreatedCapsules, useBeneficiaryCapsules, useCapsule } from '@/hooks/useTimeCapsule';

// Component to display a single capsule card
function CapsuleCard({ capsuleId, isCreator }) {
    const router = useRouter();
    const { data: capsule, isLoading } = useCapsule(capsuleId);

    if (isLoading) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (!capsule) return null;

    // Convert timestamp to readable date
    const unlockDate = new Date(Number(capsule.unlockTimestamp) * 1000);
    const isUnlocked = Date.now() >= unlockDate.getTime();
    const isCancelled = capsule.isCancelled;

    // Determine status
    let status = 'Locked';
    let statusColor = 'bg-yellow-100 text-yellow-800';
    if (isCancelled) {
        status = 'Cancelled';
        statusColor = 'bg-red-100 text-red-800';
    } else if (isUnlocked) {
        status = 'Unlocked';
        statusColor = 'bg-green-100 text-green-800';
    }

    // Shorten addresses for display
    const shortAddress = (addr) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

    // Handle click to view capsule
    const handleClick = () => {
        router.push(`/capsule/${capsuleId.toString()}`);
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="text-2xl">📦</div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {status}
                </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">Capsule #{capsuleId.toString()}</h3>

            <p className="text-sm text-gray-500 mb-3">
                {isCreator ? (
                    <>To: {shortAddress(capsule.beneficiary)}</>
                ) : (
                    <>From: {shortAddress(capsule.creator)}</>
                )}
            </p>

            <p className="text-sm text-gray-600">
                {isUnlocked ? 'Unlocked on: ' : 'Unlocks on: '}
                {unlockDate.toLocaleDateString()} {unlockDate.toLocaleTimeString()}
            </p>

            <p className="text-purple-600 text-sm mt-3 font-medium">
                Click to view →
            </p>
        </div>
    );
}

export default function Dashboard() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('created');

    // Fetch capsules from blockchain
    const { data: createdIds, isLoading: loadingCreated } = useCreatedCapsules(address);
    const { data: beneficiaryIds, isLoading: loadingBeneficiary } = useBeneficiaryCapsules(address);

    // Redirect to home if wallet disconnects
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    // Don't render until we confirm wallet is connected
    if (!isConnected) {
        return null;
    }

    const isLoading = activeTab === 'created' ? loadingCreated : loadingBeneficiary;
    const capsuleIds = activeTab === 'created' ? createdIds : beneficiaryIds;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Bar */}
            <nav className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">🔐</span>
                        <span className="font-semibold text-gray-900">Decentralised Time Capsule App</span>
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
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading capsules...</p>
                    </div>
                ) : capsuleIds && capsuleIds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {capsuleIds.map((id) => (
                            <CapsuleCard
                                key={id.toString()}
                                capsuleId={id}
                                isCreator={activeTab === 'created'}
                            />
                        ))}
                    </div>
                ) : (
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
                )}
            </main>
        </div>
    );
}
