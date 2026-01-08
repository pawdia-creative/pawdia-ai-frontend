// Centralized secure token storage to avoid circular imports between auth context and api client
class SecureTokenStorage {
  private static instance: SecureTokenStorage;
  private readonly TOKEN_KEY = 'auth_token';

  static getInstance(): SecureTokenStorage {
    if (!SecureTokenStorage.instance) {
      SecureTokenStorage.instance = new SecureTokenStorage();
    }
    return SecureTokenStorage.instance;
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(this.TOKEN_KEY, token);
    } catch (error) {
      console.warn('Failed to store token in localStorage:', error);
    }
  }

  getToken(): string | null {
    try {
      return localStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to retrieve token from localStorage:', error);
      return null;
    }
  }

  clearToken(): void {
    try {
      localStorage.removeItem(this.TOKEN_KEY);
    } catch (error) {
      console.warn('Failed to clear token from localStorage:', error);
    }
  }
}

export const tokenStorage = SecureTokenStorage.getInstance();


