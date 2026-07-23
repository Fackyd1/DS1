// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RealmAchievement is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(bytes32 => bool) public achievementMinted;

    event AchievementMinted(address indexed to, uint256 indexed tokenId, string achievementId, string tokenUri);

    constructor(address initialOwner) ERC721("RealmAchievement", "RACH") Ownable(initialOwner) {}

    function mintAchievement(
        address to,
        string calldata tokenUri,
        string calldata achievementId
    ) external onlyOwner returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(bytes(tokenUri).length > 0, "Token URI required");
        require(bytes(achievementId).length > 0, "Achievement ID required");

        bytes32 key = keccak256(abi.encodePacked(to, achievementId));
        require(!achievementMinted[key], "Achievement already minted for player");

        uint256 tokenId = ++_nextTokenId;
        achievementMinted[key] = true;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit AchievementMinted(to, tokenId, achievementId, tokenUri);
        return tokenId;
    }
}
