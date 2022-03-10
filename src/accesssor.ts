import { Borsh } from '@metaplex-foundation/mpl-core';
import { Metadata, MetadataData, MetadataProgram } from '@metaplex-foundation/mpl-token-metadata';
import { NodeWallet } from '@metaplex/js';
import { sendTransaction } from '@metaplex/js/lib/actions';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import * as web3 from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';
import * as bs58 from 'bs58';


export const creator: web3.Keypair = web3.Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY!))
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

export async function getNTFsByOwner(owner: PublicKey): Promise<{
    metadataPDA: web3.PublicKey;
    metadataOnchain: MetadataData;
    address: web3.PublicKey;
    mint: web3.PublicKey;
}[]> {
    const tokens = await connection.getParsedTokenAccountsByOwner(owner, {
        programId: TOKEN_PROGRAM_ID,
    });

    // initial filter - only tokens with 0 decimals & of which 1 is present in the wallet
    const basicInfo = tokens.value
        .filter((t) => {
            const amount = t.account.data.parsed.info.tokenAmount;
            return amount.decimals === 0 && amount.uiAmount === 1;
        })
        .map((t) => ({
            address: new PublicKey(t.pubkey),
            mint: new PublicKey(t.account.data.parsed.info.mint),
        }));

    const dataPromises = basicInfo.map(bi => getMetadataByMint(bi.mint))
    const data = await Promise.all(dataPromises)
    return basicInfo.map((bi, i) => ({ ...bi, ...(data[i]) }))
}

export async function getNFTsByCreator(): Promise<{
    metadataPDA: web3.PublicKey;
    metadataOnchain: MetadataData;
    mint: web3.PublicKey;
}[]> {
    const allMints = require("../minters.json");
    const creatorsMintAddresses: string[] = allMints[creator.publicKey.toString()] || []
    const creatorsMints: PublicKey[] = creatorsMintAddresses.map(m => new PublicKey(m));
    console.log(creatorsMints);

    const dataPromises = creatorsMints.map(getMetadataByMint)
    const data = await Promise.all(dataPromises)
    return data.map((d, i) => ({ ...d, mint: creatorsMints[i] }))
}

class SignMetadataArgs extends Borsh.Data {
    static readonly SCHEMA = SignMetadataArgs.struct([['instruction', 'u8']]);
    instruction = 7;
}

export async function signNFTs(nfts: {
    metadataPDA: web3.PublicKey;
    mint: web3.PublicKey;
}[]): Promise<string> {
    const tx = new web3.Transaction({ feePayer: creator.publicKey })
    for (const nft of nfts) {
        const inst = new web3.TransactionInstruction({
            keys: [
                {
                    pubkey: nft.metadataPDA,
                    isSigner: false,
                    isWritable: true,
                },
                {
                    pubkey: creator.publicKey,
                    isSigner: true,
                    isWritable: false,
                },
            ],
            programId: MetadataProgram.PUBKEY,
            data: SignMetadataArgs.serialize(),
        })
        tx.add(inst)
    }

    return await sendTransaction({
        connection,
        signers: [creator],
        txs: [tx],
        wallet
    })
}