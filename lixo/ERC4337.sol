// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ERC4337 is ERC20, ERC721, ERC721URIStorage, Ownable {
    address public paymaster;

    constructor(string memory erc20Name, string memory erc20Symbol, string memory erc721Name, string memory erc721Symbol)
        ERC20(erc20Name, erc20Symbol)
        ERC721(erc721Name, erc721Symbol) {}

    function setPaymaster(address _paymaster) external onlyOwner {
        paymaster = _paymaster;
    }

    // ERC20 Functions
    function mintERC20(address to, uint256 amount) public {
        require(msg.sender == paymaster, "Only paymaster can mint");
        _mint(to, amount);
    }

    function burnERC20(address from, uint256 amount) public {
        require(msg.sender == paymaster, "Only paymaster can burn");
        _burn(from, amount);
    }

    // ERC721 Functions
    function mintERC721(address to, uint256 tokenId, string memory tokenURI) public {
        require(msg.sender == paymaster, "Only paymaster can mint");
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
    }

    function burnERC721(uint256 tokenId) public {
        require(msg.sender == paymaster, "Only paymaster can burn");
        _burn(tokenId);
    }

    // General Functions
    function handleOps(address from, address to, uint256 amount) public {
        require(msg.sender == paymaster, "Only paymaster can handle ops");
        _transfer(from, to, amount);
    }

    // Override required by Solidity for ERC721 and ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}


