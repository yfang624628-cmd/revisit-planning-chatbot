import {contentPreview,reloadContent} from './content-store.js';
const [command='check',city='上海',roleId='']=process.argv.slice(2);
if(command==='check'){
  const result=await reloadContent();
  if(!result.ok){console.error(result.issues.join('\n'));process.exitCode=1;}else console.log(`配置有效：${result.config.version}`);
}else if(command==='preview'){
  const preview=await contentPreview({city,roleId});
  console.log(JSON.stringify(preview,null,2));
}else {console.error('用法：node content-cli.js check | preview [城市] [角色ID]');process.exitCode=1;}
