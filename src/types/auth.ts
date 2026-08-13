// src/types/auth.ts
export interface SignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  accountType: "individual" | "business";
  companyName?: string;
}
