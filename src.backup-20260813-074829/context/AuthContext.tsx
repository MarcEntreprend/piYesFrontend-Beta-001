// // src/context/AuthContext.tsx

// import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
// import type { User } from "@/types";
// import { getInitials } from "@/types";
// import type { SignupPayload } from "@/types/auth";
// import { mockUser } from "@/data/mockUser";

// const SESSION_KEY = "piyes-session";
// const DEMO_PASSWORD = "piyes2026";
// const DEMO_OTP = "123456";

// interface StoredSession {
//     user: User;
//     token: string;
// }

// interface AuthContextValue {
//     user: User | null;
//     isAuthenticated: boolean;
//     isLoading: boolean;
//     login: (identifier: string, password: string) => Promise<{ requestId: string }>;
//     verifyLoginOtp: (requestId: string, code: string) => Promise<void>;
//     signup: (payload: SignupPayload) => Promise<{ requestId: string }>;
//     verifySignupOtp: (payload: SignupPayload, code: string) => Promise<void>;
//     resendOtp: () => Promise<void>;
//     forgotPassword: (email: string) => Promise<void>;
//     resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
//     logout: () => void;
// }

// const AuthContext = createContext<AuthContextValue | null>(null);
// const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// export function AuthProvider({ children }: { children: ReactNode }) {
//     const [user, setUser] = useState<User | null>(null);
//     const [isLoading, setIsLoading] = useState(true);

//     useEffect(() => {
//         const raw = localStorage.getItem(SESSION_KEY);
//         if (raw) {
//             try {
//                 const session: StoredSession = JSON.parse(raw);
//                 setUser(session.user);
//             } catch {
//                 localStorage.removeItem(SESSION_KEY);
//             }
//         }
//         setIsLoading(false);
//     }, []);

//     const persist = (session: StoredSession) => {
//         localStorage.setItem(SESSION_KEY, JSON.stringify(session));
//         setUser(session.user);
//     };

//     const login: AuthContextValue["login"] = async (identifier, password) => {
//         await delay(700);
//         const normalized = identifier.trim().toLowerCase();
//         const matchesIdentity =
//             normalized === mockUser.email.toLowerCase() ||
//             normalized === (mockUser.phone ?? "").replace(/\s/g, "");
//         if (!matchesIdentity || password !== DEMO_PASSWORD) {
//             throw new Error("invalidCredentials");
//         }
//         return { requestId: `otpreq_${Date.now()}` };
//     };

//     const verifyLoginOtp: AuthContextValue["verifyLoginOtp"] = async (_requestId, code) => {
//         await delay(600);
//         if (code !== DEMO_OTP) throw new Error("invalidCode");
//         persist({ user: mockUser, token: `mock_token_${Date.now()}` });
//     };

//     const signup: AuthContextValue["signup"] = async (_payload) => {
//         await delay(700);
//         return { requestId: `otpreq_${Date.now()}` };
//     };

//     const verifySignupOtp: AuthContextValue["verifySignupOtp"] = async (payload, code) => {
//         await delay(600);
//         if (code !== DEMO_OTP) throw new Error("invalidCode");
//         const name = `${payload.firstName} ${payload.lastName}`.trim();
//         const newUser: User = {
//             id: `usr_${Date.now()}`,
//             name,
//             tag: `@${payload.firstName.toLowerCase()}${payload.lastName.slice(0, 1).toLowerCase()}`,
//             firstName: payload.firstName,
//             lastName: payload.lastName,
//             accountType: payload.accountType,
//             email: payload.email,
//             accountNumber: `PY-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
//             balance: 0,
//             mfaEnabled: true,
//             biometricsEnabled: false,
//             verificationStatus: "pending",
//             hasPin: false,
//             isDeviceVerified: true,
//             phone: payload.phone,
//             initials: getInitials(name),
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString(),
//         };
//         persist({ user: newUser, token: `mock_token_${Date.now()}` });
//     };

//     const resendOtp: AuthContextValue["resendOtp"] = async () => {
//         await delay(500);
//     };

//     const forgotPassword: AuthContextValue["forgotPassword"] = async (_email) => {
//         await delay(700);
//     };

//     const resetPassword: AuthContextValue["resetPassword"] = async (_email, code, _newPassword) => {
//         await delay(700);
//         if (code !== DEMO_OTP) throw new Error("invalidCode");
//     };

//     const logout = () => {
//         localStorage.removeItem(SESSION_KEY);
//         setUser(null);
//     };

//     return (
//         <AuthContext.Provider
//             value={{ user, isAuthenticated: !!user, isLoading, login, verifyLoginOtp, signup, verifySignupOtp, resendOtp, forgotPassword, resetPassword, logout }}
//         >
//             {children}
//         </AuthContext.Provider>
//     );
// }

// export function useAuth() {
//     const ctx = useContext(AuthContext);
//     if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
//     return ctx;
// }