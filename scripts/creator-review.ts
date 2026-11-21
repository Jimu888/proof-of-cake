import { getCreatorApplicationRepository } from '../src/server/creator-application-repository';

const [command, id, status] = process.argv.slice(2);
const repository = getCreatorApplicationRepository();
try {
  if (command === 'list') console.log(JSON.stringify(repository.list(), null, 2));
  else if (command === 'review' && id && (status === 'approved' || status === 'rejected')) console.log(JSON.stringify(repository.review(id, status), null, 2));
  else { console.error('用法：npm run creators -- list 或 npm run creators -- review <申请编号> approved|rejected'); process.exitCode = 1; }
} catch (error) { console.error(error instanceof Error ? error.message : '审核失败'); process.exitCode = 1; }
finally { repository.close(); }
