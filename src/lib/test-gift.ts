export const giftAbi = [
  'function price() view returns (uint256)',
  'function buyGift(bytes32 orderId,address recipient,string message) payable returns (uint256)',
  'event GiftPurchased(bytes32 indexed orderId,address indexed sender,address indexed recipient,uint256 tokenId,uint256 price,string message)',
  'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)',
];

export const vaultGiftAbi = [
  'function mintGiftWithNativeVault(bytes32 orderId,address recipient,string message,uint256 vaultAmount) payable returns (uint256)',
  'function mintGiftWithTokenVault(bytes32 orderId,address recipient,string message,address token,uint256 desiredAmount) payable returns (uint256)',
  'function burnAndRedeem(uint256 tokenId)',
  'function vaultAssets(uint256 tokenId) view returns (address token,uint256 amount,bool redeemed,address redeemer,uint256 redeemedAt,uint256 redeemedBlock,uint256 received)',
  'function ownerOf(uint256 tokenId) view returns (address)',
  'event VaultFunded(uint256 indexed tokenId,address indexed token,uint256 amount)',
  'event GiftRedeemed(uint256 indexed tokenId,address indexed redeemer,address indexed token,uint256 amount)',
];

export const vaultTokenAbi = [
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner,address spender) view returns (uint256)',
  'function approve(address spender,uint256 amount) returns (bool)',
];
