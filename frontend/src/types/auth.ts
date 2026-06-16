export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  verified: boolean;
  avatar?: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface TokenResponse {
  accessToken: string;
}
