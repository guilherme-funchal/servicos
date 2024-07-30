// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract ERC4337 is Ownable {
    using ECDSA for bytes32;

    constructor(address initialOwner) Ownable(initialOwner) {
        // O construtor Ownable já configurou o proprietário inicial
    }

    function someFunction(bytes32 hash, bytes memory signature) public pure returns (address) {
        bytes32 ethSignedHash = _toEthSignedMessageHash(hash);
        return ECDSA.recover(ethSignedHash, signature);
    }

    function _toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}

