import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "emailRequired")
    .email("emailInvalid"),
  password: z
    .string()
    .min(1, "passwordRequired"),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "nameRequired")
      .min(2, "nameRequired"),
    email: z
      .string()
      .min(1, "emailRequired")
      .email("emailInvalid"),
    password: z
      .string()
      .min(1, "passwordRequired")
      .min(6, "passwordMin"),
    confirmPassword: z
      .string()
      .min(1, "passwordRequired"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
