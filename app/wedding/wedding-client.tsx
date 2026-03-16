"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type AttendanceStatus = "hadir" | "tidak-hadir";

type Wish = {
    id: string;
    name: string;
    message: string;
    createdAt: string;
};

const EVENT_DATE = new Date("2026-04-04T08:00:00+07:00");

function formatRemaining(ms: number) {
    if (ms <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
}

type WeddingClientProps = {
    inviteeUuid: string;
    isAllowed: boolean;
    inviteeName: string;
    initialWishes: Wish[];
};

export default function WeddingClient({
    inviteeUuid,
    isAllowed,
    inviteeName,
    initialWishes,
}: WeddingClientProps) {
    const inviteeDisplay = useMemo(() => {
        if (!inviteeName) {
            return "Tamu Undangan";
        }
        return inviteeName;
    }, [inviteeName]);

    const [opened, setOpened] = useState(false);
    const [remaining, setRemaining] = useState(() =>
        formatRemaining(EVENT_DATE.getTime() - Date.now()),
    );

    const [rsvpName, setRsvpName] = useState("");
    const [rsvpPax, setRsvpPax] = useState("1");
    const [attendance, setAttendance] = useState<AttendanceStatus>("hadir");
    const [rsvpStatus, setRsvpStatus] = useState("");

    const [wishName, setWishName] = useState("");
    const [wishMessage, setWishMessage] = useState("");
    const [wishes, setWishes] = useState<Wish[]>(
        initialWishes.length > 0
            ? initialWishes
            : [
                {
                    id: "1",
                    name: "Keluarga Besar",
                    message: "Semoga menjadi keluarga sakinah, mawaddah, warahmah.",
                    createdAt: "Baru saja",
                },
            ],
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [musicOn, setMusicOn] = useState(false);
    const [giftSender, setGiftSender] = useState("");
    const [giftAmount, setGiftAmount] = useState("");
    const [giftStatus, setGiftStatus] = useState("");

    useEffect(() => {
        const id = window.setInterval(() => {
            setRemaining(formatRemaining(EVENT_DATE.getTime() - Date.now()));
        }, 1000);

        return () => window.clearInterval(id);
    }, []);

    const handleOpen = async () => {
        setOpened(true);

        if (!audioRef.current) {
            return;
        }

        try {
            await audioRef.current.play();
            setMusicOn(true);
        } catch {
            setMusicOn(false);
        }
    };

    const toggleMusic = async () => {
        if (!audioRef.current) {
            return;
        }

        if (audioRef.current.paused) {
            try {
                await audioRef.current.play();
                setMusicOn(true);
            } catch {
                setMusicOn(false);
            }
        } else {
            audioRef.current.pause();
            setMusicOn(false);
        }
    };

    const submitRsvp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!rsvpName.trim()) {
            setRsvpStatus("Mohon isi nama terlebih dahulu.");
            return;
        }

        const paxValue = Number(rsvpPax);
        if (!Number.isInteger(paxValue) || paxValue <= 0) {
            setRsvpStatus("Jumlah tamu harus angka dan minimal 1.");
            return;
        }

        setRsvpStatus("Menyimpan RSVP...");

        try {
            const res = await fetch("/api/rsvp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inviteeId: inviteeUuid,
                    name: rsvpName.trim(),
                    pax: paxValue,
                    attendance,
                }),
            });

            if (!res.ok) {
                const payload = (await res.json()) as { error?: string };
                setRsvpStatus(payload.error ?? "Gagal menyimpan RSVP.");
                return;
            }

            setRsvpStatus("Terima kasih, konfirmasi kehadiran Anda sudah tercatat.");
            setRsvpName("");
            setRsvpPax("1");
            setAttendance("hadir");
        } catch {
            setRsvpStatus("Tidak dapat terhubung ke server saat ini.");
        }
    };

    const submitWish = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!wishName.trim() || !wishMessage.trim()) {
            return;
        }

        try {
            const res = await fetch("/api/wishes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inviteeId: inviteeUuid,
                    name: wishName.trim(),
                    message: wishMessage.trim(),
                }),
            });

            if (!res.ok) {
                return;
            }

            const payload = (await res.json()) as { wish?: Wish };
            if (payload.wish) {
                setWishes((prev) => [payload.wish as Wish, ...prev]);
            }
            setWishName("");
            setWishMessage("");
        } catch {
            // Ignore transport errors in UI for now to keep flow simple.
        }
    };

    const submitGiftConfirmation = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!giftSender.trim()) {
            setGiftStatus("Mohon isi nama pengirim terlebih dahulu.");
            return;
        }

        setGiftStatus("Menyimpan konfirmasi...");
        try {
            const res = await fetch("/api/gift-confirmations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    inviteeId: inviteeUuid,
                    senderName: giftSender.trim(),
                    transferAmount: giftAmount.trim(),
                }),
            });

            if (!res.ok) {
                const payload = (await res.json()) as { error?: string };
                setGiftStatus(payload.error ?? "Gagal menyimpan konfirmasi hadiah.");
                return;
            }

            setGiftStatus("Terima kasih, konfirmasi hadiah Anda sudah kami terima.");
            setGiftSender("");
            setGiftAmount("");
        } catch {
            setGiftStatus("Tidak dapat terhubung ke server saat ini.");
        }
    };

    if (!isAllowed) {
        return (
            <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-particles px-6 py-10">
                <section className="glass-card w-full max-w-md rounded-3xl px-6 py-10 text-center sm:px-10">
                    <p className="font-display text-xs tracking-[0.34em] silver-text">AKSES UNDANGAN</p>
                    <h1 className="font-script mt-5 text-5xl leading-none gold-text">Ica & Afdal</h1>
                    <p className="mt-6 text-base silver-text">
                        {inviteeUuid
                            ? "ID undangan tidak terdaftar atau nonaktif."
                            : "ID undangan tidak ditemukan."}
                    </p>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                        Mohon gunakan tautan resmi yang dikirimkan kepada Anda.
                    </p>
                    <Link
                        href="/"
                        className="font-display mt-8 inline-flex w-full items-center justify-center rounded-full border border-[rgba(212,175,55,0.65)] bg-[rgba(212,175,55,0.15)] px-6 py-3 text-xs tracking-[0.22em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.24)]"
                    >
                        KEMBALI
                    </Link>
                </section>
            </main>
        );
    }

    return (
        <main className="relative min-h-screen overflow-hidden bg-particles pb-24">
            <audio ref={audioRef} loop preload="none" src="/audio/theme.mp3" />

            {!opened && (
                <section className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(6,6,8,0.95)] px-6">
                    <div className="glass-card reveal w-full max-w-md rounded-3xl px-6 py-10 text-center sm:px-10">
                        <p className="font-display silver-text text-xs tracking-[0.34em]">UNDANGAN PERNIKAHAN</p>
                        <h1 className="font-script mt-5 text-6xl leading-none gold-text">Ica & Afdal</h1>
                        <p className="mt-4 text-lg silver-text">Sabtu, 4 April 2026</p>
                        <p className="mt-6 text-base text-[var(--text-muted)]">
                            Kepada Yth. <span className="silver-text">{inviteeDisplay}</span>
                        </p>
                        <button
                            type="button"
                            onClick={handleOpen}
                            className="font-display mt-8 w-full rounded-full border border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.15)] px-6 py-3 text-xs tracking-[0.3em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.24)]"
                        >
                            BUKA UNDANGAN
                        </button>
                        <p className="mt-4 text-sm text-[var(--text-muted)]">
                            Musik otomatis diputar jika browser mengizinkan.
                        </p>
                    </div>
                </section>
            )}

            <button
                type="button"
                onClick={toggleMusic}
                className="font-display fixed bottom-5 right-4 z-40 rounded-full border border-[rgba(184,188,198,0.4)] bg-[rgba(14,14,16,0.9)] px-4 py-2 text-xs tracking-[0.18em] silver-text"
            >
                {musicOn ? "MUSIK ON" : "MUSIK OFF"}
            </button>

            <section className="relative mx-auto max-w-5xl px-4 pt-8 sm:px-6 sm:pt-12">
                <div className="glass-card reveal relative overflow-hidden rounded-[28px] px-5 py-12 text-center sm:px-10 sm:py-16">
                    <p className="font-display silver-text text-[11px] tracking-[0.35em] sm:text-xs">THE WEDDING OF</p>
                    <h2 className="font-script mt-5 text-6xl leading-none gold-text sm:text-7xl">Ica & Afdal</h2>
                    <p className="font-display mt-6 text-sm tracking-[0.2em] silver-text sm:text-base">
                        SABTU, 4 APRIL 2026
                    </p>
                    <p className="mt-4 text-base text-[var(--text-muted)]">{`Kepada Yth. ${inviteeDisplay}`}</p>
                    <div className="section-divider" />
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-1 rounded-[28px] px-5 py-10 text-center sm:px-10">
                    <p className="font-display text-xs tracking-[0.28em] silver-text">SAVE THE DATE</p>
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
                        {[
                            { label: "Hari", value: remaining.days },
                            { label: "Jam", value: remaining.hours },
                            { label: "Menit", value: remaining.minutes },
                            { label: "Detik", value: remaining.seconds },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-[rgba(184,188,198,0.28)] bg-[rgba(10,10,12,0.55)] px-3 py-4">
                                <p className="font-display text-2xl gold-text sm:text-3xl">{item.value}</p>
                                <p className="mt-1 text-sm silver-text">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-1 rounded-[28px] px-5 py-10 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.28em] silver-text">CALON MEMPELAI</h3>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                        <article className="rounded-2xl border border-[rgba(212,175,55,0.26)] bg-[rgba(12,12,14,0.6)] p-4 text-center">
                            <div className="mx-auto h-48 w-full max-w-[220px] rounded-xl bg-gradient-to-b from-[rgba(184,188,198,0.32)] to-[rgba(12,12,14,0.7)]" />
                            <p className="font-script mt-4 text-5xl gold-text">Ica</p>
                            <p className="mt-2 text-sm silver-text">Rahma Yus Nissa, S.Pt</p>
                            <p className="mt-2 text-sm text-[var(--text-muted)]">
                                Putri ke-4 dari Bapak (alm) H. Yusmin RB & Ibu Betmawati
                            </p>
                        </article>
                        <article className="rounded-2xl border border-[rgba(184,188,198,0.3)] bg-[rgba(12,12,14,0.6)] p-4 text-center">
                            <div className="mx-auto h-48 w-full max-w-[220px] rounded-xl bg-gradient-to-b from-[rgba(212,175,55,0.3)] to-[rgba(12,12,14,0.7)]" />
                            <p className="font-script mt-4 text-5xl gold-text">Afdal</p>
                            <p className="mt-2 text-sm silver-text">Afdal Rahmadhani</p>
                            <p className="mt-2 text-sm text-[var(--text-muted)]">
                                Putra ke-4 dari Bapak Eman & Ibu Nurhayani
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-2 rounded-[28px] px-5 py-10 text-center sm:px-10">
                    <p className="font-script text-4xl gold-text sm:text-5xl">
                        &ldquo;Dan di antara tanda-tanda kekuasaan-Nya...&rdquo;
                    </p>
                    <p className="mt-5 text-base silver-text">
                        &ldquo;Dia menciptakan untukmu pasangan hidup dari jenismu sendiri agar kamu mendapatkan
                        ketenangan, dan Dia menjadikan di antaramu rasa kasih dan sayang.&rdquo; (QS. Ar-Rum: 21)
                    </p>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-2 rounded-[28px] px-5 py-10 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.28em] silver-text">DETAIL ACARA</h3>
                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                        <article className="rounded-2xl border border-[rgba(212,175,55,0.35)] bg-[rgba(11,11,13,0.55)] p-5">
                            <p className="font-display text-lg tracking-[0.18em] gold-text">AKAD NIKAH</p>
                            <p className="mt-3 silver-text">Sabtu, 4 April 2026</p>
                            <p className="silver-text">08.00 WIB s/d selesai</p>
                            <p className="mt-3 text-sm text-[var(--text-muted)]">
                                Jln. Zahlul St. Kebesaran No. 43 RT 002 RW 005 Kel. Simpang Rumbio,
                                Kec. Lubuk Sikarah, Kota Solok.
                            </p>
                        </article>
                        <article className="rounded-2xl border border-[rgba(184,188,198,0.35)] bg-[rgba(11,11,13,0.55)] p-5">
                            <p className="font-display text-lg tracking-[0.18em] gold-text">RESEPSI</p>
                            <p className="mt-3 silver-text">Sabtu, 4 April 2026</p>
                            <p className="silver-text">10.00 WIB s/d selesai</p>
                            <p className="mt-3 text-sm text-[var(--text-muted)]">
                                Jln. Zahlul St. Kebesaran No. 43 RT 002 RW 005 Kel. Simpang Rumbio,
                                Kec. Lubuk Sikarah, Kota Solok.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-2 rounded-[28px] px-5 py-10 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.28em] silver-text">KONFIRMASI KEHADIRAN</h3>
                    <form onSubmit={submitRsvp} className="mx-auto mt-6 max-w-lg space-y-4">
                        <label className="block">
                            <span className="mb-2 block text-sm silver-text">Nama</span>
                            <input
                                value={rsvpName}
                                onChange={(e) => setRsvpName(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(184,188,198,0.35)] bg-[rgba(10,10,12,0.6)] px-4 py-3 text-white outline-none focus:border-[rgba(212,175,55,0.85)]"
                                placeholder="Contoh: Budi Santoso"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-sm silver-text">Jumlah Tamu (Pax)</span>
                            <input
                                value={rsvpPax}
                                onChange={(e) => setRsvpPax(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(184,188,198,0.35)] bg-[rgba(10,10,12,0.6)] px-4 py-3 text-white outline-none focus:border-[rgba(212,175,55,0.85)]"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </label>

                        <div>
                            <p className="mb-2 text-sm silver-text">Konfirmasi</p>
                            <div className="flex flex-col gap-2 sm:flex-row">
                                <label className="flex items-center gap-2 rounded-xl border border-[rgba(184,188,198,0.3)] px-4 py-3">
                                    <input
                                        checked={attendance === "hadir"}
                                        onChange={() => setAttendance("hadir")}
                                        type="radio"
                                        name="attendance"
                                    />
                                    <span>Ya, saya hadir</span>
                                </label>
                                <label className="flex items-center gap-2 rounded-xl border border-[rgba(184,188,198,0.3)] px-4 py-3">
                                    <input
                                        checked={attendance === "tidak-hadir"}
                                        onChange={() => setAttendance("tidak-hadir")}
                                        type="radio"
                                        name="attendance"
                                    />
                                    <span>Maaf, belum bisa hadir</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="font-display w-full rounded-full border border-[rgba(212,175,55,0.7)] bg-[rgba(212,175,55,0.16)] px-6 py-3 text-xs tracking-[0.22em] text-[var(--accent-gold)]"
                        >
                            KIRIM RSVP
                        </button>

                        {rsvpStatus && <p className="text-center text-sm silver-text">{rsvpStatus}</p>}
                    </form>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-3 rounded-[28px] px-5 py-10 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.28em] silver-text">GALERI PREWEDDING</h3>
                    <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <div
                                key={idx}
                                className="aspect-[4/5] rounded-xl border border-[rgba(184,188,198,0.25)] bg-gradient-to-b from-[rgba(184,188,198,0.25)] to-[rgba(10,10,12,0.75)]"
                            />
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-3 rounded-[28px] px-5 py-10 text-center sm:px-10">
                    <h3 className="font-display text-xs tracking-[0.28em] silver-text">WEDDING GIFT</h3>
                    <p className="mt-5 text-base silver-text">Bagi Bapak/Ibu yang ingin mengirimkan tanda kasih:</p>
                    <div className="mt-5 space-y-2 text-[15px]">
                        <p className="gold-text">BCA 1234567890 a.n. Rahma Yus Nissa</p>
                        <p className="gold-text">BRI 9876543210 a.n. Afdal Rahmadhani</p>
                        <p className="text-[var(--text-muted)]">QRIS akan ditambahkan pada versi berikutnya.</p>
                    </div>

                    <form onSubmit={submitGiftConfirmation} className="mx-auto mt-7 max-w-lg space-y-3 text-left">
                        <h4 className="font-display text-center text-xs tracking-[0.24em] silver-text">
                            KONFIRMASI HADIAH
                        </h4>
                        <input
                            value={giftSender}
                            onChange={(e) => setGiftSender(e.target.value)}
                            className="w-full rounded-xl border border-[rgba(184,188,198,0.35)] bg-[rgba(10,10,12,0.6)] px-4 py-3 text-white outline-none focus:border-[rgba(212,175,55,0.85)]"
                            placeholder="Nama pengirim"
                        />
                        <input
                            value={giftAmount}
                            onChange={(e) => setGiftAmount(e.target.value)}
                            className="w-full rounded-xl border border-[rgba(184,188,198,0.35)] bg-[rgba(10,10,12,0.6)] px-4 py-3 text-white outline-none focus:border-[rgba(212,175,55,0.85)]"
                            placeholder="Nominal (opsional)"
                            inputMode="numeric"
                            pattern="[0-9]*"
                        />
                        <button
                            type="submit"
                            className="font-display w-full rounded-full border border-[rgba(212,175,55,0.7)] bg-[rgba(212,175,55,0.16)] px-6 py-3 text-center text-xs tracking-[0.22em] text-[var(--accent-gold)]"
                        >
                            KIRIM KONFIRMASI
                        </button>
                        {giftStatus && <p className="text-center text-sm silver-text">{giftStatus}</p>}
                    </form>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
                <div className="glass-card reveal delay-3 rounded-[28px] px-5 py-10 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.28em] silver-text">UCAPAN & DOA</h3>
                    <form onSubmit={submitWish} className="mx-auto mt-6 max-w-xl space-y-3">
                        <input
                            value={wishName}
                            onChange={(e) => setWishName(e.target.value)}
                            className="w-full rounded-xl border border-[rgba(184,188,198,0.35)] bg-[rgba(10,10,12,0.6)] px-4 py-3 text-white outline-none focus:border-[rgba(212,175,55,0.85)]"
                            placeholder="Nama Anda"
                        />
                        <textarea
                            value={wishMessage}
                            onChange={(e) => setWishMessage(e.target.value)}
                            className="h-28 w-full rounded-xl border border-[rgba(184,188,198,0.35)] bg-[rgba(10,10,12,0.6)] px-4 py-3 text-white outline-none focus:border-[rgba(212,175,55,0.85)]"
                            placeholder="Tulis ucapan terbaik Anda"
                        />
                        <button
                            type="submit"
                            className="font-display w-full rounded-full border border-[rgba(212,175,55,0.7)] bg-[rgba(212,175,55,0.16)] px-6 py-3 text-xs tracking-[0.22em] text-[var(--accent-gold)]"
                        >
                            KIRIM UCAPAN
                        </button>
                    </form>

                    <div className="mt-7 space-y-3">
                        {wishes.map((wish) => (
                            <article
                                key={wish.id}
                                className="rounded-xl border border-[rgba(184,188,198,0.25)] bg-[rgba(10,10,12,0.55)] px-4 py-3"
                            >
                                <p className="text-base gold-text">{wish.name}</p>
                                <p className="mt-1 text-sm silver-text">{wish.message}</p>
                                <p className="mt-2 text-xs text-[var(--text-muted)]">{wish.createdAt}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mx-auto mt-10 max-w-5xl px-4 pb-10 sm:px-6">
                <div className="glass-card reveal delay-3 rounded-[28px] px-5 py-12 text-center sm:px-10">
                    <p className="font-display text-xs tracking-[0.32em] silver-text">TERIMA KASIH</p>
                    <h3 className="font-script mt-4 text-6xl leading-none gold-text sm:text-7xl">Ica & Afdal</h3>
                    <p className="font-display mt-6 text-sm tracking-[0.2em] silver-text">SABTU, 4 APRIL 2026</p>
                    <p className="mt-4 text-base text-[var(--text-muted)]">
                        Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
                        berkenan hadir untuk memberikan doa restu.
                    </p>
                </div>
            </section>
        </main>
    );
}
