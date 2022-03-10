import { Metadata, MetadataData, SignMetadata } from '@metaplex-foundation/mpl-token-metadata';
import { NodeWallet } from '@metaplex/js';
import * as web3 from '@solana/web3.js';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';


export const creator: Keypair = Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
export const connection = new web3.Connection(web3.clusterApiUrl('mainnet-beta'), 'confirmed');
export const wallet = new NodeWallet(creator);

async function getMetadataByMint(
    mint: PublicKey,
) {
    const pda = await Metadata.getPDA(mint);
    const onchain = (await Metadata.load(connection, pda)).data;
    return {
        metadataPDA: pda,
        metadataOnchain: onchain,
    };
}

export async function getNFTsByCreator(): Promise<{
    metadataPDA: web3.PublicKey;
    metadataOnchain: MetadataData;
    mint: web3.PublicKey;
}[]> {
    const allMints = require("../minters.json");
    const creatorsMintAddresses: string[] = allMints[creator.publicKey.toString()] || []
    const creatorsMints: PublicKey[] = creatorsMintAddresses.map(m => new PublicKey(m));

    const dataPromises = creatorsMints.map(getMetadataByMint)
    const data = await Promise.all(dataPromises)
    return data.map((d, i) => ({ ...d, mint: creatorsMints[i] }))
}

export async function signNFTs(nfts: {
    metadataPDA: web3.PublicKey;
    mint: web3.PublicKey;
}[]): Promise<string> {
    const tx = new web3.Transaction({ feePayer: creator.publicKey })
    for (const nft of nfts) {
        // This tx includes one instruction for a given sign.
        // We are extracting the inst into our multi-inst tx.
        const singleSignerTx = new SignMetadata(
            { feePayer: wallet.publicKey },
            {
                metadata: nft.metadataPDA,
                creator: creator.publicKey,
            }
        )
        tx.add(singleSignerTx.instructions[0])
    }
    return connection.sendTransaction(tx, [creator])
}