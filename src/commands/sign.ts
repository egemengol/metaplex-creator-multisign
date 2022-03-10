import { creator, getNTFsByOwner, signNFTs } from '../accesssor';

export async function handler() {
    const nfts = await getNTFsByOwner(creator.publicKey)
    const resp = await signNFTs(nfts)
    process.stdout.write(resp)
    process.exit(0);
};
