import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router';
import { type ButtonSize, type ButtonVariant, buttonClasses } from './button-styles';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & StyleProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...props} />;
}

/** A link that looks like a button. */
export function ButtonLink({ variant, size, className, ...props }: LinkProps & StyleProps) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
