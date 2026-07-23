import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ProfileSchema = z.object({
  full_name: z.string().trim().min(2).max(80),
  date_of_birth: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v))
    .nullable()
    .refine((v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v), {
      message: "Please pick a valid date",
    }),

  gender: z.enum(["female", "male", "other"]),
  skin_type: z.enum(["oily", "dry", "combination", "normal", "sensitive", "other", "na"]),
  primary_concern: z.enum([
    "acne",
    "dark_spots",
    "pigmentation",
    "pores",
    "texture",
    "fine_lines",
    "dullness",
    "redness",
    "other",
  ]),
  skin_goals: z.array(z.string().trim().min(2).max(40)).max(5),
  preferred_language: z.enum(["en", "hi"]),
  onboarding_completed: z.boolean(),
});

export type ProfileFormInput = z.infer<typeof ProfileSchema>;

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  });

export const saveMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => ProfileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: profile, error } = await context.supabase
      .from("profiles")
      .upsert({
        id: context.userId,
        full_name: data.full_name.trim(),
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        skin_type: data.skin_type,
        primary_concern: data.primary_concern,
        skin_goals: data.skin_goals.map((goal) => goal.trim()),
        preferred_language: data.preferred_language,
        onboarding_completed: data.onboarding_completed,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return profile;
  });
