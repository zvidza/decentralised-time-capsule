import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESS, TIMECAPSULE_ABI } from '@/lib/contract';

// Hook to get capsules created by an address
export function useCreatedCapsules(address) {
    return useReadContract({
        address: CONTRACT_ADDRESS,
        abi: TIMECAPSULE_ABI,
        functionName: 'getCreatedCapsules',
        args: [address],
        enabled: !!address, // Only run if adress exists
        });
}

export function useBeneficiaryCapsules(address) {
    return useReadContract({
        address: CONTRACT_ADDRESS,
        abi: TIMECAPSULE_ABI,
        functionName: 'getBeneficiaryCapsules',
        args: [address],
        enabled: !!address,
    });
}

// Hook to get a single capsule by ID
export function useCapsule(id) {
    return useReadContract({
        address: CONTRACT_ADDRESS,
        abi: TIMECAPSULE_ABI,
        functionName: 'getCapsule',
        args: [id],
        enabled: id !== undefined,
    });
}

export function useCapsuleStatus(id) {
    return useReadContract({
        address: CONTRACT_ADDRESS,
        abi: TIMECAPSULE_ABI,
        functionName: 'getCapsuleStatus',
        args: [id],
        enabled: id !== undefined,
    });
}

// Hook to create a new capsule
export function useCreateCapsule() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });

    const createCapsule = async (beneficiary, unlockTimestamp, arweaveTxId, encryptedKey) => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: TIMECAPSULE_ABI,
            functionName: 'createCapsule',
            args: [beneficiary, unlockTimestamp, arweaveTxId, encryptedKey],
        });
    };
    
    return {
        createCapsule,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

// Hook to cancel a capsule
export function useCancelCapsule() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
        hash,
    });
    
    const cancelCapsule = async (id) => {
        writeContract({
            address: CONTRACT_ADDRESS,
            abi: TIMECAPSULE_ABI,
            functionName: 'cancelCapsule',
            args: [id],
        });
    };
    
    return {
        cancelCapsule,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}