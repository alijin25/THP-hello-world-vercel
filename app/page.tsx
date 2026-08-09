import { supabase } from "@/lib/supabase";

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
  const { data: images, error } = await supabase
    .from("images")
    .select("id, url, image_description, created_datetime_utc")
    .returns<ImageRow[]>();

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-6 text-center shadow-sm">
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
    <main className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Images
          </h1>
          <p className="mt-2 text-sm text-zinc-600">
            {rows.length} {rows.length === 1 ? "image" : "images"} from Supabase
          </p>
        </header>

        {rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-zinc-500 shadow-sm">
            No images found.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((image) => {
              const createdLabel = formatDate(image.created_datetime_utc);

              return (
                <article
                  key={image.id}
                  className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                >
                  <div className="aspect-[4/3] bg-zinc-100">
                    {image.url ? (
                      // External Supabase URLs; native img avoids remotePatterns config
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
        )}
      </div>
    </main>
  );
}
