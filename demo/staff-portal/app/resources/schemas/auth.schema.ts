import { z } from 'zod';

export const AuthUserSchema = z.object({
  email: z.email(),
  email_verified: z.boolean().optional(),
  family_name: z.string().optional(),
  given_name: z.string().optional(),
  locale: z.string().optional(),
  name: z.string().optional(),
  avatar: z.url().optional(),
  preferred_username: z.string().optional(),
  sub: z.string(),
  updated_at: z.number().optional(),
  'urn:zitadel:iam:org:id': z.string().optional(),
  'urn:zitadel:iam:user:resourceowner:id': z.string().optional(),
  'urn:zitadel:iam:user:resourceowner:name': z.string().optional(),
  'urn:zitadel:iam:user:resourceowner:primary_domain': z.string().optional(),
});

export type AuthUser = z.infer<typeof AuthUserSchema>;
