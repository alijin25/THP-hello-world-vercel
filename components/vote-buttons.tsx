"use client";

import { useState } from "react";

type VoteButtonsProps = {
    captionId: string;
    existingVote: number | null;
};

export default function VoteButtons({
                                        captionId,
                                        existingVote,
                                    }: VoteButtonsProps) {
    const [vote, setVote] = useState<number | null>(existingVote);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    async function submitVote(value: number) {
        if (loading || vote !== null) return;

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch("/api/vote", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    captionId,
                    voteValue: value,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                setMessage(result.error || "Unable to submit vote.");
                return;
            }

            setVote(value);
            setMessage("Vote saved!");
        } catch {
            setMessage("Something went wrong.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4">
            <div className="flex gap-2">
                <button
                    onClick={() => submitVote(1)}
                    disabled={loading || vote !== null}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        vote === 1
                            ? "bg-green-600 text-white"
                            : "bg-zinc-100 text-zinc-800 hover:bg-green-100"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    👍 Upvote
                </button>

                <button
                    onClick={() => submitVote(-1)}
                    disabled={loading || vote !== null}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        vote === -1
                            ? "bg-red-600 text-white"
                            : "bg-zinc-100 text-zinc-800 hover:bg-red-100"
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    👎 Downvote
                </button>
            </div>

            {message && (
                <p className="mt-2 text-xs text-zinc-500">{message}</p>
            )}
        </div>
    );
}