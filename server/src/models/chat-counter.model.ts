import { model, Schema } from 'mongoose';

interface ChatCounter {
  _id: string;
  sequence: number;
}

const chatCounterSchema = new Schema<ChatCounter>({
  _id: { type: String, required: true },
  sequence: { type: Number, default: 0 },
});

const ChatCounterModel = model<ChatCounter>('ChatCounter', chatCounterSchema);

export default ChatCounterModel;
