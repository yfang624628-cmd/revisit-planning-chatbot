export function conversationRequest(message, state, history = []) {
  return { message: message.trim(), state, history: history.slice(-8) };
}

export function validateChanges(changes, data) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new Error('修改格式不正确');
  const allowed = ['rhythm', 'budget', 'lessWalking', 'stay', 'food', 'anchors'];
  if (Object.keys(changes).some(key => !allowed.includes(key))) throw new Error('暂不支持这项修改');
  if ('rhythm' in changes && !['early', 'normal', 'late'].includes(changes.rhythm)) throw new Error('作息无效');
  if ('budget' in changes && (!Number.isInteger(changes.budget) || changes.budget < 1000 || changes.budget > 2000)) throw new Error('预算调整范围为 ¥1000–2000');
  if ('lessWalking' in changes && typeof changes.lessWalking !== 'boolean') throw new Error('节奏无效');
  for (const key of ['stay', 'food']) {
    const options = key === 'stay' ? data.stays : data.foods;
    if (key in changes && changes[key] !== null && !options.some(option => option.id === changes[key])) throw new Error('选项不在当前资料库中');
  }
  if ('anchors' in changes && (!Array.isArray(changes.anchors) || changes.anchors.length !== 2 || new Set(changes.anchors).size !== 2 || changes.anchors.some(id => !data.sights.some(sight => sight.id === id)))) throw new Error('请选择资料库中两个不同的景点');
  return changes;
}

export async function askPlanner(message, state, history) {
  const response = await fetch('/api/conversation', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conversationRequest(message, state, history)),
    signal: AbortSignal.timeout(35000)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || '暂时无法回复，请稍后重试');
  return result;
}
