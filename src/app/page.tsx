import CryptoGift from '../components/crypto-gift';
import { publicCatalog } from '../server/public-catalog';
export const dynamic = 'force-dynamic';
export default function Home(){ return <CryptoGift artworks={publicCatalog()}/>; }
