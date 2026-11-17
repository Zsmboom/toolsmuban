import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Section from '~/components/ui/section';
import { useTranslations } from '~/lib/i18n-context';

const QUESTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

/**
 * FAQ 折叠件。
 *
 * 之前八条问答是写死的英文，而 messages.faq.* 里同样的八条一直没被用。
 * 无障碍部分（真 <h3> 包 <button>、aria-expanded / aria-controls）
 * 原来就写对了，原样保留。
 *
 * 首项默认展开：一个全折叠的 FAQ 区块看上去像没加载完。
 */
export default function FAQ() {
  const t = useTranslations('faq');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section id="faq" tone="subtle" eyebrow={t('eyebrow')} title={t('title')} lede={t('subtitle')}>
      <div className="grid-hairline mx-auto max-w-3xl grid-cols-1">
        {QUESTIONS.map((n, index) => {
          const open = openIndex === index;
          return (
            <div key={n} className="bg-card">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : index)}
                  aria-expanded={open}
                  aria-controls={`faq-answer-${n}`}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-5 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent sm:px-6"
                >
                  {t(`question${n}.q`)}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      open ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </h3>
              {open ? (
                <div id={`faq-answer-${n}`} role="region" className="px-5 pb-5 sm:px-6">
                  <p className="measure text-sm leading-relaxed text-muted-foreground">
                    {t(`question${n}.a`)}
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
