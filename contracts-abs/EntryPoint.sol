// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "@account-abstraction/contracts/core/EntryPoint.sol";

function registerPaymaster(address paymaster) external onlyOwner {
    require(paymaster != address(0), "Paymaster address cannot be zero");
    authorizedPaymasters[paymaster] = true;
}