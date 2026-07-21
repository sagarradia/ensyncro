export type Role = 'FOUNDER' | 'INVESTOR' | 'ADMIN';
export type OtpChannel = 'EMAIL' | 'MOBILE';

export interface AuthUser {
  id: string;
  email: string;
  mobile?: string | null;
  role: Role;
  status: 'PENDING_VERIFICATION' | 'ACTIVE' | 'DISABLED';
  emailVerified: boolean;
  mobileVerified: boolean;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}

export interface LoginResponse extends TokenPair {
  user: AuthUser;
}

export interface SignupResponse {
  userId: string;
  status: string;
  message: string;
  /** Present only while OTP_MODE=mock, so the wizard can pre-fill the codes. */
  devOtp?: { email?: string | null; mobile?: string | null };
}
