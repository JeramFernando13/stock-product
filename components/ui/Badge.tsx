import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'blue' | 'green' | 'red' | 'amber'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-zinc-800 text-zinc-400',
  blue: 'bg-blue-950/60 text-blue-400 border border-blue-800/50',
  green: 'bg-green-950/60 text-green-400 border border-green-800/50',
  red: 'bg-red-950/60 text-red-400 border border-red-800/50',
  amber: 'bg-amber-950/60 text-amber-400 border border-amber-800/50',
}

export default function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}