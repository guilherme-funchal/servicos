// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./ERC4337Wallet.sol";

contract EntryPoint {
    mapping(address => address) public wallets;

    function createWallet() external {
        require(wallets[msg.sender] == address(0), "Wallet already exists");
        ERC4337Wallet wallet = new ERC4337Wallet(address(this));
        wallets[msg.sender] = address(wallet);
    }

    function getWallet(address user) external view returns (address) {
        return wallets[user];
    }
}

