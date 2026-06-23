interface AiSuggestionButtonProps {
  onClick: () => void
  isLoading?: boolean
  className?: string
}

export function AiSuggestionButton({
  onClick,
  isLoading = false,
  className = '',
}: AiSuggestionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading}
      aria-label="Sugestão IA"
      title="Sugestão IA"
      className={`inline-flex h-10 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-4 text-sm font-semibold text-violet-200 transition hover:border-violet-400/50 hover:bg-violet-500/20 hover:text-violet-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
    >
      <span>Sugestão IA</span>
      <SparklesIcon spinning={isLoading} className="h-4 w-4" />
    </button>
  )
}

function SparklesIcon({ spinning, className }: { spinning: boolean; className: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} ${spinning ? 'animate-pulse' : ''}`}
      aria-hidden="true"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4" />
      <path d="M22 5h-4" />
      <path d="M4 17v2" />
      <path d="M5 18H3" />
    </svg>
  )
}
