import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    chatId: Number,
    title: String,
    config: Object,
  },
  { timestamps: true }
);

export const Group = model('groups', schema);
