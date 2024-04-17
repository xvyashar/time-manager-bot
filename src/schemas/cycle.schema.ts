import { Schema, SchemaTypes, model } from 'mongoose';

const schema = new Schema(
  {
    group: {
      type: SchemaTypes.ObjectId,
      ref: 'groups',
    },
    currentSlotIndex: {
      type: Number,
      default: 0,
    },
    slots: [Number],
    lastSlotStart: Date,
  },
  { timestamps: true }
);

export const Cycle = model('cycles', schema);
