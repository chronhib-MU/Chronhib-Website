import { User } from './user';
export interface ApiPostBody {
  table: string;
  values: any[];
  command: string;
  user: User;
}
