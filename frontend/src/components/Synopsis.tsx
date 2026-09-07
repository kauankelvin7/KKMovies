import { useEffect, useId, useRef, useState } from 'react';

export function Synopsis({ text }: { text?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const [clipped, setClipped] = useState(false);
  const paragraph = useRef<HTMLParagraphElement>(null);
  const id = useId();
  useEffect(() => { setExpanded(false); }, [text]);
  useEffect(() => {
    const element = paragraph.current;
    if (!element || expanded) return;
    const measure = () => setClipped(element.scrollHeight > element.clientHeight + 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element); measure();
    return () => observer.disconnect();
  }, [text, expanded]);
  return <section className="detail-synopsis" aria-label="Sinopse"><h2>Sinopse</h2><p ref={paragraph} id={id} className={expanded ? '' : 'line-clamp-3'}>{text?.trim() || 'Sinopse ainda não disponível.'}</p>{(clipped || expanded) && <button className="text-link" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>{expanded ? 'Mostrar menos' : 'Ler sinopse completa'}</button>}</section>;
}
