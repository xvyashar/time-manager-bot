import { InlineKeyboard } from 'grammy';
import { InlineKeyboardMarkup } from 'grammy/types';

export const getDisableKeyboard = (): InlineKeyboardMarkup => {
  return new InlineKeyboard().text('Disable', 'disable_button');
};

export const getEnableKeyboard = (): InlineKeyboardMarkup => {
  return new InlineKeyboard().text('Enable Again', 'enable_button');
};
