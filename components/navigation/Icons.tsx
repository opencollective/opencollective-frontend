import type { LucideIcon } from 'lucide-react';
import { BookOpen, ExternalLink, FileText, Home, LifeBuoy, Mailbox } from 'lucide-react';

export const ProfileMenuIcons = {
  BookOpen: 'BookOpen',
  ExternalLink: 'ExternalLink',
  Home: 'Home',
  Mailbox: 'Mailbox',
  LifeBuoy: 'LifeBuoy',
  FileText: 'FileText',
};

export const ProfileMenuIconsMap: Record<keyof typeof ProfileMenuIcons, LucideIcon> = {
  BookOpen,
  ExternalLink,
  Home,
  Mailbox,
  LifeBuoy,
  FileText,
};
