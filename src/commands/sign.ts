import { getNonverifiedMetadataPDAsByCreator, signNFTs } from '../accesssor';

export async function handler() {
    const medatadaPDAs = await getNonverifiedMetadataPDAsByCreator()
    if (medatadaPDAs.length === 0) {
        process.stdout.write(`There are ${medatadaPDAs.length} non-verified NFTs have been minted by this user.\nNo action taken.\n`)
    } else {
        await signNFTs(medatadaPDAs)
    }
    process.exit(0);
};
