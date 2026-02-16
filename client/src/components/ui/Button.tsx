import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Loader2 } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, children, leftIcon, rightIcon, disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-primary hover:bg-primary-hover text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-white/10",
            secondary: "bg-secondary hover:bg-secondary-hover text-white shadow-lg",
            outline: "border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-300",
            ghost: "bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-white",
            danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/50",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs rounded-lg",
            md: "h-10 px-4 text-sm rounded-xl",
            lg: "h-12 px-6 text-base rounded-xl",
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                    "relative inline-flex items-center justify-center font-medium transition-all duration-200 outline-none disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {!isLoading && leftIcon && <span className="mr-2">{leftIcon as React.ReactNode}</span>}
                {children}
                {!isLoading && rightIcon && <span className="ml-2">{rightIcon as React.ReactNode}</span>}

                {/* Glow effect for primary */}
                {variant === 'primary' && (
                    <div className="absolute inset-0 -z-10 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
            </motion.button>
        );
    }
);
Button.displayName = "Button";
