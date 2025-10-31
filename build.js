// @ts-nocheck
// build.js - Compile Helios validator to Plutus
import { readFileSync, writeFileSync } from "fs";
import { Program } from "@helios-lang/compiler";
import { makeByteArrayData } from "@helios-lang/uplc";
import { makeMintingPolicyHash } from "@helios-lang/ledger";

function bytesToHex(bytes) {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Parse command line arguments
const args = process.argv.slice(2);
let nftPolicy = null;
let nftName = null;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--nft-policy' && i + 1 < args.length) {
    nftPolicy = args[i + 1];
    i++; // Skip next argument
  } else if (args[i] === '--nft-name' && i + 1 < args.length) {
    nftName = args[i + 1];
    i++; // Skip next argument
  }
}

// Validate required arguments
if (!nftPolicy || !nftName) {
  console.error("❌ Missing required arguments!");
  console.error("Usage: node build.js --nft-policy <policy_id> --nft-name <token_name_hex>");
  console.error("Example: node build.js --nft-policy 14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61f --nft-name 54657374546F6B656E");
  process.exit(1);
}

try {
  // Read and compile the Helios validator
  const src = readFileSync(new URL("./validators/validator.hl", import.meta.url)).toString();
  const program = new Program(src);

  // Set the NFT_POLICY parameter
  const mintingPolicyHash = makeMintingPolicyHash(nftPolicy);
  const nftPolicySet = program.changeParam("redeemer_equals_datum::NFT_POLICY", mintingPolicyHash);
  
  if (!nftPolicySet) {
    throw new Error("Failed to set parameter NFT_POLICY");
  }

  // Set the NFT_NAME parameter
  const nftNameBytes = makeByteArrayData(hexToBytes(nftName));
  const nftNameSet = program.changeParam("redeemer_equals_datum::NFT_NAME", nftNameBytes);

  if (!nftNameSet) {
    throw new Error("Failed to set parameter NFT_NAME");
  }

  const uplc = program.compile();

  // Create Plutus JSON format
  const plutusJson = {
    type: uplc.plutusVersion,
    description: "Created with Helios",
    cborHex: bytesToHex(uplc.toCbor())
  };

  console.log(JSON.stringify(plutusJson));
} catch (error) {
  console.error("❌ Compilation failed!");
  console.error("\nError details:");
  console.error(error.message);
  
  if (error.stack) {
    console.error("\nStack trace:");
    console.error(error.stack);
  }
  
  process.exit(1);
}

