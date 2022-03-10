import { getNFTsByCreator, signNFTs } from '../accesssor';

export async function handler() {
    const nfts = await getNFTsByCreator()
    const resp = await signNFTs(nfts)
    process.stdout.write(resp)
    process.exit(0);
};