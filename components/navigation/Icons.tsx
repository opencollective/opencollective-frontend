import type { LucideIcon } from 'lucide-react';
import { BookOpen, ExternalLink, FileText, Home, LifeBuoy, Mailbox } from 'lucide-react';

import type { ProfileMenuIcons } from '../../lib/constants/profile-menu-icons';

export const ProfileMenuIconsMap: Record<keyof typeof ProfileMenuIcons, LucideIcon> = {
  BookOpen,
  ExternalLink,
  Home,
  Mailbox,
  LifeBuoy,
  FileText,
};
