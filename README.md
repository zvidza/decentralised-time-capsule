# Decentralised Time Capsule

A Web3 decentralised application (dApp) that allows users to create, encrypt, and store digital time capsules on the blockchain. Capsules are locked until a specified date, ensuring secure and immutable preservation of digital memories

## Live Demo

https://web3-decentralised-time-capsule-alpha.vercel.app

## Features

- **Wallet Connection** - Connect via MetaMask or WalletConnect
- **Create Capsules** - Upload files with a beneficiary and unlock date
- **Client-Side Encryption** - Files encrypted using AES-256 before storage
- **Time-Lock Mechanism** - Smart contract enforces unlock dates
- **Decentralised Storage** - Files stored on Arweave (mock implementation for prototype)
- **Cancel Capsules** - Creators can cancel before unlock time
- **Multi-File Support** - Images, PDFs, text, video, and audio

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js, React, Tailwind CSS |
| Wallet | RainbowKit, wagmi, viem |
| Blockchain | Arbitrum Sepolia (Ethereum L2) |
| Smart Contract | Solidity, Hardhat, OpenZeppelin |
| Storage | Arweave (mock: localStorage) |
| Encryption | Web Crypto API (AES-GCM 256-bit) |

## Smart Contract

- **Network:** Arbitrum Sepolia
- **Address:** `0xe04fefe1A8005a18387855a0f91a4Af41b54a277`
- **View on Explorer:** [Arbiscan](https://sepolia.arbiscan.io/address/0xe04fefe1A8005a18387855a0f91a4Af41b54a277)

## Getting Started

### Prerequisites

- Node.js (v18+)
- MetaMask wallet
- Sepolia ETH for gas ([Arbitrum Faucet](https://faucet.arbitrum.io/))

### Installation

1. Clone the repository
```bash
   git clone https://github.com/zvidza/decentralised-time-capsule.git
   cd decentralised-time-capsule
```

2. Install dependencies
```bash
   cd frontend
   npm install
```

3. Run the development server
```bash
   npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

### Smart Contract Deployment (Optional)

1. Install Hardhat dependencies
```bash
   cd ..
   npm install
```

2. Create `.env` file with:
ALCHEMY_API_KEY=your_alchemy_key
PRIVATE_KEY=your_wallet_private_key

3. Deploy to Arbitrum Sepolia
```bash
   npx hardhat run scripts/deploy.mjs --network arbitrumSepolia
```

## Project Structure
├── contracts/
│   └── TimeCapsule.sol        # Smart contract
├── scripts/
│   └── deploy.mjs             # Deployment script
├── frontend/
│   └── src/
│       ├── app/               # Next.js pages
│       ├── components/        # React components
│       ├── hooks/             # Custom hooks
│       └── lib/               # Utilities
└── README.md

## Limitations

- **Mock Arweave:** Prototype uses localStorage instead of real Arweave. Cross-browser retrieval not supported

- **Mock LIT Protocol:** Time lock decryption uses a simulated LIT Protocol integration. Actual threshold cryptography and distributed key management are not performed; unlock access is enforced solely by the smart contract on-chain

- **Testnet Only:** Deployed on Arbitrum Sepolia, not mainnet

## Author

Tadiwanashe Mandizvidza

## License

This project is part of an academic dissertation
