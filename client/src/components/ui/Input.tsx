import React from 'react';
import { motion } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, leftIcon, ...props }, ref) => {
        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label className="text-xs font-medium text-zinc-400 ml-1">
                        {label}
                    </label>
                )}
                <div className="relative group">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-primary transition-colors duration-200">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            "w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 py-2.5 outline-none transition-all duration-200",
                            "text-zinc-200 placeholder:text-zinc-600",
                            "focus:border-primary/50 focus:bg-zinc-900/80 focus:shadow-[0_0_15px_rgba(99,102,241,0.1)]",
                            "disabled:opacity-50 disabled:cursor-not-allowed",
                            leftIcon && "pl-10",
                            error && "border-red-500/50 focus:border-red-500/50 focus:shadow-[0_0_15px_rgba(239,68,68,0.1)]",
                            className
                        )}
                        {...props}
                    />
                    {/* Bottom highlight line */}
                    <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 transform scale-x-0 group-focus-within:scale-x-100" />
                </div>
                {error && (
                    <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 ml-1"
                    >
                        {error}
                    </motion.p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";
