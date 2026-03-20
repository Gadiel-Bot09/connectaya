import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({ className, iconClassName, textClassName, showText = true, variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark'
  
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shadow-md relative overflow-hidden", 
        isDark ? "bg-white" : "bg-gradient-to-br from-blue-600 to-indigo-700",
        iconClassName
      )}>
        <svg 
           viewBox="0 0 24 24" 
           fill="none" 
           stroke="currentColor" 
           className={cn("w-6 h-6 relative z-10", isDark ? "text-blue-700" : "text-white")} 
           strokeWidth="2.5" 
           strokeLinecap="round" 
           strokeLinejoin="round"
        >
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5" />
          <path d="M13 3l-4 7h4l-2 7" className={isDark ? "text-blue-200 text-opacity-80" : "text-blue-200"} fill="currentColor" stroke="none" />
        </svg>
      </div>
      
      {showText && (
        <span className={cn(
           "text-2xl font-extrabold tracking-tight", 
           isDark ? "text-white" : "text-slate-900",
           textClassName
        )}>
          Connecta<span className={isDark ? "text-blue-400" : "text-blue-600"}>Ya</span>
        </span>
      )}
    </div>
  )
}
