import { getNTFsByOwner, creator, getNFTsByCreator } from '../accesssor';

export async function handler() {
    const nfts = await getNFTsByCreator()
    process.stdout.write("\n NFTs creator verification status\n\n")
    for (const nft of nfts) {
        const verifications = nft.metadataOnchain.data.creators?.map(creator => creator.verified ? '✅' : '❌').join("")!;
        process.stdout.write(`${nft.mint.toString().slice(0, 5)}...${nft.mint.toString().slice(-5)}: ${verifications}\n`);
    }
    console.log(await getNFTsByCreator())
    process.exit(0);
};
