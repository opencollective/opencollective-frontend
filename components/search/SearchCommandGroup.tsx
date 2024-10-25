import React from 'react';

import { CommandGroup } from '../ui/Command';

// function SeeMoreItemsCommandItem({ onSelect, totalCount, limit, label }) {
//   if (totalCount > limit) {
//     return (
//       <CommandItem onSelect={onSelect} className="group gap-2 text-muted-foreground">
//         <div className="flex size-9 items-center justify-center rounded-md border text-muted-foreground">
//           <SearchIcon />
//         </div>
//         <span>
//           See {Number(totalCount - limit).toLocaleString()} more {label}
//         </span>
//       </CommandItem>
//     );
//   }
// }

export function SearchCommandGroup({ totalCount, label, nodes, renderNode, input }) {
  if (!totalCount || input === '') {
    return null;
  }
  // const contextQueryParam = queryFilter.values.context
  //   ? `&context[slug]=${queryFilter.values.context.slug}&context[type]=${queryFilter.values.context.type}`
  //   : '';
  return (
    <CommandGroup heading={label} className="[&:last-child_.separator]:hidden">
      {nodes.map(renderNode)}
      {/* <SeeMoreItemsCommandItem
        onSelect={() =>
          router.push(`/results?type=${type}&searchTerm=${input}${contextQueryParam}`)
        }
        key={`more-${type}`}
        totalCount={totalCount}
        limit={limit}
        label={type}
      /> */}
      <hr className="separator -mx-2 my-2 h-px bg-border" />
    </CommandGroup>
  );
}
