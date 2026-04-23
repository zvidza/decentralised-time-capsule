// TimeCapsule Contract Configuration
// This connects frontent to deployed smart contract

// Deployment address
export const CONTRACT_ADDRESS = "0xe04fefe1A8005a18387855a0f91a4Af41b54a277";

// Contract ABI - defines how to interact with the contract
// matching funtions in TimeCapsule.sol
export const TIMECAPSULE_ABI = [
  // Creating a new capsule  
{
    inputs: [
        { name: "_beneficiary", type: "address" },
        { name: "_unlockTimestamp", type: "uint256" },
        { name: "_arweaveTxId", type: "string" },
        { name: "_encryptedKey", type: "string" }
    ],
    name: "createCapsule",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function"
},
  // Getting capsule by ID
{
    inputs: [{ name: "_id", type: "uint256" }],
    name: "getCapsule",
    outputs: [
        {
        components: [
            { name: "id", type: "uint256" },
            { name: "creator", type: "address" },
            { name: "beneficiary", type: "address" },
            { name: "unlockTimestamp", type: "uint256" },
            { name: "arweaveTxId", type: "string" },
            { name: "encryptedKey", type: "string" },
            { name: "isCancelled", type: "bool" }
        ],
        name: "",
        type: "tuple"
    }
    ],
    stateMutability: "view",
    type: "function"
},
  // Getting capsules created by address
{
    inputs: [{ name: "_creator", type: "address" }],
    name: "getCreatedCapsules",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
},
  // Getting capsules where address is beneficiary
{
    inputs: [{ name: "_beneficiary", type: "address" }],
    name: "getBeneficiaryCapsules",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function"
},
  // Cancelling a capsule
{
    inputs: [{ name: "_id", type: "uint256" }],
    name: "cancelCapsule",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
},
  // Checking if capsule is unlocked
{
    inputs: [{ name: "_id", type: "uint256" }],
    name: "isCapsuleUnlocked",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
},
  // Getting capsule status
{
    inputs: [{ name: "_id", type: "uint256" }],
    name: "getCapsuleStatus",
    outputs: [{ name: "status", type: "string" }],
    stateMutability: "view",
    type: "function"
},
  // Events
{
    anonymous: false,
    inputs: [
        { indexed: true, name: "id", type: "uint256" },
        { indexed: true, name: "creator", type: "address" },
        { indexed: true, name: "beneficiary", type: "address" },
        { indexed: false, name: "unlockTimestamp", type: "uint256" }
    ],
    name: "CapsuleCreated",
    type: "event"
}
];