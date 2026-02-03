import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrumSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
    appName: 'Decentralized Time Capsule',
    projectId: 'f7d956f22a9e4c54777c0ccd75efd42c',
    chains: [arbitrumSepolia], //testnet 
    ssr: true, //server-side rendering support
});