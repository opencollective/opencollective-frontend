import type { LucideIcon } from 'lucide-react';
import { BookOpen, ExternalLink, FileText, Home, LifeBuoy, Mailbox } from 'lucide-react';

import { ProfileMenuIcons } from '../../lib/constants/profile-menu-icons';

export { ProfileMenuIcons };

export const ProfileMenuIconsMap: Record<keyof typeof ProfileMenuIcons, LucideIcon> = {
  BookOpen,
  ExternalLink,
  Home,
  Mailbox,
  LifeBuoy,
  FileText,
};
