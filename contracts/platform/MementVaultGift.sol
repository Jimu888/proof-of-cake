// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice Atlas Oracle Push Single-Feed interface (Chainlink AggregatorV2V3 compatible).
/// @dev See https://docs.atlasoracle.io (oracle-atlas/push-oracle-interfaces).
interface IAtlasSingleFeed {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

/// @notice Fixed edition for chain 97. Vault balances are distinct from sales proceeds.
/// @dev Compatible ERC-20 balances must remain stable outside transfers. Issuer freezes,
///      rebases and transfer restrictions can prevent redemption of the affected token.
contract MementVaultGift is ERC721, ReentrancyGuard {
    using SafeERC20 for IERC20;

    error InvalidVault();
    error VaultTimeLocked();
    error MilestoneNotReached();
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
    event VaultFunded(uint256 indexed tokenId, address indexed token, uint256 amount);
    event MilestoneConfigured(uint256 indexed tokenId, address indexed atlasFeed, int256 targetPrice, uint64 maxDeadline);
    event GiftRedeemed(uint256 indexed tokenId, address indexed redeemer, address indexed token, uint256 amount);

    struct PriceMilestone {
        address atlasFeed;
        int256 targetPrice;
        uint64 maxDeadline;
    }

    struct VaultAsset {
        address token;
        uint256 amount;
        bool redeemed;
        address redeemer;
        uint256 redeemedAt;
        uint256 redeemedBlock;
        uint256 received;
        uint64 unlockTime;
    }

    mapping(uint256 => VaultAsset) public vaultAssets;
    mapping(uint256 => PriceMilestone) public priceMilestones;
    mapping(address => uint256) public reserved;


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
        ERC721("Mement Test Vault Gift", "MEMENT-VAULT-TEST")
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

    function supportsTimeLock() external pure returns (bool) {
        return true;
    }

    function buyGift(bytes32 orderId, address recipient, string calldata message) external payable nonReentrant returns (uint256 tokenId) {
        if (msg.value != price) revert WrongPrice();
        tokenId = _bookGift(orderId, recipient, message);
        _deliver(orderId, recipient, message, tokenId);
    }

    function mintGiftWithNativeVault(bytes32 orderId, address recipient, string calldata message, uint256 vaultAmount)
        external payable nonReentrant returns (uint256)
    {
        return _mintGiftWithNativeVault(orderId, recipient, message, vaultAmount, 0);
    }

    function mintGiftWithNativeVaultLocked(bytes32 orderId, address recipient, string calldata message, uint256 vaultAmount, uint64 unlockTime)
        external payable nonReentrant returns (uint256)
    {
        if (unlockTime <= block.timestamp) revert InvalidVault();
        return _mintGiftWithNativeVault(orderId, recipient, message, vaultAmount, unlockTime);
    }

    /// @notice Mints a gift NFT whose native vault unlocks when Atlas Oracle reaches targetPrice or maxDeadline elapses.
    function mintGiftWithAtlasMilestone(
        bytes32 orderId,
        address recipient,
        string calldata message,
        uint256 vaultAmount,
        address atlasFeed,
        int256 targetPrice,
        uint64 maxDeadline
    ) external payable nonReentrant returns (uint256 tokenId) {
        if (atlasFeed.code.length == 0 || targetPrice <= 0 || maxDeadline <= block.timestamp) revert InvalidVault();
        tokenId = _mintGiftWithNativeVault(orderId, recipient, message, vaultAmount, 0);
        priceMilestones[tokenId] = PriceMilestone({ atlasFeed: atlasFeed, targetPrice: targetPrice, maxDeadline: maxDeadline });
        emit MilestoneConfigured(tokenId, atlasFeed, targetPrice, maxDeadline);
    }

    function _mintGiftWithNativeVault(bytes32 orderId, address recipient, string calldata message, uint256 vaultAmount, uint64 unlockTime)
        private returns (uint256 tokenId)
    {
        if (!holderCanBurn) revert BurnDisabled();
        if (vaultAmount == 0) revert InvalidVault();
        if (msg.value < price || msg.value - price != vaultAmount) revert WrongPrice();
        tokenId = _bookGift(orderId, recipient, message);
        _fund(tokenId, address(0), vaultAmount, unlockTime);
        _deliver(orderId, recipient, message, tokenId);
    }

    function mintGiftWithTokenVault(bytes32 orderId, address recipient, string calldata message, address token, uint256 desiredAmount)
        external payable nonReentrant returns (uint256)
    {
        return _mintGiftWithTokenVault(orderId, recipient, message, token, desiredAmount, 0);
    }

    function mintGiftWithTokenVaultLocked(bytes32 orderId, address recipient, string calldata message, address token, uint256 desiredAmount, uint64 unlockTime)
        external payable nonReentrant returns (uint256)
    {
        if (unlockTime <= block.timestamp) revert InvalidVault();
        return _mintGiftWithTokenVault(orderId, recipient, message, token, desiredAmount, unlockTime);
    }

    function _mintGiftWithTokenVault(bytes32 orderId, address recipient, string calldata message, address token, uint256 desiredAmount, uint64 unlockTime)
        private returns (uint256 tokenId)
    {
        if (!holderCanBurn) revert BurnDisabled();
        if (msg.value != price) revert WrongPrice();
        if (token.code.length == 0 || desiredAmount == 0) revert InvalidVault();
        tokenId = _bookGift(orderId, recipient, message);
        IERC20 asset = IERC20(token);
        uint256 beforeBalance = asset.balanceOf(address(this));
        if (beforeBalance < reserved[token]) revert InvalidVault();
        asset.safeTransferFrom(msg.sender, address(this), desiredAmount);
        uint256 afterBalance = asset.balanceOf(address(this));
        if (afterBalance <= beforeBalance || afterBalance - beforeBalance > desiredAmount) revert InvalidVault();
        _fund(tokenId, token, afterBalance - beforeBalance, unlockTime);
        _deliver(orderId, recipient, message, tokenId);
    }

    function _bookGift(bytes32 orderId, address recipient, string calldata message) private returns (uint256 tokenId) {
        if (orderId == bytes32(0) || recipient == address(0) || bytes(message).length > 840) revert InvalidGift();
        if (minted >= editionLimit) revert SoldOut();
        if (orders[msg.sender][orderId]) revert DuplicateOrder();
        orders[msg.sender][orderId] = true;
        tokenId = ++minted;
        uint256 platformAmount = Math.mulDiv(price, 10000 - artistBps, 10000);
        proceeds[artist] += price - platformAmount;
        proceeds[platform] += platformAmount;
    }

    function _fund(uint256 tokenId, address token, uint256 amount, uint64 unlockTime) private {
        vaultAssets[tokenId].token = token;
        vaultAssets[tokenId].amount = amount;
        vaultAssets[tokenId].unlockTime = unlockTime;
        reserved[token] += amount;
        emit VaultFunded(tokenId, token, amount);
    }

    function _deliver(bytes32 orderId, address recipient, string calldata message, uint256 tokenId) private {
        _safeMint(recipient, tokenId);
        if (!transferable) emit Locked(tokenId);
        emit GiftPurchased(orderId, msg.sender, recipient, tokenId, price, message);
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
        _redeem(tokenId);
    }

    function burnAndRedeem(uint256 tokenId) external nonReentrant {
        _redeem(tokenId);
    }

    function _redeem(uint256 tokenId) private {
        if (!holderCanBurn) revert BurnDisabled();
        if (ownerOf(tokenId) != msg.sender) revert HolderOnly();

        VaultAsset storage asset = vaultAssets[tokenId];
        if (block.timestamp < asset.unlockTime) revert VaultTimeLocked();
        PriceMilestone storage milestone = priceMilestones[tokenId];
        if (milestone.atlasFeed != address(0) && block.timestamp < milestone.maxDeadline) {
            (uint80 roundId, int256 answer, , uint256 updatedAt, uint80 answeredInRound) =
                IAtlasSingleFeed(milestone.atlasFeed).latestRoundData();
            bool fresh = roundId != 0 && answeredInRound >= roundId && updatedAt != 0 &&
                updatedAt <= block.timestamp && block.timestamp - updatedAt <= 3600;
            if (!fresh || answer < milestone.targetPrice) revert MilestoneNotReached();
        }
        uint256 amount = asset.amount;
        address token = asset.token;
        asset.redeemed = true;
        asset.redeemer = msg.sender;
        asset.redeemedAt = block.timestamp;
        asset.redeemedBlock = block.number;
        reserved[token] -= amount;
        _burn(tokenId);

        if (amount != 0) {
            asset.received = token == address(0) ? amount : _payToken(token, amount);
            if (token == address(0)) {
                (bool sent,) = payable(msg.sender).call{value: amount}("");
                if (!sent) revert WithdrawalFailed();
            }
        }
        emit GiftRedeemed(tokenId, msg.sender, token, asset.received);
    }

    function _payToken(address token, uint256 amount) private returns (uint256) {
        IERC20 asset = IERC20(token);
        uint256 beforeVault = asset.balanceOf(address(this));
        uint256 beforeHolder = asset.balanceOf(msg.sender);
        if (beforeVault < reserved[token] + amount) revert InvalidVault();
        asset.safeTransfer(msg.sender, amount);
        uint256 afterVault = asset.balanceOf(address(this));
        uint256 afterHolder = asset.balanceOf(msg.sender);
        if (afterVault != beforeVault - amount || afterHolder <= beforeHolder || afterHolder - beforeHolder > amount) revert InvalidVault();
        return afterHolder - beforeHolder;
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
