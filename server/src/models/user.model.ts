import { model, Schema, type HydratedDocument } from 'mongoose';

export interface User {
  username: string;
  password: string;
  status: string;
  profilePhoto?: Buffer;
  profilePhotoContentType?: string;
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
  status: {
    type: String,
    default: '',
    trim: true,
    maxlength: 280,
  },
  profilePhoto: {
    type: Buffer,
    select: false,
  },
  profilePhotoContentType: {
    type: String,
    select: false,
  },
});

const UserModel = model<User>('User', userSchema);

export default UserModel;
