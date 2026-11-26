import RoomHeader from '../../../components/room-header';
import { LocalText } from '../../../lib/i18n';
import StudioForm from './form';

export const metadata = { title: 'Creator Studio · Mement', robots: { index: false, follow: false } };

export default function Studio() {
  return <div className="platform-page room-page">
    <RoomHeader/>
    <main className="creator-application-layout">
      <section className="creator-application-intro">
        <h1><LocalText en="Creator Studio" zh="创作者工作台"/></h1>
        <p><LocalText en="Use your upload pass to submit artwork and edition terms for review." zh="使用运营提供的上传凭证提交作品与发行设置，等待人工审核。"/></p>
      </section>
      <section className="creator-application-panel">
        <h2><LocalText en="Submit artwork" zh="提交作品"/></h2>
        <StudioForm/>
      </section>
    </main>
  </div>;
}
