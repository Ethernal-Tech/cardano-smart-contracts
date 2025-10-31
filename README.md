# Helios Validator Project

A Cardano smart contract project built with Helios that implements a minting validator with NFT-based access control for Skyline bridge.

## Overview

This project contains a Helios validator that enforces a specific business logic: when minting tokens, the validator ensures that any NFT used as input must be transferred to the same address in the output. This creates a mechanism where NFT ownership can be used to control minting permissions.

## Project Structure

```
ab-sc/
├── validators/
│   └── validator.hl          # Helios validator source code
├── test/
│   ├── helpers.js            # Test helper functions for building ScriptContext
│   ├── basic-validator.spec.ts
│   └── complex-validator.spec.ts
├── build.js                  # Build script with parameter injection
├── validator.plutus          # Compiled Plutus script (generated)
├── package.json              # Node.js dependencies and scripts
├── Makefile                  # Build and test automation
└── README.md                 # This file
```

## Validator Logic

The validator (`validators/validator.hl`) implements the following logic:

1. **NFT Requirement**: The validator checks for the presence of a specific NFT in transaction inputs
2. **Address Matching**: It ensures that the NFT input address matches the NFT output address
3. **Minting Control**: This creates a mechanism where only NFT holders can mint tokens, and the NFT must remain with the same owner during minting

### Key Features

- **Parameterized**: The validator accepts `NFT_POLICY` and `NFT_NAME` parameters
- **Flexible**: Can be configured for different NFTs by changing parameters
- **Secure**: Enforces that NFT ownership is maintained during minting

## Configuration

### NFT Parameters

The validator requires two parameters:

1. **NFT_POLICY**: The minting policy hash of the required NFT
2. **NFT_NAME**: The token name of the required NFT (in hex format)

## Build System

The project includes a sophisticated build system that allows parameter injection during compilation:

### Build Script (`build.js`)

The build script has been enhanced to require NFT parameters, this way you can build with your NFT:

```bash
node build.js --nft-policy <YOUR_NFT_POLICY> --nft-name <YOUR_NFT_NAME>
```

**Example:**
```bash
node build.js --nft-policy 14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61f --nft-name 54657374546F6B656E
```

### Available Build Commands

```bash
# Direct build with parameters
node build.js --nft-policy <policy_id> --nft-name <token_name_hex>

# Via npm
npm run build

# Via make
make build
```

## Dependencies

### Core Dependencies
- `@helios-lang/compiler`: Helios compiler for Cardano smart contracts
- `@helios-lang/ledger`: Cardano ledger utilities
- `@helios-lang/uplc`: UPLC (Untyped Plutus Core) utilities
- `@helios-lang/codec-utils`: Encoding/decoding utilities

### Development Dependencies
- `vitest`: Testing framework
- `@types/node`: TypeScript definitions for Node.js

## Testing

The project includes comprehensive test helpers in `test/helpers.js`:

### Key Helper Functions

- `compileValidator()`: Compiles the validator with parameter injection
- `makeNftValue()`: Creates NFT value maps for testing
- `makeTxIn()` / `makeTxOut()`: Builds transaction inputs/outputs
- `makeTxInfo()`: Creates complete transaction information
- `addressToBytes()`: Handles both hex and Bech32 address formats

### Test Structure

- **Basic Tests**: Simple validator functionality
- **Complex Tests**: Advanced scenarios with multiple inputs/outputs
- **Helper Functions**: Reusable utilities for building test scenarios

## Usage Examples

### Testing

```bash
# Run all tests
npm test

# With make
make unit-test

# Run specific test file
npx vitest run test/basic-validator.spec.ts
```

## Development Workflow

1. **Modify Validator**: Edit `validators/validator.hl`
2. **Update Parameters**: Change NFT policy/name in build commands
3. **Build**: Run `npm run build` to compile
4. **Test**: Run `npm test` to verify functionality
5. **Deploy**: Use generated `validator.plutus` for deployment

## Output

The build process generates:

- **`validator.plutus`**: Compiled Plutus script in JSON format
- **Console Output**: Build status, CBOR size, and parameter confirmation

Example output:
```
✅ Validator compiled successfully!
   Output: validator.plutus
   Plutus version: PlutusScriptV2
   CBOR size: 357 bytes
   NFT Policy: 14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61f
   NFT Name: 54657374546F6B656E
```

## Error Handling

The build system includes comprehensive error handling:

- **Missing Parameters**: Clear error messages with usage examples
- **Compilation Errors**: Detailed error reporting with stack traces
- **Parameter Validation**: Ensures required parameters are provided

## Security Considerations

- The validator enforces NFT ownership requirements
- Parameters are injected at compile time for security
- The validator logic prevents unauthorized minting
- NFT must remain with the same address during minting

## License

Copyright 2025 Ethernal

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
