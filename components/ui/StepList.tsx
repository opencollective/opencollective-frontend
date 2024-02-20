import React from 'react';
import clsx from 'clsx';
import { Check } from 'lucide-react';

type StepListProps = React.PropsWithChildren & {
  className?: string;
};

export function StepList(props: StepListProps) {
  return <ol className={clsx('list-none', props.className)}>{props.children}</ol>;
}

type StepListItemProps = {
  completed?: boolean;
  current?: boolean;
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  className?: string;
};

export function StepListItem(props: StepListItemProps) {
  return (
    <li className={clsx('mb-6 flex cursor-default items-start gap-3 last:mb-0', props.className)}>
      <span>
        <StepListItemIcon {...props} />
      </span>
      <div className="flex flex-col overflow-hidden">
        <span className="flex-wrap overflow-hidden text-ellipsis text-sm font-medium leading-5 text-slate-700">
          {props.title}
        </span>
        <span className="flex-wrap overflow-hidden text-ellipsis text-sm font-normal leading-[18px] text-oc-blue-tints-800">
          {props.subtitle}
        </span>
      </div>
    </li>
  );
}

function StepListItemIcon(props: StepListItemProps) {
  if (props.current) {
    return (
      <div className="h-[16px] w-[16px] rounded-full bg-oc-blue-tints-transparent p-[4px]">
        <div className="h-[8px] w-[8px] rounded-full bg-oc-blue-tints-800" />
      </div>
    );
  }

  if (props.completed) {
    return (
      <span className="inline-block h-[16px] w-[16px] rounded-full bg-oc-blue-tints-800 p-[2px] text-white">
        <Check size="12px" />
      </span>
    );
  }

  return <div className="m-[4px] h-[8px] w-[8px] rounded-full bg-slate-300" />;
}
