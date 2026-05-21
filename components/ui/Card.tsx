import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className }: CardProps) {
  return (
    <div className={cn('bg-[#111111] border border-zinc-800 rounded-xl', className)}>
      {children}
    </div>
  )
}