import mongoose from 'mongoose';

function getCurrentTime() {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date());
}

function getCurrentDate() {
  return new Intl.DateTimeFormat('pt-BR').format(new Date());
}

const messageSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
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

const Message = mongoose.model('Message', messageSchema);

export default Message;
