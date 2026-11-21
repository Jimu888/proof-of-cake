// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @notice One birthday gift, minted directly to its recipient and permanently locked.
/// @dev No proxy, URI setter, ownership transfer, unlock or rescue mechanism.
contract MementBirthday is ERC721 {
    error IssuerOnly();
    error InvalidIssuer();
    error AlreadyIssued();
    error Soulbound();
    error EmptyMetadataURI();
    error BurnDisabled();
    error RecipientOnly();

    event Locked(uint256 tokenId);
    uint256 public constant TOKEN_ID = 1;
    address public immutable issuer;
    bool public immutable recipientMayBurn;
    bool public issued;
    string private metadataURI;

    constructor(string memory title, string memory uri, bool allowRecipientBurn, address issuerAddress)
        ERC721(title, "MEMENT")
    {
        if (bytes(uri).length == 0) revert EmptyMetadataURI();
        if (issuerAddress == address(0)) revert InvalidIssuer();
        issuer = issuerAddress;
        recipientMayBurn = allowRecipientBurn;
        metadataURI = uri;
    }

    function mintGift(address recipient) external {
        if (msg.sender != issuer) revert IssuerOnly();
        if (issued) revert AlreadyIssued();
        // Set before calling a potentially contract-based recipient. Reverts atomically.
        issued = true;
        _safeMint(recipient, TOKEN_ID);
        emit Locked(TOKEN_ID);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return metadataURI;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return true;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    function approve(address, uint256) public pure override { revert Soulbound(); }
    function setApprovalForAll(address, bool) public pure override { revert Soulbound(); }

    /// @notice Optional recipient-only destruction, chosen irreversibly at deployment.
    function burn() external {
        if (!recipientMayBurn) revert BurnDisabled();
        if (ownerOf(TOKEN_ID) != msg.sender) revert RecipientOnly();
        _burn(TOKEN_ID);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override returns (address)
    {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
