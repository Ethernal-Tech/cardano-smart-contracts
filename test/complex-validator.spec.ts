// @ts-nocheck
// test/validator.spec.ts
import {
  makeIntData,
  makeMapData,
  makeConstrData,
  makeUplcDataValue,
  makeBasicUplcLogger
} from "@helios-lang/uplc";
import { expect, test } from "vitest";

import { 
  compileValidator,
  makeNftValue,
  makeTxInfo,
  makeMintingPurpose,
  makeTxIn,
  makeTxOut,
  makeNativeTokenValue,
  decodeError
} from "./helpers.js";

const NFT_POLICY = "14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61f";
const NFT_NAME = "54657374546F6B656E";
const MINTING_POLICY = "14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61e";
const MINTING_NAME = "54657374546F6B656E";

test("validator should pass", () => {
  const uplc = compileValidator();

  // build redeemer matching the validator signature (redeemer must equal 4)
  const redeemer = makeUplcDataValue(makeIntData(4));

  // build txInfo & purpose then ScriptContext as a constructor (txInfo, purpose)
  const nftValue = makeNftValue(NFT_POLICY, NFT_NAME);
  const nativeTokenValue = makeNativeTokenValue("0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000", 1000);
  const mintToken = makeNftValue(MINTING_POLICY, MINTING_NAME);
  let inputs = [
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 0, "addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1, "addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x"),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 2, "addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq", nativeTokenValue)
  ];
  let outputs = [
    makeTxOut("addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxOut("addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x", nativeTokenValue),
    makeTxOut("addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq")
  ];
  let txInfo = makeTxInfo(inputs, outputs, mintToken);
  const purpose = makeMintingPurpose(MINTING_POLICY);
  let scriptContextData = makeConstrData(0, [txInfo, purpose]);
  let scriptContext = makeUplcDataValue(scriptContextData);

  // evaluate
  let { result } = uplc.eval([redeemer, scriptContext]);

  expect("left" in result).toBe(false);
  // if right, check for expected return type (unit)
  let r = result.right;
  if (typeof r === "string") {
    throw new Error(`unexpected string result: ${r}`);
  }

  expect(r.kind).toBe("unit");

  inputs = [
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 0, "addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x"),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1, "addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 2, "addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq", nativeTokenValue)
  ];
  outputs = [
    makeTxOut("addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x", nativeTokenValue),
    makeTxOut("addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxOut("addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq")
  ];
  txInfo = makeTxInfo(inputs, outputs, mintToken);
  scriptContextData = makeConstrData(0, [txInfo, purpose]);
  scriptContext = makeUplcDataValue(scriptContextData);
  const uplc2 = compileValidator();
  result  = uplc2.eval([redeemer, scriptContext]).result;
  
  expect("left" in result).toBe(false);
  // if right, check for expected return type (unit)
  r = result.right;
  if (typeof r === "string") {
    throw new Error(`unexpected string result: ${r}`);
  }

  expect(r.kind).toBe("unit");
});

test("validator should fail for missing NFT in output", () => {
  const uplc = compileValidator();

  // build redeemer matching the validator signature (redeemer must equal 4)
  const redeemer = makeUplcDataValue(makeIntData(4));

  // build txInfo & purpose then ScriptContext as a constructor (txInfo, purpose)
  const nftValue = makeNftValue(NFT_POLICY, NFT_NAME);
  const nativeTokenValue = makeNativeTokenValue("0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000", 1000);
  const mintToken = makeNftValue(MINTING_POLICY, MINTING_NAME);
  let inputs = [
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 0, "addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1, "addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x"),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 2, "addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq", nativeTokenValue)
  ];
  let outputs = [
    makeTxOut("addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854"),
    makeTxOut("addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x", nativeTokenValue),
    makeTxOut("addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq")
  ];
  let txInfo = makeTxInfo(inputs, outputs, mintToken);
  const purpose = makeMintingPurpose(MINTING_POLICY);
  let scriptContextData = makeConstrData(0, [txInfo, purpose]);
  let scriptContext = makeUplcDataValue(scriptContextData);

  // evaluate
  let { result } = uplc.eval([redeemer, scriptContext]);

  // This test expects the validator to fail
  expect("left" in result).toBe(true);
});

test("validator should fail for missing NFT in input", () => {
  const uplc = compileValidator();

  // build redeemer matching the validator signature (redeemer must equal 4)
  const redeemer = makeUplcDataValue(makeIntData(4));

  // build txInfo & purpose then ScriptContext as a constructor (txInfo, purpose)
  const nftValue = makeNftValue(NFT_POLICY, NFT_NAME);
  const nativeTokenValue = makeNativeTokenValue("0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000", 1000);
  const mintToken = makeNftValue(MINTING_POLICY, MINTING_NAME);
  let inputs = [
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 0, "addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854"),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1, "addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x"),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 2, "addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq", nativeTokenValue)
  ];
  let outputs = [
    makeTxOut("addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxOut("addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x", nativeTokenValue),
    makeTxOut("addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq")
  ];
  let txInfo = makeTxInfo(inputs, outputs, mintToken);
  const purpose = makeMintingPurpose(MINTING_POLICY);
  let scriptContextData = makeConstrData(0, [txInfo, purpose]);
  let scriptContext = makeUplcDataValue(scriptContextData);

  // evaluate
  let { result } = uplc.eval([redeemer, scriptContext]);

  // This test expects the validator to fail
  expect("left" in result).toBe(true);
});

test("validator should fail for having NFT in wrong output address", () => {
  const uplc = compileValidator();

  // build redeemer matching the validator signature (redeemer must equal 4)
  const redeemer = makeUplcDataValue(makeIntData(4));

  // build txInfo & purpose then ScriptContext as a constructor (txInfo, purpose)
  const nftValue = makeNftValue(NFT_POLICY, NFT_NAME);
  const nativeTokenValue = makeNativeTokenValue("0000000000000000000000000000000000000000000000000000000000000000", "0000000000000000000000000000000000000000000000000000000000000000", 1000);
  const mintToken = makeNftValue(MINTING_POLICY, MINTING_NAME);
  let inputs = [
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 0, "addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854", nftValue),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 1, "addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x"),
    makeTxIn("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 2, "addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq", nativeTokenValue)
  ];
  let outputs = [
    makeTxOut("addr_test1qzj7580e7yf9whzqu6m4x6m8e86y6xurm3t5n2cx0qy96a854"),
    makeTxOut("addr_test1wq9npzwv2x63yqhv307kmrc40fcwm9d8rpg8mhsecvrzu0q9sc96x", nativeTokenValue),
    makeTxOut("addr_test1vp7fzchvagt3j27c6ckx2al0e0szz2rkl72nmht9ll96tggumvsyq", nftValue)
  ];
  let txInfo = makeTxInfo(inputs, outputs, mintToken);
  const purpose = makeMintingPurpose(MINTING_POLICY);
  let scriptContextData = makeConstrData(0, [txInfo, purpose]);
  let scriptContext = makeUplcDataValue(scriptContextData);

  // evaluate
  let { result } = uplc.eval([redeemer, scriptContext]);

  // This test expects the validator to fail
  expect("left" in result).toBe(true);
});
