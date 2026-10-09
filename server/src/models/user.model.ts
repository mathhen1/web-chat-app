import { model, Schema, type HydratedDocument } from 'mongoose';

export interface User {
  username: string;
  password: string;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
});

const UserModel = model<User>('User', userSchema);

export default UserModel;
