import test from 'node:test';
import assert from 'node:assert/strict';
import { replyToConversation } from '../conversation-api.js';
import { validateChanges } from '../src/conversation.js';
import { HK } from '../src/data.js';
import { sightPick } from '../src/plan.js';

test('只接受受支持的调整，拒绝库外地点和超范围预算', () => {
  assert.deepEqual(validateChanges({rhythm:'late'}, HK), {rhythm:'late'});
  for (const change of [{budget:3000},{anchors:['mplus','mplus']},{stay:'invented'},{lessWalking:'yes'},{city:'东京'}]) {
    assert.throws(() => validateChanges(change, HK));
  }
});

test('没有密钥时不伪造对话', async () => {
  await assert.rejects(replyToConversation({message:'晚点出门',state:{}},{apiKey:''}), /尚未配置/);
});

test('模型收到当前行程与历史，返回的单项调整不附加其他字段', async () => {
  const state = {budget:1500,stay:'mira',anchors:['mplus','daikwun']};
  const original = structuredClone(state);
  const result = await replyToConversation({message:'晚点出门',state,history:[{role:'user',content:'酒店保留'}]}, {
    apiKey:'test-only', fetch:async (url, options) => {
      assert.equal(url, 'https://api.deepseek.com/chat/completions');
      const request = JSON.parse(options.body);
      assert.deepEqual(JSON.parse(request.messages[1].content).state, state);
      assert.equal(request.response_format.type,'json_object');
      return {ok:true,json:async () => ({choices:[{message:{content:JSON.stringify({answer:'建议11点出门。',changes:{rhythm:'late'}})}}]})};
    }
  });
  assert.deepEqual(result.changes,{rhythm:'late'});
  assert.deepEqual(state,original);
});

test('模型输出无效时拒绝应用', async () => {
  for (const content of ['', '{', JSON.stringify({answer:'已安排',changes:{anchors:['fake','daikwun']}})]) {
    await assert.rejects(replyToConversation({message:'换一个',state:{}},{apiKey:'test-only',fetch:async () => ({ok:true,json:async () => ({choices:[{message:{content}}]})})}), /格式不完整/);
  }
});

test('放慢节奏保留两个重点，并减少和就近安排附加点', () => {
  const normal = sightPick(['mplus','daikwun'],'rich','normal',null,null,'',false);
  const relaxed = sightPick(['mplus','daikwun'],'rich','normal',null,null,'',true);
  assert.ok(relaxed.d1.some(sight => sight.id === 'mplus'));
  assert.ok(relaxed.d2.some(sight => sight.id === 'daikwun'));
  assert.ok(relaxed.d1.length <= 3 && relaxed.d2.length <= 3);
  assert.ok(relaxed.d1.every(sight => sight.area === 'westkln'));
  assert.ok(relaxed.d2.every(sight => sight.area === 'central'));
  assert.ok(normal.d1.length + normal.d2.length > relaxed.d1.length + relaxed.d2.length);
});
