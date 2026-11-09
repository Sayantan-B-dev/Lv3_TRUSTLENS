/**
 * Deploy ReportRegistry to a running local chain and print the address.
 *
 *   pnpm --dir contracts node          # terminal 1
 *   pnpm --dir contracts deploy:local  # terminal 2
 *
 * The fallback key is Hardhat's well-known account #0. It is public, must only
 * ever be used against a local development chain, and holds no real funds.
 */
import { readFileSync } from "node:fs";
import { ethers } from "ethers";

const DEV_KEY =
  process.env.CHAIN_PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const RPC_URL = process.env.CHAIN_RPC_URL ?? "http://127.0.0.1:8545";

const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(DEV_KEY, provider);

const artifact = JSON.parse(
  readFileSync("artifacts/contracts/ReportRegistry.sol/ReportRegistry.json", "utf8"),
);

const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
const contract = await factory.deploy();
await contract.waitForDeployment();

const address = await contract.getAddress();
console.log("ReportRegistry deployed to:", address);
console.log("Chain ID:", (await provider.getNetwork()).chainId.toString());
console.log("Deployer:", wallet.address);
console.log("\nAdd this to .env:");
console.log(`CHAIN_CONTRACT_ADDRESS=${address}`);
