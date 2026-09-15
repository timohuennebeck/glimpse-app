import type { ChatMessage } from '@/features/chat/interfaces';
/**
 * Messages arrive from three directions — the optimistic send, the insert's own
 * answer, and the Realtime event — and the same message routinely arrives
 * twice. Both writers go through here so neither has to know about the others.
 */
export function appendMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const without = list.filter((existing) => existing.id !== message.id);
  return [...without, message].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/**
 * The presence topic for a conversation: the two ids in a fixed order, so both
 * phones join the same channel. The migration's policy splits this same string.
 */
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
