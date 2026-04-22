'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {
  const { isConnected } = useAccount();
  const router = useRouter();

  // Redirect to dashboard when wallet connects
  useEffect(() => {
    if (isConnected) {
      router.push('/dashboard');
    }
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      {/* Main Content */}
      <main className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-purple-100 rounded-full flex items-center justify-center">
            <div className="w-20 h-20 bg-purple-200 rounded-2xl flex items-center justify-center">
              <span className="text-4xl">🔐</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Decentralised Time Capsule
        </h1>

        {/* Tagline */}
        <p className="text-gray-600 mb-8">
          Preserve your digital legacy forever on the Permaweb.
        </p>

        {/* Connect Wallet Button */}
        <div className="flex justify-center mb-8">
          <ConnectButton />
        </div>

        {/* Features */}
        <div className="grid grid-rows-3 gap-4 mt-12">
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl">🔐</span>
            </div>
            <p className="text-sm text-gray-600">Client-Side Encryption</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl">💾</span>
            </div>
            <p className="text-sm text-gray-600">Arweave Permanent Storage</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <span className="text-xl">🌐</span>
            </div>
            <p className="text-sm text-gray-600">ENS Compatible</p>
          </div>
        </div>
      </main>
    </div>
  );
}