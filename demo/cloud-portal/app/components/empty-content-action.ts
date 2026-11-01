import type { ButtonProps } from '@datum-cloud/datum-ui/button';

export type LegacyEmptyActionVariant = 'default' | 'destructive' | 'outline';

export type LegacyIconPosition = 'start' | 'end';

export function mapLegacyVariant(variant?: LegacyEmptyActionVariant): {
  type: NonNullable<ButtonProps['type']>;
  theme: NonNullable<ButtonProps['theme']>;
} {
  return {
    type: variant === 'destructive' ? 'danger' : 'secondary',
    theme: variant === 'outline' ? 'outline' : 'solid',
  };
}

export function mapLegacyIconPosition(position?: LegacyIconPosition): 'left' | 'right' | undefined {
  if (!position) return undefined;
  return position === 'end' ? 'right' : 'left';
}
