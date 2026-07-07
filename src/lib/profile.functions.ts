import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type Profile = { id: string; baby_name: string | null };

export const getProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, baby_name")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      const { data: inserted, error: insErr } = await supabase
        .from("profiles")
        .insert({ id: userId } as never)
        .select("id, baby_name")
        .single();
      if (insErr) throw new Error(insErr.message);
      return inserted as Profile;
    }
    return data as Profile;
  });

export const updateBabyName = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ baby_name: z.string().min(1).max(60) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("profiles")
      .upsert({ id: userId, baby_name: data.baby_name } as never)
      .select("id, baby_name")
      .single();
    if (error) throw new Error(error.message);
    return row as Profile;
  });
