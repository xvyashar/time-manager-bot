import { InlineKeyboardMarkup } from 'grammy/types';

export class KnownUserError extends Error {
  constructor(message?: string, public keyboard?: InlineKeyboardMarkup) {
    super(message);
  }
}
