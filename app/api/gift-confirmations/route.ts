import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const inviteeId = String(body.inviteeId ?? "").trim();
        const senderName = String(body.senderName ?? "").trim();
        const transferAmountRaw = String(body.transferAmount ?? "").trim();

        if (!inviteeId || !senderName) {
            return NextResponse.json({ error: "Data konfirmasi hadiah tidak valid." }, { status: 400 });
        }

        const transferAmount = transferAmountRaw ? Number(transferAmountRaw) : null;
        if (transferAmountRaw && Number.isNaN(transferAmount)) {
            return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });
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

        const { error } = await supabase.from("gift_confirmations").insert({
            invitee_id: inviteeId,
            sender_name: senderName,
            transfer_amount: transferAmount,
        });

        if (error) {
            return NextResponse.json({ error: "Gagal menyimpan konfirmasi hadiah." }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Terjadi kesalahan pada server." }, { status: 500 });
    }
}
