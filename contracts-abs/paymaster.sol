// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.22;
import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "./AccountFactory.sol";


contract Paymaster is BasePaymaster {
    AccountFactory public immutable factory;

    constructor(IEntryPoint _entryPoint, AccountFactory _factory) BasePaymaster(_entryPoint) {
        factory = _factory;
    }

    function _validatePaymasterUserOp(UserOperation calldata userOp, bytes32 /*userOpHash*/, uint256 /*maxCost*/)
        internal
        override
        view
        returns (bytes memory context, uint256 validationData)
    {
        // Ensure the sender is a SimpleAccount created by the specific factory
        require(factory.isAccountCreated(userOp.sender), "Sender not created by factory");
        return ("", 0);
    }
}