import { ShieldAlert, Book, Zap, Sparkles, Rocket } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface LevelInfo {
  id: string;
  nameKey: string;
  descKey: string;
  minPoints: number;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: LucideIcon;
  textColor: string;
}

export const LEVELS: LevelInfo[] = [
  {
    id: 'skeptic',
    nameKey: 'levelSkeptic',
    descKey: 'levelSkepticDesc',
    minPoints: 0,
    color: '#71717a', // zinc-500
    bgColor: 'bg-zinc-50',
    borderColor: 'border-zinc-200',
    icon: ShieldAlert,
    textColor: 'text-zinc-600'
  },
  {
    id: 'traditional',
    nameKey: 'levelTraditional',
    descKey: 'levelTraditionalDesc',
    minPoints: 101,
    color: '#3b82f6', // blue-500
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    icon: Book,
    textColor: 'text-blue-600'
  },
  {
    id: 'integrator',
    nameKey: 'levelIntegrator',
    descKey: 'levelIntegratorDesc',
    minPoints: 301,
    color: '#a855f7', // purple-500
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    icon: Zap,
    textColor: 'text-purple-600'
  },
  {
    id: 'transformer',
    nameKey: 'levelTransformer',
    descKey: 'levelTransformerDesc',
    minPoints: 601,
    color: '#f59e0b', // amber-500
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    icon: Sparkles,
    textColor: 'text-amber-600'
  },
  {
    id: 'shifter',
    nameKey: 'levelShifter',
    descKey: 'levelShifterDesc',
    minPoints: 1001,
    color: '#ef4444', // red-500
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: Rocket,
    textColor: 'text-red-600'
  }
];

export const getLevelByPoints = (points: number): LevelInfo => {
  const sortedLevels = [...LEVELS].sort((a, b) => b.minPoints - a.minPoints);
  return sortedLevels.find(level => points >= level.minPoints) || LEVELS[0];
};

export const getNextLevel = (points: number): LevelInfo | null => {
  const sortedLevels = [...LEVELS].sort((a, b) => a.minPoints - b.minPoints);
  return sortedLevels.find(level => points < level.minPoints) || null;
};
