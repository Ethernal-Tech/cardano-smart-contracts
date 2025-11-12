// @ts-nocheck
// test/helpers.js - Test helper functions for building ScriptContext
import { readFileSync } from "fs";
import { Program } from "@helios-lang/compiler";
import {
  makeIntData,
  makeByteArrayData,
  makeListData,
  makeMapData,
  makeConstrData
} from "@helios-lang/uplc";
import { makeMintingPolicyHash } from "@helios-lang/ledger";

/**
 * Compile the Helios validator and return the compiled UPLC program
 */
export function compileValidator() {
  const src = readFileSync(new URL("../validators/validator.hl", import.meta.url)).toString();
  const program = new Program(src);

  const mintinPolicyHash = makeMintingPolicyHash("14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61f")
  const nftPolicySet = program.changeParam("redeemer_equals_datum::NFT_POLICY", mintinPolicyHash)
  
  if (!nftPolicySet) {
    throw new Error("Failed to set parameter NFT_POLICY");
  }

  const nftName = makeByteArrayData(hexToBytes("54657374546F6B656E"))
  const nftNameSet = program.changeParam("redeemer_equals_datum::NFT_NAME", nftName)

  if (!nftNameSet) {
    throw new Error("Failed to set parameter NFT_NAME");
  }

  return program.compile();
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToBytes(hex) {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Decode a Bech32 address (addr_test... or addr...) to raw bytes
 * This is a simplified decoder - for production use a proper library like @emurgo/cardano-serialization-lib
 * 
 * @param {string} bech32Address - The Bech32 encoded address (e.g., addr_test1...)
 * @returns {Uint8Array} - The raw address bytes
 */
export function bech32AddressToBytes(bech32Address) {
  // Bech32 character set
  const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
  
  // Remove prefix and separator
  const parts = bech32Address.toLowerCase().split('1');
  if (parts.length !== 2) {
    throw new Error('Invalid Bech32 address format');
  }
  
  const data = parts[1];
  
  // Decode Bech32 data part
  const decoded = [];
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    const value = CHARSET.indexOf(char);
    if (value === -1) {
      throw new Error(`Invalid character in Bech32 address: ${char}`);
    }
    decoded.push(value);
  }
  
  // Remove checksum (last 6 characters)
  const withoutChecksum = decoded.slice(0, -6);
  
  // Convert from 5-bit to 8-bit
  const bytes = [];
  let accumulator = 0;
  let bits = 0;
  
  for (const value of withoutChecksum) {
    accumulator = (accumulator << 5) | value;
    bits += 5;
    
    while (bits >= 8) {
      bits -= 8;
      bytes.push((accumulator >> bits) & 0xff);
    }
  }
  
  return new Uint8Array(bytes);
}

/**
 * Helper to handle both hex and Bech32 addresses
 * @param {string} address - Either hex string or Bech32 address (addr_test... or addr...)
 * @returns {Uint8Array} - The address bytes
 */
export function addressToBytes(address) {
  if (address.startsWith('addr_test') || address.startsWith('addr')) {
    return bech32AddressToBytes(address);
  } else {
    // Assume it's a hex string
    return hexToBytes(address);
  }
}

/**
 * Build a Value map containing exactly 1 unit of an NFT
 * @param {string} nftPolicyHex - The policy ID of the token in hex format
 * @param {string} nftNameHex - The token name in hex format
 * @returns {MapData} - The NFT value
 * Value encoding: Map<PolicyId(ByteArray), Map<TokenName(ByteArray), Int>>
 */
export function makeNftValue(nftPolicyHex, nftNameHex) {
  const policy = makeByteArrayData(hexToBytes(nftPolicyHex));
  const tokenName = makeByteArrayData(hexToBytes(nftNameHex));
  const inner = makeMapData([[tokenName, makeIntData(1)]]);
  return makeMapData([[policy, inner]]);
}

/**
 * Build a Value map for native tokens
 * Value encoding: Map<PolicyId(ByteArray), Map<TokenName(ByteArray), Int>>
 * @param {string} policyHex - The policy ID of the token in hex format
 * @param {string} tokenNameHex - The token name in hex format
 * @param {number} amount - The amount of the token
 * @returns {MapData} - The native token value
 */
export function makeNativeTokenValue(policyHex, tokenNameHex, amount) {
  const policy = makeByteArrayData(hexToBytes(policyHex));
  const tokenName = makeByteArrayData(hexToBytes(tokenNameHex));
  const inner = makeMapData([[tokenName, makeIntData(amount)]]);
  return makeMapData([[policy, inner]]);
}

/**
 * Create a TxInput with the given values
 * @param {string} txHash - The hash of the transaction
 * @param {number} index - The index of the transaction input
 * @param {string} address - The address (hex string or Bech32 format like addr_test1...)
 * @param {MapData} nativeTokens - Optional. The native tokens/NFT of the transaction input. Defaults to empty.
 * @returns {ConstrData} - The TxInInfo
 */
export function makeTxIn(txHash, index, address, nativeTokens = makeMapData([])) {
  // A TxInInfo is usually a pair (outRef, txOut)
  // We'll encode outRef as a ConstrData with (txId :: ByteArray, index :: Int)
  const outRef = makeConstrData(0, [
    makeByteArrayData(hexToBytes(txHash)), // txId
    makeIntData(index) // index
  ]);

  // txOut: encode minimal TxOut structure: (address, value, datumHash/inline datum)
  const txOut = makeConstrData(0, [
    makeByteArrayData(addressToBytes(address)), // address - supports both hex and Bech32
    nativeTokens, // value containing the native tokens/NFT
    makeIntData(0) // datum placeholder
  ]);

  // TxInInfo as map or pair depending on the expected Plutus encoding.
  return makeConstrData(0, [outRef, txOut]);
}

/**
 * Create a TxOutput with the given values
 * @param {string} address - The address (hex string or Bech32 format)
 * @param {MapData} nativeTokens - Optional. The native tokens/NFT of the transaction output. Defaults to empty.
 * @returns {ConstrData} - The TxOut
 */
export function makeTxOut(address, nativeTokens = makeMapData([])) {
  return makeConstrData(0, [
    makeByteArrayData(addressToBytes(address)), // address - supports both hex and Bech32
    nativeTokens, // value containing the native tokens/NFT
    makeIntData(0) // datum placeholder
  ]);
}

/**
 * Create a TxInfo with the given values in inputs/outputs/mint
 * @param {Array} inputsList - The list of transaction inputs
 * @param {Array} outputsList - The list of transaction outputs
 * @param {MapData} mintToken - The mint token data
 * @returns {ConstrData} - The TxInfo
 */
export function makeTxInfo(inputsList, outputsList, mintToken) {
  const inputs = makeListData(inputsList); // list of TxInInfo
  const referenceInputs = makeListData([]);       // none
  const outputs = makeListData(outputsList); // created outputs by tx
  const fee = makeMapData([]); // empty = zero fee (or fill a map with currency -> amount)
  const mint = mintToken; // include token data
  const dcert = makeListData([]); // none
  const wdrl = makeMapData([]); // none
  const valid_range = makeConstrData(0, [makeIntData(0), makeIntData(1000)]); // POSIX range start..end

  // TxInfo is commonly a constructor with all those fields in order
  return makeConstrData(0, [
    inputs,
    referenceInputs,
    outputs,
    fee,
    mint,
    dcert,
    wdrl,
    valid_range
  ]);
}

/**
 * Create a Minting purpose for the token policy
 * @param {string} policyId - The policy ID of the token
 * @returns {ConstrData} - The Minting purpose
 */
export function makeMintingPurpose(policyId) {
  // ScriptPurpose::Minting(policyId)
  const policy = makeByteArrayData(hexToBytes(policyId));
  // encode purpose with tag 1 for Minting
  return makeConstrData(1, [policy]);
}

/**
 * Decode and log error details from evaluation result
 */
export function decodeError(result) {
  if ("left" in result) {
    console.log("Error message:", result.left.error || "(empty)");
    console.log("\nCall sites:");
    result.left.callSites.forEach((site, i) => {
      console.log(`  [${i}]:`, site);
    });
  }
}

