import React from 'react';
import { Button } from '@/components/ui/button';

const navLinks = [
  { label: 'پیشنهادات شگفت‌انگیز', href: '/deals' },
  { label: 'فروش ویژه', href: '/special-sale' },
  { label: 'برندها', href: '/brands' },
];

export function NavLinks() {
  return (
    <>
      {navLinks.map((link) => (
        <Button key={link.href} variant='ghost' size='sm' asChild>
          <a href={link.href}>{link.label}</a>
        </Button>
      ))}
    </>
  );
}
