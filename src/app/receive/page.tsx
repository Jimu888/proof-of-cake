import type {Metadata} from 'next';
import BirthdayReceive from '../../components/birthday-receive';
export const metadata:Metadata={title:'计划之外 · jimu.ai',description:'为一个特别的日子，留住一个可以慢慢欣赏的小世界。',robots:{index:false,follow:false}};
export default function Receive(){return <BirthdayReceive/>;}
