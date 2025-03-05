export interface User {
  id: string;
  email: string;
  // Add other user properties as needed
}

export interface Session {
  user: User;
  // Add other session properties as needed
}

export interface AuthState {
  session: Session | null;
  // Add other auth state properties as needed
}
