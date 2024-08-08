// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

contract EntryPoint {
    using ECDSA for bytes32;

    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes callData;
        bytes signature;
    }

    mapping(address => uint256) public nonces;

    event UserOperationExecuted(address indexed sender, bytes callData, bool success);

    function handleOps(UserOperation[] calldata ops) external {
        for (uint256 i = 0; i < ops.length; i++) {
            UserOperation memory op = ops[i];
            require(verifySignature(op), "Invalid signature");
            require(nonces[op.sender] == op.nonce, "Invalid nonce");
            nonces[op.sender]++;

            (bool success, ) = op.sender.call(op.callData);
            emit UserOperationExecuted(op.sender, op.callData, success);
        }
    }

    function verifySignature(UserOperation memory op) internal pure returns (bool) {
        bytes32 hash = keccak256(abi.encode(op.sender, op.nonce, op.callData));
        bytes32 ethSignedHash = _toEthSignedMessageHash(hash);
        address signer = ECDSA.recover(ethSignedHash, op.signature);
        return signer == op.sender;
    }

    function _toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
        // Implementar hash a partir de dados em formato de mensagem assinado
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
    }
}
