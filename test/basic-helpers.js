// @ts-nocheck
// test/basic-helpers.js - Basic test helper functions for building ScriptContext

import {
  makeIntData,
  makeByteArrayData,
  makeListData,
  makeMapData,
  makeConstrData
} from "@helios-lang/uplc";
import { hexToBytes } from "./helpers.js";

/**
 * Create a basic TxInput with the given value
 */
export function makeBasicTxIn(valueData, placeNFTInInput = true) {
  // A TxInInfo is usually a pair (outRef, txOut)
  // We'll encode outRef as a ConstrData with (txId :: ByteArray, index :: Int)
  const outRef = makeConstrData(0, [
    makeByteArrayData(hexToBytes("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")), // txId
    makeIntData(0) // index
  ]);

  // txOut: encode minimal TxOut structure: (address, value, datumHash/inline datum)
  const txOut = makeConstrData(0, [
    makeByteArrayData(new Uint8Array([1])), // address as bytearray placeholder
    placeNFTInInput ? valueData : makeMapData([]), // value containing the NFT
    makeIntData(0) // datum placeholder
  ]);

  // TxInInfo as map or pair depending on the expected Plutus encoding.
  return makeConstrData(0, [outRef, txOut]);
}

/**
 * Create a basic TxOutput with the given value
 */
export function makeBasicTxOut(valueData, placeNFTInOutput = true) {
  return makeConstrData(0, [
    makeByteArrayData(new Uint8Array([1])),
    placeNFTInOutput ? valueData : makeMapData([]), // value containing the NFT
    makeIntData(0) // datum placeholder
  ]);
}

/**
 * Create a basic TxInfo with the given value in inputs/outputs/mint
 */
export function makeBasicTxInfo(valueData, placeNFTInOutput = true, placeNFTInInput = true) {
  const inputs = makeListData([makeBasicTxIn(valueData, placeNFTInInput)]); // list of TxInInfo
  const referenceInputs = makeListData([]);       // none
  const outputs = makeListData([makeBasicTxOut(valueData, placeNFTInOutput)]); // created outputs by tx
  const fee = makeMapData([]); // empty = zero fee (or fill a map with currency -> amount)
  const mint = valueData; // include token data
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


