'use client';

import { useFormStatus } from 'react-dom';
import { Loader2, Save } from 'lucide-react';

interface SubmitButtonProps {
    text?: string;
    icon?: any;
    className?: string;
}

export function SubmitButton({ text = 'Salvar', icon: Icon = Save, className }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`flex items-center gap-2 px-6 py-2.5 bg-brand hover:bg-brand-950 text-white rounded-lg font-medium transition-colors shadow-lg shadow-brand/20 disabled:opacity-50 ${className || ''}`}
        >
            {pending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Icon className="w-5 h-5" />}
            {text}
        </button>
    );
}
