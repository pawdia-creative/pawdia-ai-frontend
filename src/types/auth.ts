export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  credits: number;
  isAdmin?: boolean;
  isVerified?: boolean;
  subscription?: {
    plan: 'free' | 'basic' | 'premium';
    expiresAt?: string;
    status: 'active' | 'expired' | 'cancelled';
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginResult extends User {
  token: string;
  isFirstLogin?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  checkedAuth?: boolean;
}

export interface UpdateProfileData {
  name?: string;
  email?: string;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  register: (credentials: RegisterCredentials) => Promise<any>;
  logout: () => void;
  clearError: () => void;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  syncVerificationStatus: () => Promise<boolean>;
}