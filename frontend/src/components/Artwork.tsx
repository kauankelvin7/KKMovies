import { useState } from 'react';
import { Film } from 'lucide-react';
import { getImageUrl } from '../services/movieService';

interface Props {
  paths: Array<string | null | undefined>;
  title: string;
  className?: string;
  size?: 'w200' | 'w500' | 'w780' | 'w1280';
  eager?: boolean;
}

/** Each failed or missing image advances to the next source, then a labelled placeholder. */
export function Artwork({ paths, title, className = '', size = 'w500', eager = false }: Props) {
  const sources = [...new Set(paths.filter((path): path is string => Boolean(path)).map(path => getImageUrl(path, size)))];
  const [failed, setFailed] = useState<string[]>([]);
  const src = sources.find(source => !failed.includes(source));
  return src ? <img src={src} alt={title} className={className} loading={eager ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(previous => [...previous, src])} /> : <div className={`artwork-placeholder ${className}`} role="img" aria-label={title}><Film size={27}/><span>{title}</span></div>;
}
