import type { MessageType } from './types';

/**
 * Send a typed message to the background script with standardized error handling.
 * Returns the response or throws on failure.
 */
export async function sendMessage<T = unknown>(
  type: MessageType,
  payload?: unknown,
): Promise<T> {
  const response = await chrome.runtime.sendMessage({ type, payload });
  if (response?.error) {
    throw new Error(response.error);
  }
  return response as T;
}
