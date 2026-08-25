import { createClient } from "@/utils/supabase/server";
import LoginButton from "@/components/login-button";
import VoteButtons from "@/components/vote-buttons";
import CaptionGenerator from "@/components/caption-generator";



type CaptionRow = {
    id: string;
    content: string | null;
    image_id: string;
    like_count: number | null;
};

type ImageRow = {
    id: string;
    url: string | null;
    image_description: string | null;
};

export default async function Home() {
    const supabase = await createClient();

    const { data: claimsData } = await supabase.auth.getClaims();

    if (!claimsData?.claims) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
                <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-zinc-900">
                        Sign in required
                    </h1>

                    <p className="mt-2 text-zinc-600">
                        Please sign in with Google to view the captions.
                    </p>

                    <div className="mt-6">
                        <LoginButton />
                    </div>
                </div>
            </main>
        );
    }

    // Get captions
    const { data: captions, error: captionsError } = await supabase
        .from("captions")
        .select("id, content, image_id, like_count")
        .returns<CaptionRow[]>();

    if (captionsError) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-zinc-900">
                        Something went wrong
                    </h1>

                    <p className="mt-2 text-sm text-red-600">
                        {captionsError.message}
                    </p>
                </div>
            </main>
        );
    }

    const rows = captions ?? [];

    // Get the image IDs used by these captions
    const imageIds = [...new Set(rows.map((caption) => caption.image_id))];

    // Fetch the images separately
    const { data: images, error: imagesError } = await supabase
        .from("images")
        .select("id, url, image_description")
        .in("id", imageIds)
        .returns<ImageRow[]>();

    if (imagesError) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
                <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-2xl font-semibold text-zinc-900">
                        Could not load images
                    </h1>

                    <p className="mt-2 text-sm text-red-600">
                        {imagesError.message}
                    </p>
                </div>
            </main>
        );
    }

    // Make a quick lookup from image ID → image
    const imageMap = new Map(
        (images ?? []).map((image) => [image.id, image])
    );

    return (
        <main className="min-h-screen bg-zinc-50 p-6">
            <div className="mx-auto max-w-7xl">
                <h1 className="text-3xl font-bold text-zinc-900">
                    Caption Rating App
                </h1>

                <p className="mt-2 text-zinc-600">
                    {rows.length}{" "}
                    {rows.length === 1 ? "caption" : "captions"} from Supabase
                </p>
                <CaptionGenerator />

                {rows.length === 0 ? (
                    <p className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center text-zinc-500 shadow-sm">
                        No captions found.
                    </p>
                ) : (
                    <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {rows.map((caption) => {
                            const image = imageMap.get(caption.image_id);

                            return (
                                <article
                                    key={caption.id}
                                    className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
                                >
                                    <div className="aspect-[4/3] bg-zinc-100">
                                        {image?.url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={image.url}
                                                alt={
                                                    image.image_description?.trim() ||
                                                    "Caption image"
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-zinc-500">
                                                No image available
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 p-5">
                                        <p className="text-base leading-relaxed text-zinc-800">
                                            {caption.content?.trim() ||
                                                "No caption available."}
                                        </p>

                                        <div className="border-t border-zinc-100 pt-4">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-zinc-500">
                                                    {caption.like_count ?? 0}{" "}
                                                    {(caption.like_count ?? 0) ===
                                                    1
                                                        ? "like"
                                                        : "likes"}
                                                </span>
                                            </div>

                                            <VoteButtons
                                                captionId={caption.id}
                                                existingVote={null}
                                            />
                                        </div>
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