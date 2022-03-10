import { getNonverifiedMetadataPDAsByCreator } from '../accesssor';

export async function handler() {
    const medatadaPDAs = await getNonverifiedMetadataPDAsByCreator()
    process.stdout.write(`There are ${medatadaPDAs.length} non-verified NFTs have been minted by this user.\n`)
    process.exit(0);
};
