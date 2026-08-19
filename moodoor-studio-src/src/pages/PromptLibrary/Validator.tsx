import { GRADE_COLOR, gradeForScore, scorePrompt } from '../../lib/validator';

/**
 * Structural accuracy read-out for a prompt. Renders nothing when there's no
 * prompt to score, so callers can drop it in unguarded.
 */
export default function Validator({
  prompt,
  compact = false,
  emptyLabel = 'Awaiting prompt',
}: {
  prompt: string;
  /** Slightly smaller score type, for the composer's paste-and-check box. */
  compact?: boolean;
  emptyLabel?: string;
}) {
  const analysis = scorePrompt(prompt);
  const grade = analysis ? gradeForScore(analysis.score) : null;
  const color = grade ? GRADE_COLOR[grade.cls] : 'var(--ec-gray-500)';

  return (
    <div>
      <div className="pl-score-row">
        <div className={`pl-score-n${compact ? ' sm' : ''}`} style={{ color }}>
          {analysis ? analysis.score : '—'}
        </div>
        <div className="pl-score-grade" style={{ color }}>
          {grade ? grade.label : emptyLabel}
        </div>
      </div>

      {analysis?.checks.map((c, i) => (
        <div className="pl-check" key={i}>
          <div className={`pl-check-icon ${c.pass ? 'pass' : 'fail'}`}>{c.pass ? '✓' : '✕'}</div>
          <div>
            <div className="pl-check-label">{c.label}</div>
            <div className="pl-check-note">{c.note}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
