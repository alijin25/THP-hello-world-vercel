import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-8">
      <div className="mx-auto max-w-2xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">
          Protected Page
        </h1>

        <p className="mt-4 text-zinc-600">
          You are authenticated with Google and can see this gated content.
        </p>

        <p className="mt-4 text-sm text-zinc-500">
          Signed in as:{" "}
          {typeof data.claims.email === "string"
            ? data.claims.email
            : "authenticated user"}
        </p>
      </div>
    </main>
  );
}
