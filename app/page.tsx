import { createClient } from "@/utils/supabase/server";
import LoginButton from "@/components/login-button";

type ImageRow = {
  id: string | number;
  url: string | null;
  image_description: string | null;
  created_datetime_utc: string | null;
};

function formatDate(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function Home() {
  const supabase = await createClient();

  const { data: claimsData } = await supabase.auth.getClaims();

  if (!claimsData?.claims) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Sign in required
            </h1>

            <p className="mt-2 text-zinc-600">
              Please sign in with Google to view the images.
            </p>

            <div className="mt-6">
              <LoginButton />
            </div>
          </div>
        </main>
    );
  }

  const { data: images, error } = await supabase
      .from("images")
      .select("id, url, image_description, created_datetime_utc")
      .returns<ImageRow[]>();

  if (error) {
    return (
        <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
          <div className="rounded-xl border border-red-200 bg-white p-6 text-center">
            <h1 className="text-2xl font-semibold text-zinc-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          </div>
        </main>
    );
  }

  const rows = images ?? [];

  return (
      <main className="min-h-screen bg-zinc-50 p-6">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-zinc-900">
            Images
          </h1>

          <p className="mt-2 text-zinc-600">
            {rows.length} {rows.length === 1 ? "image" : "images"} from Supabase
          </p>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((image) => {
              const createdLabel = formatDate(
                  image.created_datetime_utc
              );

              return (
                  <article
                      key={image.id}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-zinc-100">
                      {image.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                              src={image.url}
                              alt={
                                  image.image_description?.trim() ||
                                  `Image ${image.id}`
                              }
                              className="h-full w-full object-cover"
                          />
                      ) : (
                          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                            No image URL available
                          </div>
                      )}
                    </div>

                    <div className="space-y-2 p-4">
                      <p className="text-sm leading-relaxed text-zinc-800">
                        {image.image_description?.trim() ||
                            "No description provided."}
                      </p>

                      {createdLabel && (
                          <p className="text-xs text-zinc-500">
                            Created {createdLabel}
                          </p>
                      )}
                    </div>
                  </article>
              );
            })}
          </div>
        </div>
      </main>
  );
}