export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
            <div className="w-10 h-10 border-4 border-[rgba(212,175,55,0.2)] border-t-[var(--accent-gold)] rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-bold tracking-widest uppercase text-gray-500">Memuat Data...</p>
        </div>
    )
}