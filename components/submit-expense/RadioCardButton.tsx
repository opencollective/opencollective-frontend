import React from 'react';
import clsx from 'clsx';

type RadioCardButtonProps = {
  title: React.ReactNode;
  content?: React.ReactNode;
  checked?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
};

export function RadioCardButton(props: RadioCardButtonProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={!props.disabled ? props.onClick : undefined}
      onKeyDown={e => {
        if (props.disabled) {
          return;
        }

        if (e.code === 'Enter' || e.code === 'Space') {
          props.onClick();
        }
      }}
      className={clsx(props.className, 'group rounded-md border  p-4 text-start', {
        'cursor-pointer hover:border-oc-blue-tints-500': !props.disabled,
        'border-oc-blue-tints-500': props.checked,
        'border-slate-300': !props.checked,
        'cursor-not-allowed text-slate-300': props.disabled,
      })}
    >
      <div className="flex flex-1 items-center gap-4">
        <div
          className={clsx('mt-1 h-[16px] w-[16px] min-w-[16px] rounded-full border', {
            'border-[5px] border-oc-blue-tints-500': props.checked,
            'border-slate-300': !props.checked,
            'group-hover:border-oc-blue-tints-500': !props.disabled,
          })}
        ></div>
        <div className="flex-grow">{props.title}</div>
      </div>
      {props.content && <div>{props.content}</div>}
    </div>
  );
}
