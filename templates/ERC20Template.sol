// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract {{Name}} is ERC20, ERC20Burnable, Ownable {
    constructor()
        ERC20("{{Name}}", "{{Symbol}}")
    {
        _mint(msg.sender, 10000 * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

        function burnFrom(address account, uint256 amount) public override onlyOwner {
        _burn(account, amount);
    }
    
    function burn(address to, uint256 amount) public {
        _burn(to, amount);
    }
}