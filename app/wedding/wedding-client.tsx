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
    "/images/wedding-4.jpeg",
    "/images/wedding-8.jpeg",
    "/images/wedding-9.jpeg",
    // "/images/wedding-10.jpeg",
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
    const [copied, setCopied] = useState(false);

    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy!', err);
        }
    };

    useEffect(() => {
        // Force scroll to top when page loads/refreshes
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });

        // Prevent body scroll when envelope is closed
        if (!opened) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [opened]);

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

    // if (!isAllowed) {
    //     return (
    //         <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-particles px-6 py-10">
    //             <section className="glass-card w-full max-w-md rounded-3xl px-6 py-10 text-center sm:px-10">
    //                 <p className="font-display text-xs tracking-[0.34em] silver-text">AKSES UNDANGAN</p>
    //                 <h1 className="font-script mt-5 text-5xl leading-none gold-text">Ica & Afdal</h1>
    //                 <p className="mt-6 text-base silver-text">
    //                     {inviteeUuid
    //                         ? "ID undangan tidak terdaftar atau nonaktif."
    //                         : "ID undangan tidak ditemukan."}
    //                 </p>
    //                 <p className="mt-3 text-sm text-[var(--text-muted)]">
    //                     Mohon gunakan tautan resmi yang dikirimkan kepada Anda.
    //                 </p>
    //                 <Link
    //                     href="/"
    //                     className="font-display mt-8 inline-flex w-full items-center justify-center rounded-full border border-[rgba(212,175,55,0.65)] bg-[rgba(212,175,55,0.15)] px-6 py-3 text-xs tracking-[0.22em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.24)]"
    //                 >
    //                     KEMBALI
    //                 </Link>
    //             </section>
    //         </main>
    //     );
    // }

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
                        <h1 className="font-script mt-6 text-7xl leading-none gold-text drop-shadow-md text-start ml-16">Ica</h1>
                        <h1 className="font-script text-3xl leading-none gold-text drop-shadow-md">&</h1>
                        <h1 className="font-script text-7xl leading-none gold-text drop-shadow-md text-end mr-10">Afdal</h1>
                        <p className="mt-5 text-lg silver-text font-serif">Sabtu, 4 April 2026</p>
                        <div className="mt-8 mb-8 section-divider w-24"></div>
                        <div className="mx-auto max-w-[280px] rounded-xl border border-[rgba(212,175,55,0.3)] bg-[rgba(10,10,12,0.6)] py-4 backdrop-blur-sm shadow-[0_4px_15px_rgba(0,0,0,0.5)]">
                            <p className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                                Kepada Yth. Bpk/Ibu/Saudara/i
                            </p>
                            <p className="mt-2 text-xl font-bold silver-text drop-shadow-md px-4">{inviteeDisplay}</p>
                        </div>

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
                className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(212,175,55,0.4)] bg-[rgba(14,14,16,0.9)] text-[var(--accent-gold)] shadow-[0_0_15px_rgba(212,175,55,0.3)] backdrop-blur-md transition-transform hover:scale-110 active:scale-95"
                title={musicOn ? "Matikan Musik" : "Putar Musik"}
            >
                <div className={`flex h-full w-full items-center justify-center rounded-full border border-dashed border-[rgba(212,175,55,0.4)] animate-spin-slow ${musicOn ? "" : "paused"}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 14.5C10.62 14.5 9.5 13.38 9.5 12C9.5 10.62 10.62 9.5 12 9.5C13.38 9.5 14.5 10.62 14.5 12C14.5 13.38 13.38 14.5 12 14.5ZM12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8Z" />
                        <circle cx="12" cy="12" r="1.5" fill="#141418" />
                    </svg>
                </div>
                {!musicOn && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-6 w-0.5 rotate-45 bg-[rgba(212,175,55,0.8)] shadow-[0_0_5px_rgba(0,0,0,1)]"></div>
                    </div>
                )}
            </button>

            {/* Hero Section */}
            <section className={`relative w-full h-[100vh] min-h-[600px] flex flex-col items-center justify-start text-center px-4 overflow-hidden mb-16 transition-opacity duration-[1500ms] ${opened ? 'opacity-100' : 'opacity-0'}`}>
                <div className="absolute inset-0 z-[-1]">
                    <Image src="/images/wedding-19.jpeg" alt="Hero Background" fill className="object-cover opacity-[0.45] block md:hidden" priority />
                    <Image src="/images/home.jpeg" alt="Hero Background" fill className="object-cover opacity-[0.45] hidden md:block" priority />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0b0b0c]/20 via-[#0b0b0c]/0 to-[#0b0b0c]/90"></div>
                    {/* <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-transparent to-transparent h-48 bottom-0"></div> */}
                </div>

                <div className="reveal relative z-10 w-full max-w-5xl mx-auto flex flex-col items-center mt-10 sm:items-end sm:mt-10">
                    <p className="font-display silver-text text-[11px] tracking-[0.4em] sm:text-xs uppercase drop-shadow-md">The Wedding Of</p>
                    <h2 className="font-script mt-6 text-7xl leading-none gold-text sm:text-8xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">Ica</h2>
                    <h2 className="font-script text-2xl leading-none gold-text sm:text-3xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">&</h2>
                    <h2 className="font-script text-7xl leading-none gold-text sm:text-8xl drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">Afdal</h2>
                    <p className="font-display mt-8 text-sm tracking-[0.25em] silver-text sm:text-base drop-shadow-md uppercase">
                        Sabtu, 4 April 2026
                    </p>
                </div>
                <div className="absolute bottom-10 animate-bounce text-[rgba(212,175,55,0.7)] text-2xl">
                    ↓
                </div>
            </section>

            {/* Save the Date Countdown */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 relative z-10 animate-breathe">
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
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe">
                <div className="glass-card reveal delay-1 rounded-3xl px-5 py-12 sm:px-12 relative overflow-hidden">
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[rgba(212,175,55,0.1)] rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[rgba(184,188,198,0.1)] rounded-full blur-3xl"></div>

                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-10">Mempelai</h3>

                    <div className="grid gap-10 sm:grid-cols-2 relative z-10">
                        {/* Groom */}
                        <article className="flex flex-col items-center text-center group mt-8 sm:mt-0 order-2 sm:order-1">
                            <div className="relative h-72 w-full max-w-[240px] rounded-t-full rounded-b-xl overflow-hidden border border-[rgba(184,188,198,0.4)] shadow-[0_0_25px_rgba(184,188,198,0.1)] transition duration-700 group-hover:scale-[1.02]">
                                <Image
                                    src="/images/afdal.jpeg"
                                    alt="Afdal"
                                    fill
                                    className="object-cover transform scale-265 transition-transform duration-700"
                                    style={{ objectPosition: '100% 40%' }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <p className="font-script mt-6 text-5xl gold-text">Afdal</p>
                            <p className="mt-3 text-[15px] silver-text font-bold tracking-wide">Afdal Rahmadhani</p>
                            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                                Putra ke-4 dari <br />Bapak Eman <br />& Ibu Nurhayani
                            </p>
                        </article>

                        {/* Bride */}
                        <article className="flex flex-col items-center text-center group order-1 sm:order-2">
                            <div className="relative h-72 w-full max-w-[240px] rounded-t-full rounded-b-xl overflow-hidden border border-[rgba(212,175,55,0.4)] shadow-[0_0_25px_rgba(212,175,55,0.15)] transition duration-700 group-hover:scale-[1.02]">
                                <Image src="/images/ica.jpeg" alt="Ica" fill className="object-cover" style={{ objectPosition: '100% 0%' }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                            </div>
                            <p className="font-script mt-6 text-5xl gold-text">Ica</p>
                            <p className="mt-3 text-[15px] silver-text font-bold tracking-wide">Rahma Yus Nissa, S.Pt</p>
                            <p className="mt-3 text-sm text-[var(--text-muted)] leading-relaxed max-w-[280px]">
                                Putri ke-4 dari <br />Bapak (alm) H. Yusmin RB <br />& Ibu Betmawati
                            </p>
                        </article>
                    </div>
                </div>
            </section>

            {/* Quote Section */}
            <section className="relative mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe" style={{ animationDelay: '1s' }}>
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
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe" style={{ animationDelay: '2s' }}>
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

                    <div className="mt-12 text-center">
                        <a
                            href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=Resepsi+Pernikahan+Ica+%26+Afdal&dates=20260404T010000Z/20260404T070000Z&details=Turut+mengundang+Bapak/Ibu/Saudara/i+pada+acara+resepsi+kami.&location=Lubuk+Sikarah,+Solok"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-display inline-block rounded-full border border-[rgba(212,175,55,0.6)] bg-[rgba(212,175,55,0.15)] px-8 py-3.5 text-xs tracking-[0.3em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.25)] hover:scale-[1.02] active:scale-95 shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                        >
                            SIMPAN KE KALENDER
                        </a>
                        <p className="mt-4 text-[11px] text-[var(--text-muted)] tracking-widest uppercase">
                            Catat Tanggalnya
                        </p>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe" style={{ animationDelay: '3s' }}>
                <div className="glass-card reveal delay-3 rounded-3xl px-5 py-12 sm:px-10">
                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-10">Momen Bahagia</h3>

                    {/* Masonry Layout fallback using CSS columns */}
                    <div className="columns-2 sm:columns-3 gap-4">
                        {galleryImages.map((src, idx) => (
                            <div
                                key={idx}
                                className="relative break-inside-avoid mb-4 overflow-hidden rounded-xl border border-[rgba(184,188,198,0.2)] group bg-[#151518] cursor-pointer"
                                onClick={() => setSelectedImage(src)}
                            >
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
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe" style={{ animationDelay: '4s' }}>
                <div className="glass-card reveal delay-2 rounded-3xl px-5 py-12 sm:px-12 relative overflow-hidden">
                    <h3 className="font-display text-center text-xs tracking-[0.3em] silver-text uppercase mb-8">Konfirmasi Kehadiran</h3>
                    <form onSubmit={submitRsvp} className="mx-auto max-w-lg space-y-6 relative z-10">
                        <label className="block">
                            <span className="mb-2 block text-xs tracking-widest silver-text uppercase">Nama</span>
                            <input
                                value={rsvpName}
                                onChange={(e) => setRsvpName(e.target.value)}
                                className="w-full rounded-xl border border-[rgba(184,188,198,0.2)] bg-[rgba(10,10,12,0.8)] px-5 py-3.5 text-white placeholder-[rgba(184,188,198,0.4)] outline-none focus:border-[rgba(212,175,55,0.7)] transition-colors focus:bg-[rgba(20,20,24,0.9)]"
                                placeholder="Contoh: Rahma Yus Nissa"
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
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe" style={{ animationDelay: '5s' }}>
                <div className="glass-card reveal delay-3 rounded-3xl px-5 py-12 text-center sm:px-12 relative">
                    <h3 className="font-display text-xs tracking-[0.3em] silver-text uppercase">Tanda Kasih</h3>
                    <p className="mt-6 text-[15px] silver-text max-w-xl mx-auto leading-relaxed">
                        Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan hadiah terindah bagi kami. Namun, apabila Anda ingin memberikan tanda kasih, dapat melalui:
                    </p>

                    <div className="mt-8 space-y-4 text-[15px]">
                        <div className="inline-block p-6 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[rgba(10,10,12,0.8)] min-w-[300px] shadow-[0_0_15px_rgba(212,175,55,0.05)] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[rgba(212,175,55,0.05)] rounded-bl-full"></div>
                            <p className="font-display gold-text tracking-widest text-xl mb-2 font-bold select-none">Bank BRI</p>
                            <div className="flex items-center justify-center gap-3 my-3">
                                <p className="text-md tracking-[0.2em] silver-text font-mono font-medium">5547 0102 4151 533</p>
                                <button
                                    onClick={() => copyToClipboard("554701024151533")}
                                    className="relative z-50 p-1.5 rounded-md hover:bg-[rgba(212,175,55,0.15)] transition-colors active:scale-95"
                                    title="Salin Nomor Rekening"
                                >
                                    {copied ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M20 6L9 17l-5-5" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M8 4V16a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H10a2 2 0 00-2 2zM4 8v12a2 2 0 002 2h10" stroke="#b8bcc6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mt-1 select-none">a.n. Rahma Yus Nissa</p>

                            {/* Copied Toast */}
                            <div className={`absolute top-2 right-1/2 translate-x-1/2 bg-[rgba(212,175,55,0.9)] text-[#0b0b0c] px-3 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all duration-300 ${copied ? 'opacity-100 transform-none' : 'opacity-0 -translate-y-4'}`}>
                                BERHASIL DISALIN
                            </div>
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
            <section className="mx-auto max-w-5xl px-4 sm:px-6 mb-20 animate-breathe" style={{ animationDelay: '6s' }}>
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
            <section className="relative mx-auto mt-20 max-w-5xl px-4 pb-20 sm:px-6 animate-breathe" style={{ animationDelay: '7s' }}>
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

            {/* Image Preview Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm transition-opacity animate-fade-in"
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        className="absolute top-6 right-6 z-10 text-white hover:text-[var(--accent-gold)] transition-colors p-2"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close image preview"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                    <div
                        className="relative flex items-center justify-center p-1 sm:p-1.5 rounded-xl shadow-[0_0_40px_rgba(212,175,55,0.25)] animate-zoom-in"
                        style={{ background: 'linear-gradient(135deg, #a67c00 0%, #bf953f 20%, #fcf6ba 40%, #b38728 60%, #fbf5b7 80%, #a67c00 100%)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-[#0b0b0c] p-1.5 sm:p-2.5 rounded-lg overflow-hidden flex items-center justify-center border border-black/50">
                            <img
                                src={selectedImage}
                                alt="Preview"
                                className="max-w-[90vw] max-h-[85vh] object-contain rounded shadow-inner"
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}