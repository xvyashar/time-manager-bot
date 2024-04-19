import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    chatId: Number,
    title: String,
    config: Object,
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Group = model('groups', schema);
