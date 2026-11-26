// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract MementGroupGift is ERC721, ReentrancyGuard {
    error InvalidGroup();
    error Unavailable();
    error ExcessContribution();
    error TransferFailed();

    struct Group {
        address recipient;
        uint64 deadline;
        bool completed;
        uint256 targetPrice;
        uint256 targetVault;
        uint256 collected;
    }

    address public immutable payee;
    uint256 public groupCount;
    uint256 public proceeds;
    mapping(uint256 => Group) public groups;
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => uint256) public lockedVault;

    event GroupCreated(uint256 indexed groupId, address indexed organizer, address indexed recipient, uint256 targetPrice, uint256 targetVault, uint64 deadline);
    event Contributed(uint256 indexed groupId, address indexed contributor, uint256 amount);
    event GroupCompleted(uint256 indexed groupId, address indexed recipient, uint256 price);
    event VaultLocked(uint256 indexed groupId, uint256 amount);
    event VaultRedeemed(uint256 indexed groupId, address indexed holder, uint256 amount);
    event Refunded(uint256 indexed groupId, address indexed contributor, uint256 amount);

    constructor(address payee_) ERC721("Mement Test Group Gift", "MEMENT-GROUP-TEST") {
        if (block.chainid != 97 || payee_ == address(0) || payee_ == address(this)) revert InvalidGroup();
        payee = payee_;
    }

    function createGroupGift(address recipient, uint256 targetPrice, uint256 targetVault, uint64 deadline)
        external returns (uint256 groupId)
    {
        if (recipient == address(0) || recipient == address(this) || targetPrice == 0 ||
            deadline <= block.timestamp || targetVault > type(uint256).max - targetPrice) revert InvalidGroup();
        groupId = ++groupCount;
        groups[groupId] = Group(recipient, deadline, false, targetPrice, targetVault, 0);
        emit GroupCreated(groupId, msg.sender, recipient, targetPrice, targetVault, deadline);
    }

    function contribute(uint256 groupId) external payable nonReentrant {
        Group storage group = groups[groupId];
        if (group.completed || block.timestamp >= group.deadline || msg.value == 0) revert Unavailable();
        uint256 target = group.targetPrice + group.targetVault;
        if (msg.value > target - group.collected) revert ExcessContribution();
        group.collected += msg.value;
        contributions[groupId][msg.sender] += msg.value;
        emit Contributed(groupId, msg.sender, msg.value);
        if (group.collected != target) return;

        group.completed = true;
        proceeds += group.targetPrice;
        lockedVault[groupId] = group.targetVault;
        _safeMint(group.recipient, groupId);
        emit GroupCompleted(groupId, group.recipient, group.targetPrice);
        if (group.targetVault != 0) emit VaultLocked(groupId, group.targetVault);
    }

    function refund(uint256 groupId) external nonReentrant {
        _refund(groupId, payable(msg.sender));
    }

    function refundTo(uint256 groupId, address payable recipient) external nonReentrant {
        _refund(groupId, recipient);
    }

    function _refund(uint256 groupId, address payable recipient) private {
        Group storage group = groups[groupId];
        uint256 amount = contributions[groupId][msg.sender];
        if (group.completed || block.timestamp < group.deadline || amount == 0) revert Unavailable();
        contributions[groupId][msg.sender] = 0;
        group.collected -= amount;
        _pay(recipient, amount);
        emit Refunded(groupId, msg.sender, amount);
    }

    function burnAndRedeem(uint256 groupId, address payable recipient) external nonReentrant {
        if (ownerOf(groupId) != msg.sender) revert Unavailable();
        uint256 amount = lockedVault[groupId];
        lockedVault[groupId] = 0;
        _burn(groupId);
        if (amount != 0) _pay(recipient, amount);
        emit VaultRedeemed(groupId, msg.sender, amount);
    }

    function withdrawProceeds(address payable recipient) external nonReentrant {
        uint256 amount = proceeds;
        if (msg.sender != payee || amount == 0) revert Unavailable();
        proceeds = 0;
        _pay(recipient, amount);
    }

    function _pay(address payable recipient, uint256 amount) private {
        if (recipient == address(0) || recipient == address(this)) revert Unavailable();
        (bool paid,) = recipient.call{value: amount}("");
        if (!paid) revert TransferFailed();
    }
}
