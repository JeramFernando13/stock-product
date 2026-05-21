interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  danger?: boolean
}

export default function StatCard({ label, value, sub, danger }: StatCardProps) {
  return (
    <div className="bg-[#111111] border border-zinc-800 rounded-xl p-4">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  )
}