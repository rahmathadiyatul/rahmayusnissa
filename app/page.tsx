export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-10">
      <section className="glass-card w-full max-w-xl rounded-3xl px-6 py-10 text-center sm:px-10">
        <p className="font-display text-sm tracking-[0.28em] silver-text">UNDANGAN DIGITAL</p>
        <h1 className="font-display mt-4 text-4xl leading-tight text-white sm:text-5xl">
          Ica <span className="gold-text">&</span> Afdal
        </h1>
        <p className="mt-5 text-lg silver-text">Sabtu, 4 April 2026</p>
        <div className="section-divider" />
        <a
          className="font-display mt-8 inline-flex w-full items-center justify-center rounded-full border border-[rgba(212,175,55,0.65)] bg-[rgba(212,175,55,0.15)] px-6 py-3 text-sm tracking-[0.22em] text-[var(--accent-gold)] transition hover:bg-[rgba(212,175,55,0.24)] sm:w-auto"
          href="/wedding?invitee=00000000-0000-0000-0000-000000000001"
        >
          BUKA CONTOH UNDANGAN
        </a>
      </section>
    </main>
  );
}
