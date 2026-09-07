import { getDailyQuote } from '@/data/quotes';
import type { QuoteCategory } from '@/data/quotes';

export function ThoughtOfTheDay({ category }: { category?: string | undefined }) {
  const quote = getDailyQuote((category ?? 'default') as QuoteCategory);
  return (
    <div className="rounded-xl border bg-muted/30 px-4 py-3 text-center">
      <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-widest">
        Thought of the Day
      </p>
      <p className="text-foreground mt-1 text-sm italic">&ldquo;{quote.text}&rdquo;</p>
      <p className="text-muted-foreground mt-1 text-[11px] font-medium">— {quote.author}</p>
    </div>
  );
}
