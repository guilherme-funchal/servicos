// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;


import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./ERC4337Wallet.sol";

contract EntryPoint {
    event WalletCreated(address indexed owner, address wallet);

    function createWallet(address owner) external returns (address) {
        ERC4337Wallet wallet = new ERC4337Wallet(owner);
        emit WalletCreated(owner, address(wallet));
        return address(wallet);
    }
}
