1. Create the `.env` file from the `.env.template` file with the private key of the creator.
2. Copy `minters.json` into the project root
3. Run `npx tsc && ./build/cli.js check` for the verification status of the NFTs of that creator.
4. Run `npx tsc && ./build/cli.js sign` for signing the unverified ones.
5. Run `npx tsc && ./build/cli.js check` again for the good news ✅✅✅✅. The TX might take a few seconds.