'use client'

import { useFormStatus } from 'react-dom'

export default function LogoutButton() {
    const { pending } = useFormStatus()
    return (
        <button
            type="submit"
            disabled={pending}
            className="text-sm px-5 py-2 border border-gray-300 rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.96] transition-all tracking-wide flex justify-center items-center gap-2 disabled:opacity-75 disabled:pointer-events-none"
        >
            {pending ? (
                <>
                    <svg className="animate-spin -ml-1 h-3.5 w-3.5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logout...
                </>
            ) : 'Logout'}
        </button>
    )
}
