"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
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

const galleryImages = [
    "/images/wedding-1.jpeg",
    "/images/wedding-2.jpeg",
    "/images/wedding-3.jpeg",
    "/images/wedding-6.jpeg",
    "/images/wedding-7.jpeg",
    "/images/wedding-8.jpeg",
    "/images/wedding-9.jpeg",
    "/images/wedding-10.jpeg",
    "/images/wedding-11.jpeg",
    "/images/wedding-12.jpeg",
    "/images/wedding-13.jpeg",
    "/images/wedding-16.jpeg",
    "/images/wedding-18.jpeg",
    "/images/wedding-19.jpeg",
    "/images/wedding-20.jpeg",
];

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
        <main className="relative min-h-screen overflow-x-hidden bg-particles pb-24">
            <audio ref={audioRef} loop preload="none" src="/audio/theme.mp3" />

            {/* Envelope Section */}
            {!opened && (
                <section className="fixed inset-0 z-50 flex items-center justify-center px-6 transition-opacity duration-1000">
                    <div className="absolute inset-0 z-[-1]">
                        <Image src="/images/wedding-17.jpeg" alt="Background" fill className="object-cover opacity-[0.35]" priority />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/95"></div>
                    </div>

                    <div className="glass-card reveal w-full max-w-md rounded-3xl px-6 py-12 text-center sm:px-10 border border-[rgba(212,175,55,0.4)] shadow-[0_0_30px_rgba(212,175,55,0.1)]">
                        <p className="font-display silver-text text-xs tracking-[0.34em] uppercase">Undangan Pernikahan</p>
                        <h1 className="font-script mt-6 text-6xl leading-none gold-text drop-shadow-md">Ica & Afdal</h1>
                        <p className="mt-5 text-lg silver-text font-serif">Sabtu, 4 April 2026</p>
                        <div className="mt-8 mb-8 section-divider w-24"></div>
                        <p className="text-sm text-[var(--text-muted)]">
                            Kepada Yth.
                        </p>
                        <p className="mt-1 text-xl font-bold silver-text">{inviteeDisplay}</p>

                        <button
                            type="button"
                            onClick={handleOpen}
                            className="font-display mt-10 w-full rounded-full border border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.15)] px-6 py-3.5 text-xs tracking-[0.3em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.25)] hover:scale-[1.02] active:scale-95"
                        >
                            BUKA UNDANGAN
                        </button>
                        {/* <p className="mt-5 text-[11px] text-[var(--text-muted)] tracking-wider">
                            Musik otomatis diputar
                        </p> */}
                    </div>
                </section>
            )}

            <button
                type="button"
                onClick={toggleMusic}
                className="font-display fixed bottom-5 right-4 z-40 rounded-full border border-[rgba(212,175,55,0.4)] bg-[rgba(14,14,16,0.9)] px-4 py-2 text-[10px] tracking-[0.2em] text-[var(--accent-gold)] shadow-lg backdrop-blur-md transition hover:bg-[rgba(30,30,35,0.9)]"
            >
                {musicOn ? "MUSIK ON" : "MUSIK OFF"}
            </button>

            {/* Hero Section */}
            <section className={`relative w-full h-[100vh] min-h-[600px] flex flex-col items-center justify-center text-center px-4 overflow-hidden mb-16 transition-opacity duration-[1500ms] ${opened ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 z-[-1]">
                    <Image src="/images/wedding-4.jpeg" alt="Hero Background" fill className="object-cover opacity-[0.45] block md:hidden" priority />
                    <Image src="/images/wedding-5.jpeg" alt="Hero Background" fill className="object-cover opacity-[0.45] hidden md:block" priority />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c]/10 via-[#0b0b0c]/40 to-[#0b0b0c]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-transparent to-transparent h-48 bottom-0"></div>
                </div>

                <div className="reveal relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center pt-20">
                    <p className="font-display silver-text text-[11px] tracking-[0.4em] sm:text-xs uppercase drop-shadow-md">The Wedding Of</p>
                    <h2 className="font-script mt-6 text-7xl leading-none gold-text sm:text-8xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">Ica & Afdal</h2>
                    <p className="font-display mt-8 text-sm tracking-[0.25em] silver-text sm:text-base drop-shadow-md uppercase">
                        Sabtu, 4 April 2026
                    </p>
                </div>
                <div className="absolute bottom-10 animate-bounce text-[rgba(212,175,55,0.7)] text-2xl">
                    ↓
                </div>
            </section>

            {/* Save the Date Countdown */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 relative z-10">
                <div className="glass-card reveal delay-1 rounded-3xl px-5 py-12 text-center sm:px-12 border-t border-[rgba(212,175,55,0.2)]">
                    <p className="font-display text-xs tracking-[0.3em] silver-text uppercase">Menuju Hari Bahagia</p>
                    <div className="mt-8 grid grid-cols-4 gap-3 sm:gap-6 max-w-2xl mx-auto">
                        {[
                            { label: "Hari", value: remaining.days },
                            { label: "Jam", value: remaining.hours },
                            { label: "Menit", value: remaining.minutes },
                            { label: "Detik", value: remaining.seconds },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-[rgba(212,175,55,0.15)] bg-gradient-to-b from-[rgba(20,20,24,0.8)] to-[rgba(10,10,12,0.9)] px-2 py-5 shadow-lg">
                                <p className="font-display text-3xl gold-text sm:text-4xl">{item.value}</p>
                                <p className="mt-2 text-[10px] tracking-widest silver-text uppercase">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Couple Section */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-1 rounded-3xl px-5 py-12 sm:px-12 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[rgba(212,175,55,0.1)] rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[rgba(184,188,198,0.1)] rounded-full blur-3xl"></div>

                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-10">Mempelai</h3>

                    <div className="grid gap-10 sm:grid-cols-2 relative z-10">
                        {/* Bride */}
                        <article className="flex flex-col items-center text-center group">
                            <div className="relative h-72 w-full max-w-[240px] rounded-t-full rounded-b-xl overflow-hidden border border-[rgba(212,175,55,0.4)] shadow-[0_0_25px_rgba(212,175,55,0.15)] transition duration-700 group-hover:scale-[1.02]">
                                <Image src="/images/wedding-15.jpeg" alt="Ica" fill className="object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <p className="font-script mt-6 text-5xl gold-text">Ica</p>
                            <p className="mt-3 text-[15px] silver-text font-bold tracking-wide">Rahma Yus Nissa, S.Pt</p>
                            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                                Putri ke-4 dari <br />Bapak (alm) H. Yusmin RB <br />& Ibu Betmawati
                            </p>
                        </article>

                        {/* Groom */}
                        <article className="flex flex-col items-center text-center group mt-8 sm:mt-0">
                            <div className="relative h-72 w-full max-w-[240px] rounded-t-full rounded-b-xl overflow-hidden border border-[rgba(184,188,198,0.4)] shadow-[0_0_25px_rgba(184,188,198,0.1)] transition duration-700 group-hover:scale-[1.02]">
                                <Image src="/images/wedding-21.jpeg" alt="Afdal" fill className="object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <p className="font-script mt-6 text-5xl gold-text">Afdal</p>
                            <p className="mt-3 text-[15px] silver-text font-bold tracking-wide">Afdal Rahmadhani</p>
                            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                                Putra ke-4 dari <br />Bapak Eman <br />& Ibu Nurhayani
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* Quote Section */}
            <section className="relative mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-2 relative overflow-hidden rounded-3xl px-6 py-20 text-center sm:px-12 border-none">
                    <div className="absolute inset-0 z-0">
                        <Image src="/images/wedding-14.jpeg" alt="Quote Background" fill className="object-cover opacity-[0.25]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c]/95 via-[#0b0b0c]/70 to-[#0b0b0c]/95"></div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl text-[var(--accent-gold)] opacity-50 mb-4 font-serif">"</p>
                        <p className="mt-2 text-[17px] silver-text max-w-2xl mx-auto leading-loose drop-shadow-md">
                            Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri agar kamu mendapatkan
                            ketenangan, dan Dia menjadikan di antaramu rasa kasih dan sayang.
                        </p>
                        <p className="mt-6 text-sm text-[var(--accent-gold)] tracking-[0.2em] uppercase">(QS. Ar-Rum: 21)</p>
                    </div>
                </div>
            </section>

            {/* Event Details */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-2 rounded-3xl px-5 py-12 sm:px-12">
                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-10">Rangkaian Acara</h3>
                    <div className="grid gap-6 sm:grid-cols-2">
                        <article className="relative rounded-2xl border border-[rgba(212,175,55,0.3)] bg-gradient-to-b from-[rgba(20,20,24,0.8)] to-[rgba(10,10,12,0.9)] p-8 text-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(212,175,55,0.8)] to-transparent"></div>
                            <p className="font-display text-xl tracking-[0.2em] gold-text">AKAD NIKAH</p>
                            <div className="section-divider my-5 w-16" />
                            <p className="silver-text font-bold text-lg">Sabtu, 4 April 2026</p>
                            <p className="mt-2 text-[var(--text-muted)] text-sm tracking-widest">08.00 WIB - SELESAI</p>
                            <p className="mt-6 text-[15px] silver-text leading-relaxed">
                                Jln. Zahlul St. Kebesaran No. 43 <br /> RT 002 RW 005 Kel. Simpang Rumbio,<br />
                                Kec. Lubuk Sikarah, Kota Solok.
                            </p>
                        </article>

                        <article className="relative rounded-2xl border border-[rgba(184,188,198,0.3)] bg-gradient-to-b from-[rgba(20,20,24,0.8)] to-[rgba(10,10,12,0.9)] p-8 text-center overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[rgba(184,188,198,0.8)] to-transparent"></div>
                            <p className="font-display text-xl tracking-[0.2em] silver-text">RESEPSI</p>
                            <div className="section-divider my-5 w-16 opacity-50" />
                            <p className="silver-text font-bold text-lg">Sabtu, 4 April 2026</p>
                            <p className="mt-2 text-[var(--text-muted)] text-sm tracking-widest">10.00 WIB - SELESAI</p>
                            <p className="mt-6 text-[15px] silver-text leading-relaxed">
                                Jln. Zahlul St. Kebesaran No. 43 <br /> RT 002 RW 005 Kel. Simpang Rumbio,<br />
                                Kec. Lubuk Sikarah, Kota Solok.
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-3 rounded-3xl px-5 py-12 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-10">Momen Bahagia</h3>

                    {/* Masonry Layout fallback using CSS columns */}
                    <div className="columns-2 sm:columns-3 gap-4">
                        {galleryImages.map((src, idx) => (
                            <div key={idx} className="relative break-inside-avoid mb-4 overflow-hidden rounded-xl border border-[rgba(184,188,198,0.2)] group bg-[#151518]">
                                <Image
                                    src={src}
                                    alt={`Gallery image ${idx + 1}`}
                                    width={400}
                                    height={600}
                                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* RSVP */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-2 rounded-3xl px-5 py-12 sm:px-12 relative overflow-hidden">
                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-8">Konfirmasi Kehadiran</h3>
                    <form onSubmit={submitRsvp} className="mx-auto max-w-lg space-y-6 relative z-10">
                        <label className="block">
                            <span className="mb-2 block text-xs tracking-widest silver-text uppercase">Nama</span>
                            <input
                                value={rsvpName}
                                onChange={(e) => setRsvpName(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-3.5 text-white placeholder-[rgba(184,188,198,0.4)] outline-none focus:border-[rgba(212,175,55,0.7)] transition-colors focus:bg-[rgba(20,20,24,0.9)]"
                                placeholder="Contoh: Budi Santoso"
                            />
                        </label>

                        <label className="block">
                            <span className="mb-2 block text-xs tracking-widest silver-text uppercase">Jumlah Tamu (Pax)</span>
                            <div className="relative">
                                <input
                                    value={rsvpPax}
                                    onChange={(e) => setRsvpPax(e.target.value)}
                                    className="w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-3.5 text-white outline-none focus:border-[rgba(212,175,55,0.7)] transition-colors focus:bg-[rgba(20,20,24,0.9)]"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                />
                            </div>
                        </label>

                        <div>
                            <span className="mb-3 block text-xs tracking-widest silver-text uppercase">Kehadiran</span>
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <label className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 cursor-pointer transition-all ${attendance === 'hadir' ? 'border-[rgba(212,175,55,0.7)] bg-[rgba(212,175,55,0.1)] text-[var(--accent-gold)]' : 'border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] silver-text hover:border-[rgba(184,188,198,0.4)]'}`}>
                                    <input
                                        checked={attendance === "hadir"}
                                        onChange={() => setAttendance("hadir")}
                                        type="radio"
                                        name="attendance"
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium">Ya, saya hadir</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-2 rounded-xl border px-4 py-3.5 cursor-pointer transition-all ${attendance === 'tidak-hadir' ? 'border-[rgba(212,175,55,0.7)] bg-[rgba(212,175,55,0.1)] text-[var(--accent-gold)]' : 'border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] silver-text hover:border-[rgba(184,188,198,0.4)]'}`}>
                                    <input
                                        checked={attendance === "tidak-hadir"}
                                        onChange={() => setAttendance("tidak-hadir")}
                                        type="radio"
                                        name="attendance"
                                        className="hidden"
                                    />
                                    <span className="text-sm font-medium">Maaf, tidak hadir</span>
                                </label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="font-display mt-4 w-full rounded-full border border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.15)] px-6 py-4 text-xs tracking-[0.25em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.25)] hover:scale-[1.01]"
                        >
                            KIRIM RSVP
                        </button>

                        {rsvpStatus && <p className="text-center text-sm text-[var(--accent-gold)] mt-4 p-3 bg-[rgba(212,175,55,0.1)] rounded-lg border border-[rgba(212,175,55,0.2)]">{rsvpStatus}</p>}
                    </form>
                </div>
            </section>

            {/* Gift */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-3 rounded-3xl px-5 py-12 text-center sm:px-12 relative">
                    <h3 className="font-display text-xs tracking-[0.3em] silver-text uppercase">Tanda Kasih</h3>
                    <p className="mt-6 text-[15px] silver-text max-w-xl mx-auto leading-relaxed">
                        Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah bagi kami. Namun, apabila Anda ingin memberikan tanda kasih, dapat melalui:
                    </p>

                    <div className="mt-8 space-y-4 text-[15px]">
                        <div className="inline-block p-5 rounded-xl border border-[rgba(212,175,55,0.2)] bg-[rgba(10,10,12,0.6)] min-w-[280px]">
                            <p className="font-display gold-text tracking-widest text-lg mb-1">BCA</p>
                            <p className="text-xl tracking-widest silver-text font-mono my-2">1234 5678 90</p>
                            <p className="text-sm text-[var(--text-muted)]">a.n. Rahma Yus Nissa</p>
                        </div>
                        <div className="inline-block p-5 rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.6)] min-w-[280px]">
                            <p className="font-display silver-text tracking-widest text-lg mb-1">BRI</p>
                            <p className="text-xl tracking-widest silver-text font-mono my-2">9876 5432 10</p>
                            <p className="text-sm text-[var(--text-muted)]">a.n. Afdal Rahmadhani</p>
                        </div>
                    </div>

                    <div className="section-divider my-10 opacity-50"></div>

                    <form onSubmit={submitGiftConfirmation} className="mx-auto max-w-lg space-y-5 text-left">
                        <h4 className="font-display text-center text-xs tracking-[0.25em] silver-text mb-6">
                            KONFIRMASI PENGIRIMAN
                        </h4>
                        <div>
                            <input
                                value={giftSender}
                                onChange={(e) => setGiftSender(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-3.5 text-white placeholder-[rgba(184,188,198,0.4)] outline-none focus:border-[rgba(212,175,55,0.7)] transition-colors"
                                placeholder="Nama Pengirim"
                            />
                        </div>
                        <div>
                            <input
                                value={giftAmount}
                                onChange={(e) => setGiftAmount(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-3.5 text-white placeholder-[rgba(184,188,198,0.4)] outline-none focus:border-[rgba(212,175,55,0.7)] transition-colors"
                                placeholder="Nominal Transfer (opsional)"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>
                        <button
                            type="submit"
                            className="font-display w-full rounded-full border border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.1)] px-6 py-4 text-center text-xs tracking-[0.25em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.2)]"
                        >
                            KIRIM KONFIRMASI
                        </button>
                        {giftStatus && <p className="text-center text-sm text-[var(--accent-gold)] mt-4 p-3 bg-[rgba(212,175,55,0.1)] rounded-lg border border-[rgba(212,175,55,0.2)]">{giftStatus}</p>}
                    </form>
                </div>
            </section>

            {/* Wishes */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20">
                <div className="glass-card reveal delay-3 rounded-3xl px-5 py-12 sm:px-12">
                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-8">Ucapan & Doa</h3>
                    <form onSubmit={submitWish} className="mx-auto max-w-xl space-y-4">
                        <input
                            value={wishName}
                            onChange={(e) => setWishName(e.target.value)}
                            className="w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-3.5 text-white placeholder-[rgba(184,188,198,0.4)] outline-none focus:border-[rgba(212,175,55,0.7)] transition-colors"
                            placeholder="Nama Anda"
                        />
                        <textarea
                            value={wishMessage}
                            onChange={(e) => setWishMessage(e.target.value)}
                            className="h-32 w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-4 text-white placeholder-[rgba(184,188,198,0.4)] outline-none focus:border-[rgba(212,175,55,0.7)] resize-none transition-colors"
                            placeholder="Tulis ucapan terbaik Anda untuk kedua mempelai..."
                        />
                        <button
                            type="submit"
                            className="font-display w-full rounded-full border border-[rgba(184,188,198,0.4)] bg-[rgba(184,188,198,0.05)] px-6 py-4 text-xs tracking-[0.25em] silver-text transition hover:bg-[rgba(184,188,198,0.15)] hover:text-white"
                        >
                            KIRIM UCAPAN
                        </button>
                    </form>

                    <div className="mt-10 mx-auto max-w-xl max-h-[500px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                        {wishes.map((wish) => (
                            <article
                                key={wish.id}
                                className="rounded-xl border border-[rgba(184,188,198,0.15)] bg-[rgba(15,15,18,0.5)] px-5 py-4 shadow-sm"
                            >
                                <p className="text-base font-bold gold-text">{wish.name}</p>
                                <p className="mt-2 text-sm silver-text leading-relaxed">{wish.message}</p>
                                <p className="mt-3 text-[11px] uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[rgba(184,188,198,0.4)] inline-block"></span>
                                    {wish.createdAt}
                                </p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Closing */}
            <section className="relative mx-auto mt-20 max-w-5xl px-4 pb-20 sm:px-6">
                <div className="glass-card reveal delay-3 relative overflow-hidden rounded-3xl px-5 py-24 text-center sm:px-12 border-none">
                    <div className="absolute inset-0 z-0">
                        <Image src="/images/wedding-17.jpeg" alt="Closing Background" fill className="object-cover opacity-[0.25]" />
                        <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c]/90 via-[#0b0b0c]/60 to-[#0b0b0c]"></div>
                    </div>
                    <div className="relative z-10">
                        <p className="font-display text-xs tracking-[0.4em] silver-text uppercase">Terima Kasih</p>
                        <p className="mt-8 text-sm silver-text max-w-xl mx-auto leading-loose drop-shadow-md">
                            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i
                            berkenan hadir untuk memberikan doa restu.
                        </p>
                        <p className="mt-6 text-xs text-[var(--text-muted)]">Kami yang berbahagia,</p>
                        <h3 className="font-script mt-6 text-6xl leading-none gold-text sm:text-7xl drop-shadow-lg">Ica & Afdal</h3>
                        <p className="font-display mt-8 text-[11px] tracking-[0.2em] silver-text uppercase">Keluarga Besar Bpk (alm) H. Yusmin RB &amp; Keluarga Besar Bpk Eman</p>
                    </div>
                </div>
            </section>
        </main>
    );
}