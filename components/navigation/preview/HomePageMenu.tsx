import React from 'react';
import { ChevronDown } from 'lucide-react';

import Link from '../../Link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/DropdownMenu';
import { landingPageItems } from '../menu-items';

export default function HomePageMenu() {
  return (
    <div className="flex items-center gap-4">
      {landingPageItems.map((item, i) => {
        if (item.items) {
          return (
            // eslint-disable-next-line react/no-array-index-key
            <div key={i}>
              <DropdownMenu>
                <DropdownMenuTrigger className="max-w-content group flex items-center font-medium hover:text-foreground">
                  {item.label}
                  <ChevronDown
                    className="relative top-[1px] ml-1 h-3 w-3 transition duration-200 group-data-[state=open]:rotate-180"
                    aria-hidden="true"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {item.items.map(subItem => (
                    <Link key={subItem.href} href={subItem.href}>
                      <DropdownMenuItem className="cursor-pointer">{subItem.label}</DropdownMenuItem>
                    </Link>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        }
      })}
    </div>
  );
}
