export interface AuthContext {
  userId: string;
  email?: string;
  isAdmin: boolean;
  timezone: string;
}
