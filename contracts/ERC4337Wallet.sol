// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC4337Wallet is Ownable {
    address public entryPoint;

    event AccountExecuted(address indexed dest, uint256 value, bytes data, bool success);

    constructor(address _entryPoint) Ownable(msg.sender) {
        entryPoint = _entryPoint;
    }

    function execute(address dest, uint256 value, bytes calldata data) external onlyOwner {
        (bool success, ) = dest.call{value: value}(data);
        emit AccountExecuted(dest, value, data, success);
    }

    receive() external payable {}

    function updateEntryPoint(address _entryPoint) external onlyOwner {
        entryPoint = _entryPoint;
    }
}
