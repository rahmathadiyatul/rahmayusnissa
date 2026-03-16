import { Suspense } from "react";
import WeddingClient from "./wedding-client";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type WeddingPageProps = {
    searchParams: Promise<{ invitee?: string | string[] }>;
};

type Wish = {
    id: string;
    name: string;
    message: string;
    createdAt: string;
};

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function FallbackView() {
    return <main className="min-h-screen" />;
}

export default async function WeddingPage({ searchParams }: WeddingPageProps) {
    const params = await searchParams;
    const rawInvitee = params.invitee;
    const inviteeUuid = Array.isArray(rawInvitee) ? rawInvitee[0] ?? "" : rawInvitee ?? "";
    let isAllowed = false;
    let inviteeName = "Tamu Undangan";
    let initialWishes: Wish[] = [];

    if (UUID_REGEX.test(inviteeUuid)) {
        try {
            const supabase = createSupabaseServerClient();

            const { data: invitee } = await supabase
                .from("invitees")
                .select("id, full_name, display_name, is_active")
                .eq("id", inviteeUuid)
                .maybeSingle();

            if (invitee?.is_active) {
                isAllowed = true;
                inviteeName = invitee.display_name || invitee.full_name || inviteeName;

                const { data: wishes } = await supabase
                    .from("wishes")
                    .select("id, name, message, submitted_at")
                    .eq("is_approved", true)
                    .order("submitted_at", { ascending: false })
                    .limit(20);

                initialWishes =
                    wishes?.map((wish) => ({
                        id: String(wish.id),
                        name: String(wish.name),
                        message: String(wish.message),
                        createdAt: "Beberapa saat lalu",
                    })) ?? [];
            }
        } catch {
            isAllowed = false;
        }
    }

    return (
        <Suspense fallback={<FallbackView />}>
            <WeddingClient
                inviteeUuid={inviteeUuid}
                isAllowed={isAllowed}
                inviteeName={inviteeName}
                initialWishes={initialWishes}
            />
        </Suspense>
    );
}
