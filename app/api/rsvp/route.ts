import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const inviteeId = String(body.inviteeId ?? "").trim();
        const name = String(body.name ?? "").trim();
        const pax = Number(body.pax ?? 0);
        const attendance = String(body.attendance ?? "").trim();

        if (!inviteeId || !name || !Number.isInteger(pax) || pax <= 0) {
            return NextResponse.json({ error: "Data RSVP tidak valid." }, { status: 400 });
        }

        if (attendance !== "hadir" && attendance !== "tidak-hadir") {
            return NextResponse.json({ error: "Status kehadiran tidak valid." }, { status: 400 });
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

        const { error } = await supabase.from("rsvps").insert({
            invitee_id: inviteeId,
            name,
            pax,
            attendance,
        });

        if (error) {
            return NextResponse.json({ error: "Gagal menyimpan RSVP." }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
    }
}
