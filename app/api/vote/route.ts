import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const captionId = body.captionId;
        const voteValue = body.voteValue;

        if (!captionId || ![1, -1].includes(voteValue)) {
            return NextResponse.json(
                { error: "Invalid vote." },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        const { data: claimsData } = await supabase.auth.getClaims();

        if (!claimsData?.claims) {
            return NextResponse.json(
                { error: "You must be signed in to vote." },
                { status: 401 }
            );
        }

        const userId = claimsData.claims.sub;

        if (typeof userId !== "string") {
            return NextResponse.json(
                { error: "Unable to identify the signed-in user." },
                { status: 401 }
            );
        }

        const { data: existingVote, error: existingVoteError } =
            await supabase
                .from("caption_votes")
                .select("id")
                .eq("profile_id", userId)
                .eq("caption_id", captionId)
                .maybeSingle();

        if (existingVoteError) {
            return NextResponse.json(
                { error: existingVoteError.message },
                { status: 500 }
            );
        }

        if (existingVote) {
            return NextResponse.json(
                { error: "You have already voted on this caption." },
                { status: 409 }
            );
        }

        const { error: insertError } = await supabase
            .from("caption_votes")
            .insert({
                profile_id: userId,
                caption_id: captionId,
                vote_value: voteValue,
            });

        if (insertError) {
            return NextResponse.json(
                { error: insertError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json(
            { error: "Invalid request." },
            { status: 400 }
        );
    }
}