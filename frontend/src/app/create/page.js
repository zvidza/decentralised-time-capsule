'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCreateCapsule } from '@/hooks/useTimeCapsule';
import { encryptFile } from '@/lib/encryption';
import { uploadToArweave } from '@/lib/arweave';

export default function CreateCapsule() {
  const { isConnected } = useAccount();
  const router = useRouter();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Form data
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [unlockDate, setUnlockDate] = useState('');

  // Contract hook
  const { createCapsule, isPending, isConfirming, isSuccess, error } = useCreateCapsule();

  // Redirect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  // Redirect to dashboard on success
  useEffect(() => {
    if (isSuccess) {
      alert('Capsule created successfully!');
      router.push('/dashboard');
    }
  }, [isSuccess, router]);

  if (!isConnected) return null;

// Handle file selection
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

// Navigation between steps
  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

// Handle form submission
const handleSubmit = async () => {
  try {
    // Validate inputs
    if (!file) {
      alert('Please select a file');
      return;
    }
    
    if (!beneficiary || !unlockDate) {
      alert('Please fill in all fields');
      return;
    }

    // Validate beneficiary address
    if (!beneficiary.startsWith('0x') || beneficiary.length !== 42) {
      alert('Please enter a valid wallet address (0x...)');
      return;
    }

    // Convert date to Unix timestamp (seconds)
    const unlockTimestamp = BigInt(Math.floor(new Date(unlockDate).getTime() / 1000));

    // Check if unlock date is in the future
    if (unlockTimestamp <= BigInt(Math.floor(Date.now() / 1000))) {
      alert('Unlock date must be in the future');
      return;
    }

    // Step 1: Encrypt the file
    console.log('Encrypting file...');
    const { encryptedData, encryptionKey, originalName, originalType } = await encryptFile(file);
    
    // Step 2: Upload to Arweave
    console.log('Uploading to Arweave...');
    const arweaveTxId = await uploadToArweave(encryptedData, {
      name: originalName,
      type: originalType,
      title: title,
    });
    
    // Step 3: Call the smart contract
    console.log('Creating capsule on blockchain...');
    await createCapsule(beneficiary, unlockTimestamp, arweaveTxId, encryptionKey);

  } catch (err) {
    console.error('Error creating capsule:', err);
    alert('Error creating capsule. Check console for details.');
  }
};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-purple-600 font-medium"
          >
            ← Back
          </button>
          <span className="font-semibold text-gray-900">Create New Capsule</span>
          <ConnectButton />
        </div>
      </nav>

      {/* Progress Steps */}
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                currentStep >= step
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? '✓' : step}
              </div>
              {step < 3 && (
                <div className={`w-20 h-1 ${
                  currentStep > step ? 'bg-purple-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-sm">
          <span className={currentStep >= 1 ? 'text-purple-600' : 'text-gray-400'}>1. Artifact</span>
          <span className={currentStep >= 2 ? 'text-purple-600' : 'text-gray-400'}>2. Conditions</span>
          <span className={currentStep >= 3 ? 'text-purple-600' : 'text-gray-400'}>3. Seal</span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            Error: {error.message}
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white rounded-2xl border border-gray-200 p-8">

          {/* Step 1: Upload File */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-black font-semibold mb-4">Upload Your Artifact</h2>
              <p className="text-gray-600 mb-6">Select the file you want to preserve in your time capsule.</p>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-4">📁</div>
                  {file ? (
                    <p className="text-purple-600 font-medium">{file.name}</p>
                  ) : (
                    <p className="text-gray-500">Click to select a file</p>
                  )}
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Set Conditions */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Set Conditions</h2>
              <p className="text-red-600 mb-6">Define who can open this capsule and when.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a public title"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beneficiary Wallet Address</label>
                  <input
                    type="text"
                    value={beneficiary}
                    onChange={(e) => setBeneficiary(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unlock Date</label>
                  <input
                    type="datetime-local"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Confirm and Seal */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Seal Your Capsule</h2>
              <p className="text-black-600 mb-6">Review your capsule details before sealing.</p>

              <div className="bg-gray-50 rounded-xl p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-black-500">File:</span>
                  <span className="font-medium">{file?.name || 'No file selected'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black-500">Title:</span>
                  <span className="font-medium">{title || 'Untitled'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black-500">Beneficiary:</span>
                  <span className="font-medium text-sm">
                    {beneficiary ? `${beneficiary.slice(0, 6)}...${beneficiary.slice(-4)}` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black-500">Unlock Date:</span>
                  <span className="font-medium">
                    {unlockDate ? new Date(unlockDate).toLocaleString() : 'Not set'}
                  </span>
                </div>
              </div>

              {/* Transaction Status */}
              {(isPending || isConfirming) && (
                <div className="mt-6 text-center">
                  <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-gray-600">
                    {isPending ? 'Waiting for wallet approval...' : 'Confirming transaction...'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={prevStep}
            disabled={currentStep === 1 || isPending || isConfirming}
            className={`px-6 py-2 rounded-full font-medium ${
              currentStep === 1 || isPending || isConfirming
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-purple-600 hover:bg-purple-50'
            }`}
          >
            ← Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={nextStep}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-2 rounded-full"
            >
              Proceed To Next Step →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending || isConfirming}
              className={`font-medium px-6 py-2 rounded-full ${
                isPending || isConfirming
                  ? 'bg-gray-400 cursor-not-allowed text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isPending || isConfirming ? 'Processing...' : 'Seal Capsule 🔐'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}