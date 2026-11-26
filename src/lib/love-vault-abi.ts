export const loveVaultAbi = [
  'function createVault(address partnerB, uint8 terms, address donation, uint64 cooldownSeconds) returns (uint256)',
  'function deposit(uint256 agreementId) payable',
  'function approveMarriage(uint256 agreementId)',
  'function requestBreakup(uint256 agreementId)',
  'function approveBreakup(uint256 agreementId)',
  'function finalizeBreakupAfterCooldown(uint256 agreementId)',
  'function withdraw(address payable recipient)',
  'function agreements(uint256 agreementId) view returns (address partnerA, address partnerB, address donation, uint8 terms, uint64 cooldownSeconds, uint64 breakupRequestedAt, uint8 status, uint8 marriageVotes, uint8 breakupVotes, uint256 principalA, uint256 principalB)',
  'function claimable(address account) view returns (uint256)',
  'event AgreementCreated(uint256 indexed agreementId, address indexed partnerA, address indexed partnerB)',
  'event Deposited(uint256 indexed agreementId, address indexed partner, uint256 amount)',
  'event MarriageApproved(uint256 indexed agreementId, address indexed partner)',
  'event BreakupApproved(uint256 indexed agreementId, address indexed partner)',
  'event BreakupRequested(uint256 indexed agreementId, uint256 eligibleAt)',
  'event Settled(uint256 indexed agreementId, uint8 status, uint256 principal, uint256 bonus)',
  'event Withdrawn(address indexed claimant, address indexed recipient, uint256 amount)',
] as const;

export const LOVE_COOLDOWN_SECONDS = 30 * 24 * 60 * 60;
