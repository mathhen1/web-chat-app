import { model, Schema, Types, type HydratedDocument } from 'mongoose';

export interface Message {
  chatId: number;
  author: Types.ObjectId;
  content: string;
  timestamp: string;
  date: string;
}

export type MessageDocument = HydratedDocument<Message>;

const getCurrentTime = (): string =>
  new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());

const getCurrentDate = (): string => new Intl.DateTimeFormat('pt-BR').format(new Date());

const messageSchema = new Schema<Message>({
  chatId: {
    type: Number,
    required: true,
    index: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: String,
    default: getCurrentTime,
    match: /^([01]\d|2[0-3]):[0-5]\d$/,
  },
  date: {
    type: String,
    default: getCurrentDate,
    match: /^\d{2}\/\d{2}\/\d{4}$/,
  },
});

const MessageModel = model<Message>('Message', messageSchema);

export default MessageModel;
