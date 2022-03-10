import { creator, getNFTsByCreator } from '../accesssor';

export async function handler() {
    const nfts = await getNFTsByCreator()
    process.stdout.write("\n NFTs creator verification status\n\n")
    for (const nft of nfts) {
        const isVerified = nft.metadataOnchain.data.creators?.find(c => c.address == creator.publicKey.toString())?.verified;
        if (isVerified === undefined) {
            process.stderr.write("Wrong data somewhere")
            process.exit(1);
        } else {
            process.stderr.write(`${nft.mint.toString()}: ${isVerified ? '✅' : '❌'}`)
        }
        process.stdout.write("\n");
    }
    process.exit(0);
};
