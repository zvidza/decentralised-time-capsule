import { LitNodeClient } from '@lit-protocol/lit-node-client';
import { LIT_ABILITY } from '@lit-protocol/constants';
import { LitAccessControlConditionResource, createSiweMessage } from '@lit-protocol/auth-helpers';

let _litClient = null;

export async function getLitClient() {
    if (typeof window === 'undefined') return null;
    if (_litClient?.ready) return _litClient;

    _litClient = null;

    const client = new LitNodeClient({
        litNetwork: 'datil',
        debug: false,
        connectTimeout: 60000,
    });

    await client.connect();
    _litClient = client;
    return _litClient;
}

export function buildAccessControlConditions(beneficiaryAddress, unlockTimestamp) {
    return [
        {
            contractAddress: '',
            standardContractType: 'timestamp',
            chain: 'arbitrumSepolia',
            method: 'eth_getBlockByNumber',
            parameters: ['latest'],
            returnValueTest: {
                comparator: '>=',
                value: unlockTimestamp.toString(),
            },
        },
        { operator: 'and' },
        {
            contractAddress: '',
            standardContractType: '',
            chain: 'arbitrumSepolia',
            method: '',
            parameters: [':userAddress'],
            returnValueTest: {
                comparator: '=',
                value: beneficiaryAddress.toLowerCase(),
            },
        },
    ];
}

async function getSessionSigsOnce(litClient, walletClient, address) {
    return await litClient.getSessionSigs({
        chain: 'arbitrumSepolia',
        expiration: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
        resourceAbilityRequests: [
            {
                resource: new LitAccessControlConditionResource('*'),
                ability: LIT_ABILITY.AccessControlConditionDecryption,
            },
        ],
        authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
            const nonce = await litClient.getLatestBlockhash();

            const message = await createSiweMessage({
                uri,
                expiration,
                resources: resourceAbilityRequests,
                walletAddress: address,
                nonce,
                domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
                chainId: 421614,
                litNodeClient: litClient,
            });

            const signature = await walletClient.signMessage({ message });

            return {
                sig: signature,
                derivedVia: 'web3.eth.personal.sign',
                signedMessage: message,
                address: address,
            };
        },
    });
}

export async function getSessionSigs(litClient, walletClient, address, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await getSessionSigsOnce(litClient, walletClient, address);
        } catch (err) {
            const isRateLimit = err?.message?.includes('rate_limit_exceeded') || err?.message?.includes('Rate limit');
            if (isRateLimit && attempt < retries) {
                await new Promise(r => setTimeout(r, 3000 * attempt));
                continue;
            }
            throw err;
        }
    }
}

export async function encryptKeyWithLit(aesKeyString, accessControlConditions) {
    const client = await getLitClient();

    const { ciphertext, dataToEncryptHash } = await client.encrypt({
        accessControlConditions,
        dataToEncrypt: new TextEncoder().encode(aesKeyString),
    });

    return { ciphertext, dataToEncryptHash };
}

export async function decryptKeyWithLit({ ciphertext, dataToEncryptHash, accessControlConditions, sessionSigs }) {
    const client = await getLitClient();

    const { decryptedData } = await client.decrypt({
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        sessionSigs,
        chain: 'arbitrumSepolia',
    });

    return new TextDecoder().decode(decryptedData).replace(/\0/g, '').trim();
}
