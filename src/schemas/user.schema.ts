import { Schema, model } from 'mongoose';

const schema = new Schema(
  {
    numericId: Number,
    username: String,
    fullName: String,
    pendingConfigs: [String],
  },
  { timestamps: true }
);

export const User = model('users', schema);
