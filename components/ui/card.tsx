import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: 'section' | 'article' | 'div';
}

export function Card({ className, as: Component = 'section', ...props }: CardProps) {
  return <Component className={cn('rounded-3xl border border-white/10 bg-white/6 shadow-soft backdrop-blur-xl', className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function CardTitle({ className, level = 3, ...props }: CardTitleProps) {
  const tags: Record<number, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4',
    5: 'h5',
    6: 'h6',
  };
  const Tag = tags[level] || 'h3';
  return <Tag className={cn('text-xl font-semibold text-white', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
