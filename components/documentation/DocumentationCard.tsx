import React from 'react';
import { ExternalLink } from 'lucide-react';

import Link from '../Link';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

type DocumentationCardProps = {
  title: React.ReactNode;
  excerpt: React.ReactNode;
  href: string;
  className?: string;
};

export function DocumentationCard(props: DocumentationCardProps) {
  return (
    <Link href={props.href} openInNewTab className="block">
      <Card className="cursor-pointer gap-2 border-slate-200 py-2 transition-colors hover:border-blue-300">
        <CardHeader className="px-4">
          <CardTitle className="flex items-center justify-between text-xs font-semibold text-slate-900">
            {props.title}
            <ExternalLink className="h-3 w-3 shrink-0 text-slate-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4">
          <p className="line-clamp-2 text-xs text-slate-600">{props.excerpt}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
