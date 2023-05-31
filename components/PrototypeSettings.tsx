import Switch from './ui/switch';
import React from 'react';
import { FlaskConical, Minus } from 'lucide-react';
import { cx } from 'class-variance-authority';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

const PrototypeSettings = ({ settings, setSetting }) => {
  const [expand, setExpand] = React.useState(false);
  return (
    <div
      className={cx(
        'fixed bottom-4 right-4 rounded-md border border-slate-200 border-transparent bg-white p-4 shadow-lg transition-all',
        // expand ? '' : 'hover:border-slate-200 hover:bg-white hover:shadow-lg',
      )}
    >
      {expand ? (
        <div className=" w-64 space-y-2  ">
          <h2>Layout options</h2>
          <Switch
            label="Use tables"
            enabled={settings.tables}
            setEnabled={value => setSetting({ tables: !settings.tables })}
          />
          <Switch
            label="Simplified profile dropdown"
            enabled={settings.simpleProfileDropdown}
            setEnabled={value => setSetting({ simpleProfileDropdown: !settings.simpleProfileDropdown })}
          />
          <hr />
          <h3>Style options</h3>
          <Switch
            label="Sidebar: gray background"
            enabled={settings.sidebarGrayBg}
            setEnabled={value => setSetting({ sidebarGrayBg: !settings.sidebarGrayBg })}
          />
          <Switch
            label="Header: dark background"
            enabled={settings.headerDarkBg}
            setEnabled={value => setSetting({ headerDarkBg: !settings.headerDarkBg })}
          />
          <div className="flex flex-1 items-center justify-end">
            <button
              onClick={() => setExpand(!expand)}
              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-slate-100"
            >
              <Minus />
            </button>
          </div>
        </div>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <button
              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-slate-100"
              onClick={() => setExpand(true)}
            >
              <FlaskConical />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Prototype configurator</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default PrototypeSettings;
