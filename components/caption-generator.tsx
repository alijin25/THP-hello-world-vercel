"use client";

import { useState } from "react";

type GeneratedCaption = {
    id?: string;
    content?: string | null;
    [key: string]: unknown;
};

export default function CaptionGenerator() {
    const [file, setFile] = useState<File | null>(null);
    const [captions, setCaptions] = useState<GeneratedCaption[]>([]);
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {
        const selectedFile = event.target.files?.[0] ?? null;

        setFile(selectedFile);
        setCaptions([]);
        setImageUrl("");
        setError("");
    }

    async function generateCaptions() {
        if (!file) {
            setError("Please select an image first.");
            return;
        }

        setLoading(true);
        setError("");
        setCaptions([]);
        setImageUrl("");

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/generate-captions", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Unable to generate captions."
                );
            }

            setCaptions(result.captions ?? []);
            setImageUrl(result.imageUrl ?? "");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900">
                Generate Captions
            </h2>

            <p className="mt-1 text-sm text-zinc-600">
                Upload an image and generate captions using the caption
                generation API.
            </p>

            <div className="mt-5">
                <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-zinc-700"
                />
            </div>

            {file && (
                <p className="mt-3 text-sm text-zinc-500">
                    Selected: {file.name}
                </p>
            )}

            <button
                type="button"
                onClick={generateCaptions}
                disabled={!file || loading}
                className="mt-5 rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading ? "Generating..." : "Generate Captions"}
            </button>

            {error && (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                </p>
            )}

            {imageUrl && (
                <div className="mt-6">
                    <h3 className="text-sm font-medium text-zinc-700">
                        Uploaded Image
                    </h3>

                    <img
                        src={imageUrl}
                        alt="Uploaded image"
                        className="mt-2 max-h-80 rounded-xl object-contain"
                    />
                </div>
            )}

            {captions.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-zinc-900">
                        Generated Captions
                    </h3>

                    <div className="mt-3 space-y-3">
                        {captions.map((caption, index) => (
                            <div
                                key={caption.id ?? index}
                                className="rounded-xl border border-zinc-200 bg-zinc-50 p-4"
                            >
                                <p className="text-zinc-800">
                                    {caption.content?.trim() ||
                                        "Caption content unavailable."}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}