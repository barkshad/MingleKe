import { cn, PLACEHOLDER_AVATAR } from '../lib/utils';

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
};

export function Avatar({ src, alt, className }: Props) {
  return (
    <img
      src={src || PLACEHOLDER_AVATAR}
      alt={alt}
      className={cn('object-cover bg-line', className)}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_AVATAR;
      }}
    />
  );
}
