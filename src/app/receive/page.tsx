import type {Metadata} from 'next';
import BirthdayReceive from '../../components/birthday-receive';
export const metadata:Metadata={title:'一份送给你的生日礼物 · Mement',description:'为一个特别的日子，留住一个可以慢慢欣赏的小世界。',robots:{index:false,follow:false}};
export default function Receive(){return <BirthdayReceive/>;}
