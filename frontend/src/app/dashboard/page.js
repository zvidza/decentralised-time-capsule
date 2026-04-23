'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreatedCapsules, useBeneficiaryCapsules, useCapsule } from '@/hooks/useTimeCapsule';
import { isCapsuleOpened } from '@/lib/openedCapsules';
import { getMetadataFromArweave } from '@/lib/arweave';

// Component to display a single capsule card
function CapsuleCard({ capsuleId, isCreator, address }) {
    const router = useRouter();
    const { data: capsule, isLoading } = useCapsule(capsuleId);
    const [capsuleTitle, setCapsuleTitle] = useState(null);

    useEffect(() => {
        if (capsule?.arweaveTxId) {
            getMetadataFromArweave(capsule.arweaveTxId)
                .then((meta) => { if (meta?.title) setCapsuleTitle(meta.title); })
                .catch(() => {});
        }
    }, [capsule?.arweaveTxId]);

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
    const hasBeenOpened = isCapsuleOpened(address, capsuleId);

    // Determine status
    let status = 'Locked';
    let statusColor = 'bg-yellow-100 text-yellow-800';
    let statusIcon = '🔒';

    if (isCancelled) {
        status = 'Cancelled';
        statusColor = 'bg-red-100 text-red-800';
        statusIcon = '❌';
    } else if (hasBeenOpened) {
        status = 'Opened';
        statusColor = 'bg-blue-100 text-blue-800';
        statusIcon = '📂';
    } else if (isUnlocked) {
        status = 'Ready';
        statusColor = 'bg-green-100 text-green-800';
        statusIcon = '🔓';
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
                    {statusIcon} {status}
                </span>
            </div>

            <h3 className="font-semibold text-gray-900 mb-1">
                {capsuleTitle || `Capsule #${capsuleId.toString()}`}
            </h3>
            {capsuleTitle && (
                <p className="text-xs text-gray-400 mb-1">#{capsuleId.toString()}</p>
            )}

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

// Wrapper component to filter capsules
function FilteredCapsuleCard({ capsuleId, isCreator, address, filter }) {
    const { data: capsule, isLoading } = useCapsule(capsuleId);

    if (isLoading || !capsule) return null;

    const isUnlocked = Date.now() >= Number(capsule.unlockTimestamp) * 1000;
    const isCancelled = capsule.isCancelled;
    const hasBeenOpened = isCapsuleOpened(address, capsuleId);

    // Apply filter
    if (filter === 'sent') {
        // Show all created capsules
        return <CapsuleCard capsuleId={capsuleId} isCreator={isCreator} address={address} />;
    }

    if (filter === 'pending') {
        // Show only locked, non-cancelled capsules
        if (isCancelled || isUnlocked) return null;
        return <CapsuleCard capsuleId={capsuleId} isCreator={isCreator} address={address} />;
    }

    if (filter === 'ready') {
        // Show unlocked but not yet opened capsules
        if (isCancelled || !isUnlocked || hasBeenOpened) return null;
        return <CapsuleCard capsuleId={capsuleId} isCreator={isCreator} address={address} />;
    }

    if (filter === 'history') {
        // Show only opened capsules
        if (!hasBeenOpened) return null;
        return <CapsuleCard capsuleId={capsuleId} isCreator={isCreator} address={address} />;
    }

    return null;
}

export default function Dashboard() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('sent');

    // Fetch capsules from blockchain
    const { data: createdIds, isLoading: loadingCreated } = useCreatedCapsules(address);
    const { data: beneficiaryIds, isLoading: loadingBeneficiary } = useBeneficiaryCapsules(address);

    // Redirect to home if wallet disconnects
    useEffect(() => {
        if (!isConnected) {
            router.push('/');
        }
    }, [isConnected, router]);

    // Dont render until we confirm wallet is connected
    if (!isConnected) {
        return null;
    }

    const isLoading = loadingCreated || loadingBeneficiary;

    // Determine which capsules to show based on tab
    const getCapsulesToShow = () => {
        if (activeTab === 'sent') {
            return { ids: createdIds || [], isCreator: true };
        } else {
            return { ids: beneficiaryIds || [], isCreator: false };
        }
    };

    const { ids: capsuleIds, isCreator } = getCapsulesToShow();

    // Tab configuration
    const tabs = [
        { id: 'sent', label: 'Sent', icon: '📤', description: 'Capsules you created' },
        { id: 'pending', label: 'Pending', icon: '📥', description: 'Waiting to unlock' },
        { id: 'ready', label: 'Ready', icon: '🔓', description: 'Ready to open' },
        { id: 'history', label: 'History', icon: '📂', description: 'Already opened' },
    ];

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
                <div className="flex flex-wrap gap-3 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:border-purple-300'
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Description */}
                <p className="text-gray-500 text-sm mb-6">
                    {tabs.find(t => t.id === activeTab)?.description}
                </p>

                {/* Create Button - Only show on Sent tab */}
                {activeTab === 'sent' && (
                    <button
                        onClick={() => router.push('/create')}
                        className="w-full sm:w-auto mb-8 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-full"
                    >
                        Create New Capsule
                    </button>
                )}

                {/* Content Area */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading capsules...</p>
                    </div>
                ) : capsuleIds && capsuleIds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {capsuleIds.map((id) => (
                            <FilteredCapsuleCard
                                key={id.toString()}
                                capsuleId={id}
                                isCreator={isCreator}
                                address={address}
                                filter={activeTab}
                            />
                        ))}
                    </div>
                ) : (
                    <EmptyState tab={activeTab} onCreateClick={() => router.push('/create')} />
                )}
            </main>
        </div>
    );
}

// Empty state component
function EmptyState({ tab, onCreateClick }) {
    const emptyMessages = {
        sent: {
            icon: '📤',
            title: "You haven't sent any capsules yet",
            subtitle: 'Create your first time capsule to get started!',
            showButton: true,
        },
        pending: {
            icon: '📥',
            title: 'No pending capsules',
            subtitle: 'Capsules waiting to unlock will appear here.',
            showButton: false,
        },
        ready: {
            icon: '🔓',
            title: 'No capsules ready to open',
            subtitle: 'When a capsule unlocks, it will appear here.',
            showButton: false,
        },
        history: {
            icon: '📂',
            title: 'No opened capsules yet',
            subtitle: 'Capsules you have opened will appear here.',
            showButton: false,
        },
    };

    const message = emptyMessages[tab];

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="text-center text-gray-500 py-12">
                <p className="text-4xl mb-4">{message.icon}</p>
                <p className="font-medium text-gray-700">{message.title}</p>
                <p className="text-sm mt-2">{message.subtitle}</p>
                {message.showButton && (
                    <button
                        onClick={onCreateClick}
                        className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-full"
                    >
                        Create Capsule
                    </button>
                )}
            </div>
        </div>
    );
}
