import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const API_BASE_URL = "https://api.almostcrackd.ai";

const SUPPORTED_TYPES = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/heic",
]);

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // Check that the user is authenticated
        const {
            data: {session},
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
            return NextResponse.json(
                {
                    error: "You must be signed in to generate captions.",
                },
                {status: 401}
            );
        }

        // Get uploaded image
        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json(
                {
                    error: "No image file was provided.",
                },
                {status: 400}
            );
        }

        // Check supported image type
        if (!SUPPORTED_TYPES.has(file.type)) {
            return NextResponse.json(
                {
                    error:
                        "Unsupported image type. Please use JPEG, PNG, WebP, GIF, or HEIC.",
                },
                {status: 400}
            );
        }

        const token = session.access_token;


        // ---------------------------------------------------------
        // STEP 1: Generate presigned upload URL
        // ---------------------------------------------------------

        const presignedResponse = await fetch(
            `${API_BASE_URL}/pipeline/generate-presigned-url`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contentType: file.type,
                }),
            }
        );

        if (!presignedResponse.ok) {
            const errorText = await presignedResponse.text();

            return NextResponse.json(
                {
                    error: `Could not generate upload URL: ${errorText}`,
                },
                {status: presignedResponse.status}
            );
        }

        const {
            presignedUrl,
            cdnUrl,
        }: {
            presignedUrl: string;
            cdnUrl: string;
        } = await presignedResponse.json();

        // ---------------------------------------------------------
        // STEP 2: Upload image bytes
        // ---------------------------------------------------------

        const imageBytes = await file.arrayBuffer();

        const uploadResponse = await fetch(presignedUrl, {
            method: "PUT",
            headers: {
                "Content-Type": file.type,
            },
            body: imageBytes,
        });

        if (!uploadResponse.ok) {
            const errorText = await uploadResponse.text();

            return NextResponse.json(
                {
                    error: `Could not upload image: ${errorText}`,
                },
                {status: uploadResponse.status}
            );
        }

        // ---------------------------------------------------------
        // STEP 3: Register uploaded image with pipeline
        // ---------------------------------------------------------

        const registerResponse = await fetch(
            `${API_BASE_URL}/pipeline/upload-image-from-url`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageUrl: cdnUrl,
                    isCommonUse: false,
                }),
            }
        );

        if (!registerResponse.ok) {
            const errorText = await registerResponse.text();

            return NextResponse.json(
                {
                    error: `Could not register image: ${errorText}`,
                },
                {status: registerResponse.status}
            );
        }

        const {
            imageId,
        }: {
            imageId: string;
        } = await registerResponse.json();


        // ---------------------------------------------------------
        // STEP 4: Generate captions
        // ---------------------------------------------------------

        const captionsResponse = await fetch(
            `${API_BASE_URL}/pipeline/generate-captions`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    imageId,
                }),
            }
        );

        if (!captionsResponse.ok) {
            const errorText = await captionsResponse.text();

            return NextResponse.json(
                {
                    error: `Could not generate captions: ${errorText}`,
                },
                {status: captionsResponse.status}
            );
        }

        const captions = await captionsResponse.json();

        return NextResponse.json({
            imageId,
            imageUrl: cdnUrl,
            captions,
        });
    } catch (error) {
        console.error("Caption generation error:", error);

        return NextResponse.json(
            {
                error: "Something went wrong while generating captions.",
            },
            {status: 500}
        );
    }
}