// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

contract MementLoveVault is ReentrancyGuard {
    enum Terms { SPLIT_PROPORTIONAL, ALL_TO_A, ALL_TO_B, DONATE }
    enum Status { Open, Married, Broken }

    error InvalidAgreement();
    error Unavailable();
    error PartnerOnly();
    error TransferFailed();

    struct Agreement {
        address partnerA;
        address partnerB;
        address donation;
        Terms terms;
        uint64 cooldownSeconds;
        uint64 breakupRequestedAt;
        Status status;
        uint8 marriageVotes;
        uint8 breakupVotes;
        uint256 principalA;
        uint256 principalB;
    }

    uint64 public constant COOLDOWN = 30 days;
    address public immutable platform;
    uint256 public immutable marriageBonus;
    uint256 public platformBonusPool;
    uint256 public agreementCount;
    mapping(uint256 => Agreement) public agreements;
    mapping(address => uint256) public claimable;

    event AgreementCreated(uint256 indexed agreementId, address indexed partnerA, address indexed partnerB);
    event Deposited(uint256 indexed agreementId, address indexed partner, uint256 amount);
    event MarriageApproved(uint256 indexed agreementId, address indexed partner);
    event BreakupApproved(uint256 indexed agreementId, address indexed partner);
    event BreakupRequested(uint256 indexed agreementId, uint256 eligibleAt);
    event Settled(uint256 indexed agreementId, Status status, uint256 principal, uint256 bonus);
    event BonusFunded(uint256 amount);
    event Withdrawn(address indexed claimant, address indexed recipient, uint256 amount);

    constructor(uint256 marriageBonus_) {
        if (block.chainid != 97) revert InvalidAgreement();
        platform = msg.sender;
        marriageBonus = marriageBonus_;
    }

    function fundBonusPool() external payable {
        if (msg.sender != platform || msg.value == 0) revert Unavailable();
        platformBonusPool += msg.value;
        emit BonusFunded(msg.value);
    }

    function createVault(address partnerB, Terms terms, address donation, uint64 cooldownSeconds)
        external returns (uint256 agreementId)
    {
        if (partnerB == address(0) || partnerB == msg.sender ||
            (terms == Terms.DONATE && (donation == address(0) || donation == address(this))) ||
            cooldownSeconds != COOLDOWN) revert InvalidAgreement();

        agreementId = ++agreementCount;
        Agreement storage agreement = agreements[agreementId];
        agreement.partnerA = msg.sender;
        agreement.partnerB = partnerB;
        agreement.terms = terms;
        agreement.donation = donation;
        agreement.cooldownSeconds = cooldownSeconds;
        emit AgreementCreated(agreementId, msg.sender, partnerB);
    }

    function deposit(uint256 agreementId) external payable {
        Agreement storage agreement = agreements[agreementId];
        uint8 partner = _openPartner(agreement);
        if (msg.value == 0 || agreement.marriageVotes != 0 || agreement.breakupRequestedAt != 0) revert Unavailable();
        if (partner == 1) agreement.principalA += msg.value;
        else agreement.principalB += msg.value;
        emit Deposited(agreementId, msg.sender, msg.value);
    }

    function approveMarriage(uint256 agreementId) external nonReentrant {
        Agreement storage agreement = agreements[agreementId];
        uint8 partner = _openPartner(agreement);
        if (agreement.principalA == 0 || agreement.principalB == 0 || (agreement.marriageVotes & partner) != 0 ||
            (agreement.breakupRequestedAt != 0 && block.timestamp >= uint256(agreement.breakupRequestedAt) + agreement.cooldownSeconds))
            revert Unavailable();
        agreement.breakupVotes &= ~partner;
        agreement.marriageVotes |= partner;
        emit MarriageApproved(agreementId, msg.sender);
        if (agreement.marriageVotes != 3) return;

        agreement.status = Status.Married;
        uint256 principal = agreement.principalA + agreement.principalB;
        uint256 bonus = platformBonusPool >= marriageBonus ? marriageBonus : 0;
        platformBonusPool -= bonus;
        uint256 bonusA = Math.mulDiv(bonus, agreement.principalA, principal);
        claimable[agreement.partnerA] += agreement.principalA + bonusA;
        claimable[agreement.partnerB] += agreement.principalB + (bonus - bonusA);
        emit Settled(agreementId, Status.Married, principal, bonus);
    }

    function requestBreakup(uint256 agreementId) external {
        Agreement storage agreement = agreements[agreementId];
        uint8 partner = _openPartner(agreement);
        if (agreement.breakupRequestedAt != 0) revert Unavailable();
        agreement.marriageVotes &= ~partner;
        agreement.breakupVotes |= partner;
        emit BreakupApproved(agreementId, msg.sender);
        _startCooldown(agreementId, agreement);
    }

    function approveBreakup(uint256 agreementId) external nonReentrant {
        Agreement storage agreement = agreements[agreementId];
        uint8 partner = _openPartner(agreement);
        agreement.marriageVotes &= ~partner;
        if ((agreement.breakupVotes & partner) != 0 || _cooldownExpired(agreement)) revert Unavailable();
        agreement.breakupVotes |= partner;
        emit BreakupApproved(agreementId, msg.sender);
        if (agreement.breakupVotes == 3) _settleBreakup(agreementId, agreement);
        else if (agreement.breakupRequestedAt == 0) _startCooldown(agreementId, agreement);
    }

    function _startCooldown(uint256 agreementId, Agreement storage agreement) private {
        agreement.breakupRequestedAt = uint64(block.timestamp);
        emit BreakupRequested(agreementId, block.timestamp + agreement.cooldownSeconds);
    }

    function finalizeBreakupAfterCooldown(uint256 agreementId) external nonReentrant {
        Agreement storage agreement = agreements[agreementId];
        _openPartner(agreement);
        if (!_cooldownExpired(agreement)) revert Unavailable();
        _settleBreakup(agreementId, agreement);
    }

    function _cooldownExpired(Agreement storage agreement) private view returns (bool) {
        return agreement.breakupRequestedAt != 0 &&
            block.timestamp >= uint256(agreement.breakupRequestedAt) + agreement.cooldownSeconds;
    }

    function _openPartner(Agreement storage agreement) private view returns (uint8) {
        if (agreement.status != Status.Open) revert Unavailable();
        if (msg.sender == agreement.partnerA) return 1;
        if (msg.sender == agreement.partnerB) return 2;
        revert PartnerOnly();
    }

    function _settleBreakup(uint256 agreementId, Agreement storage agreement) private {
        agreement.status = Status.Broken;
        uint256 principal = agreement.principalA + agreement.principalB;
        if (agreement.breakupVotes != 3 || agreement.terms == Terms.SPLIT_PROPORTIONAL) {
            claimable[agreement.partnerA] += agreement.principalA;
            claimable[agreement.partnerB] += agreement.principalB;
        } else if (agreement.terms == Terms.ALL_TO_A) claimable[agreement.partnerA] += principal;
        else if (agreement.terms == Terms.ALL_TO_B) claimable[agreement.partnerB] += principal;
        else claimable[agreement.donation] += principal;
        emit Settled(agreementId, Status.Broken, principal, 0);
    }

    /// @notice Settlement makes funds immediately claimable, even if a recipient rejects native transfers.
    function withdraw(address payable recipient) external nonReentrant {
        uint256 amount = claimable[msg.sender];
        if (amount == 0 || recipient == address(0) || recipient == address(this)) revert Unavailable();
        claimable[msg.sender] = 0;
        (bool paid,) = recipient.call{value: amount}("");
        if (!paid) revert TransferFailed();
        emit Withdrawn(msg.sender, recipient, amount);
    }
}
