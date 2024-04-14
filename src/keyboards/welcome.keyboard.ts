import { InlineKeyboard } from 'grammy';
import { InlineKeyboardMarkup } from 'grammy/types';

export const getStartKeyboard = (): InlineKeyboardMarkup => {
  return new InlineKeyboard().url(
    'Join Bot to Your Group',
    'https://t.me/my_study_timer_bot?startgroup=new'
  );
};
