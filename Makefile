build:
	node build.js --nft-policy 14b249936a64cbc96bde5a46e04174e7fb58b565103d0c3a32f8d61f --nft-name 54657374546F6B656E

unit-test:
	npm test

check: build unit-test