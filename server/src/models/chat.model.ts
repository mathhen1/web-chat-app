import { model, Schema, Types, type HydratedDocument } from 'mongoose';

export interface Chat {
  id: number;
  name: string;
  members: Types.ObjectId[];
  description: string;
  visible: boolean;
  author: Types.ObjectId;
  password?: string;
}

export type ChatDocument = HydratedDocument<Chat>;

const chatSchema = new Schema<Chat>({
  id: {
    type: Number,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  members: {
    type: [Schema.Types.ObjectId],
    ref: 'User',
    default: [],
    index: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  password: {
    type: String,
    select: false,
  },
});

const ChatModel = model<Chat>('Chat', chatSchema);

export default ChatModel;
