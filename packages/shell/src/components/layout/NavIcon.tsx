import { getIcon } from './iconRegistry';

export function NavIcon({ icon, className }: { icon: string; className?: string }) {
  return getIcon(icon, className || 'w-5 h-5');
}
