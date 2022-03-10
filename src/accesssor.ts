import { Metadata, SignMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { NodeWallet } from "@metaplex/js";
import * as web3 from "@solana/web3.js";
import { Keypair, PublicKey } from "@solana/web3.js";
import * as bs58 from "bs58";

export const creator: Keypair = Keypair.fromSecretKey(
  bs58.decode(process.env.PRIVATE_KEY!)
);
export const connection = new web3.Connection(
  web3.clusterApiUrl("mainnet-beta"),
  "confirmed"
);
export const wallet = new NodeWallet(creator);

async function getMetadataByMint(mint: PublicKey) {
  const pda = await Metadata.getPDA(mint);
  let onchain = (await Metadata.load(connection, pda)).data;

  return {
    metadataPDA: pda,
    metadataOnchain: onchain,
  };
}

export async function getNonverifiedMetadataPDAsByCreator(): Promise<web3.PublicKey[]> {
  const allMints = require("../minters.json");
  const creatorsMintAddresses: string[] = allMints[creator.publicKey.toString()] || []
  const creatorsMints: PublicKey[] = creatorsMintAddresses.map(m => new PublicKey(m));

  const dataPromises = creatorsMints.map(getMetadataByMint)
  const data = await Promise.all(dataPromises)
  return data
    .map((d, i) => ({ ...d, mint: creatorsMints[i] }))
    .filter(nft =>
      !(nft.metadataOnchain.data.creators?.find(creator => creator.verified)))
    .map(nft => nft.metadataPDA);
}

export async function signNFTs(metadataPDAs: web3.PublicKey[]): Promise<string> {
  const tx = new web3.Transaction({ feePayer: creator.publicKey })
  for (const metadataPDA of metadataPDAs) {
    // This tx includes one instruction for a given sign.
    // We are extracting the inst into our multi-inst tx.
    const singleSignerTx = new SignMetadata(
      { feePayer: wallet.publicKey },
      {
        metadata: metadataPDA,
        creator: creator.publicKey,
      }
    )
    tx.add(singleSignerTx.instructions[0])
  }
  return connection.sendTransaction(tx, [creator])
}
