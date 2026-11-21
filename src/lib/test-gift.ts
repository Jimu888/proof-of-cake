export const giftAbi = [
  'function price() view returns (uint256)',
  'function buyGift(bytes32 orderId,address recipient,string message) payable returns (uint256)',
  'event GiftPurchased(bytes32 indexed orderId,address indexed sender,address indexed recipient,uint256 tokenId,uint256 price,string message)',
  'event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)',
];
