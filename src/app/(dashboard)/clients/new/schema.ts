import { z } from "zod";

export const newClientSchema = z.object({
  name: z.string().trim().min(2, "Client name must be at least 2 characters."),
  domain: z.string().trim().min(3, "Please enter a valid domain."),
  industry: z.string().trim().min(2, "Industry is required."),
  platformSlugs: z.array(z.string().trim().min(1)).min(1, "You must select at least one platform.")
});

export type NewClientValues = z.infer<typeof newClientSchema>;
