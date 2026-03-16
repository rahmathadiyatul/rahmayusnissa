import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const inviteeId = String(body.inviteeId ?? "").trim();
        const name = String(body.name ?? "").trim();
        const message = String(body.message ?? "").trim();

        if (!inviteeId || !name || !message) {
            return NextResponse.json({ error: "Data ucapan tidak valid." }, { status: 400 });
        }

        const supabase = createSupabaseServerClient();

        const { data: invitee, error: inviteeError } = await supabase
            .from("invitees")
            .select("id, is_active")
            .eq("id", inviteeId)
            .maybeSingle();

        if (inviteeError || !invitee || !invitee.is_active) {
            return NextResponse.json({ error: "ID undangan tidak ditemukan." }, { status: 403 });
        }

        const { data, error } = await supabase
            .from("wishes")
            .insert({
                invitee_id: inviteeId,
                name,
                message,
                is_approved: true,
            })
            .select("id, name, message, submitted_at")
            .single();

        if (error || !data) {
            return NextResponse.json({ error: "Gagal menyimpan ucapan." }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            wish: {
                id: data.id,
                name: data.name,
                message: data.message,
                createdAt: "Baru saja",
            },
        });
    } catch {
        return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
    }
}
