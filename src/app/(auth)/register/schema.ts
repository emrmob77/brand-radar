import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().trim().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include at least 1 uppercase letter.")
      .regex(/[a-z]/, "Password must include at least 1 lowercase letter.")
      .regex(/[0-9]/, "Password must include at least 1 number."),
    confirmPassword: z.string().min(1, "Password confirmation is required.")
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match."
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;
