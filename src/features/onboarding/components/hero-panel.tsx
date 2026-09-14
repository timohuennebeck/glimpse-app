import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '@/shared/lib/cn';
interface HeroPanelProps {
  source: number;
  /** Size of the art inside the panel, e.g. `h-[220px] w-[220px]`. */
  imageClassName?: string;
  className?: string;
}

/** The lilac gradient panel with a piece of hero art in it (camera ask, sign-up). */
export function HeroPanel({ source, imageClassName, className }: HeroPanelProps) {
  return (
    <LinearGradient
      colors={['#F4EDFE', '#EDE2FD']}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      className={cn('h-[300px] items-center justify-center rounded-lg', className)}
    >
      <Image source={source} className={imageClassName} contentFit="contain" />
    </LinearGradient>
  );
}
