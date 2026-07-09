// Design-sync mock of next/link — swapped in via .design-sync/tsconfig.ds.json.
// next/link pulls in the Next.js App Router client runtime (~180KB) and
// expects a router context this static bundle never provides. A design
// system consumed outside Next.js needs a plain anchor anyway.
import type { AnchorHTMLAttributes, ReactNode } from 'react';

interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children?: ReactNode;
}

export default function Link({ href, children, ...rest }: LinkProps) {
  return (
    <a href={href} {...rest}>
      {children}
    </a>
  );
}
