// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Fixed edition for the testnet purchase and delivery integration.
contract MementTestGift is ERC721, ReentrancyGuard {
    error WrongChain();
    error InvalidConfiguration();
    error WrongPrice();
    error InvalidGift();
    error SoldOut();
    error DuplicateOrder();
    error Soulbound();
    error BurnDisabled();
    error HolderOnly();
    error NothingToWithdraw();
    error WithdrawalFailed();

    event GiftPurchased(bytes32 indexed orderId, address indexed sender, address indexed recipient, uint256 tokenId, uint256 price, string message);
    event ProceedsWithdrawn(address indexed payee, uint256 amount);
    event Locked(uint256 tokenId);

    address public immutable artist;
    address public immutable platform;
    uint256 public immutable price;
    uint16 public immutable artistBps;
    uint256 public immutable editionLimit;
    bool public immutable transferable;
    bool public immutable holderCanBurn;
    uint256 public minted;
    string public metadata;
    mapping(address => uint256) public proceeds;
    mapping(address => mapping(bytes32 => bool)) public orders;

    constructor(address artist_, address platform_, uint256 price_, uint16 artistBps_, uint256 editionLimit_, bool transferable_, bool holderCanBurn_, string memory metadata_)
        ERC721("Mement Test Gift", "MEMENT-TEST")
    {
        if (block.chainid != 97) revert WrongChain();
        if (artist_ == address(0) || platform_ == address(0) || artist_ == platform_ ||
            price_ == 0 || artistBps_ > 10000 || editionLimit_ == 0 || bytes(metadata_).length == 0) revert InvalidConfiguration();
        artist = artist_;
        platform = platform_;
        price = price_;
        artistBps = artistBps_;
        editionLimit = editionLimit_;
        transferable = transferable_;
        holderCanBurn = holderCanBurn_;
        metadata = metadata_;
    }

    function buyGift(bytes32 orderId, address recipient, string calldata message) external payable nonReentrant returns (uint256 tokenId) {
        if (msg.value != price) revert WrongPrice();
        if (orderId == bytes32(0) || recipient == address(0) || bytes(message).length > 840) revert InvalidGift();
        if (minted >= editionLimit) revert SoldOut();
        if (orders[msg.sender][orderId]) revert DuplicateOrder();

        orders[msg.sender][orderId] = true;
        tokenId = ++minted;
        uint256 platformAmount = msg.value * (10000 - artistBps) / 10000;
        proceeds[artist] += msg.value - platformAmount;
        proceeds[platform] += platformAmount;
        _safeMint(recipient, tokenId);
        if (!transferable) emit Locked(tokenId);
        emit GiftPurchased(orderId, msg.sender, recipient, tokenId, msg.value, message);
    }

    function withdraw() external nonReentrant {
        uint256 amount = proceeds[msg.sender];
        if (amount == 0) revert NothingToWithdraw();
        proceeds[msg.sender] = 0;
        (bool sent,) = payable(msg.sender).call{value: amount}("");
        if (!sent) revert WithdrawalFailed();
        emit ProceedsWithdrawn(msg.sender, amount);
    }

    function burn(uint256 tokenId) external nonReentrant {
        if (!holderCanBurn) revert BurnDisabled();
        if (ownerOf(tokenId) != msg.sender) revert HolderOnly();
        _burn(tokenId);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return metadata;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        _requireOwned(tokenId);
        return !transferable;
    }

    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return interfaceId == 0xb45a3c0e || super.supportsInterface(interfaceId);
    }

    function approve(address to, uint256 tokenId) public override {
        if (!transferable) revert Soulbound();
        super.approve(to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) public override {
        if (!transferable) revert Soulbound();
        super.setApprovalForAll(operator, approved);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (!transferable && to != address(0) && _ownerOf(tokenId) != address(0)) revert Soulbound();
        return super._update(to, tokenId, auth);
    }
}
