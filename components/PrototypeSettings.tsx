import Switch from './ui/switch';
import React, { useContext } from 'react';
import { FlaskConical, Minus } from 'lucide-react';
import { cx } from 'class-variance-authority';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { SettingsContext } from '../lib/SettingsContext';

const PrototypeSettings = () => {
  const [expand, setExpand] = React.useState(false);
  const { settings, setSettings } = useContext(SettingsContext);
  const setSetting = newSetting => {
    setSettings({ ...settings, ...newSetting });
  };
  return (
    <div
      className={cx(
        'fixed bottom-4 right-4 rounded-md border border-slate-200 border-transparent bg-white p-4 shadow-lg transition-all',
        // expand ? '' : 'hover:border-slate-200 hover:bg-white hover:shadow-lg',
      )}
    >
      {expand ? (
        <div className=" w-64  ">
          <h3 className="mb-2">Layout options</h3>
          <div className="mb-4 space-y-2 ">
            <Switch
              label="Use tables"
              enabled={settings.tables}
              setEnabled={value => setSetting({ tables: !settings.tables })}
            />
            {/* <Switch
              label="Simplified profile dropdown"
              enabled={settings.simpleProfileDropdown}
              setEnabled={value => setSetting({ simpleProfileDropdown: !settings.simpleProfileDropdown })}
            /> */}
          </div>
          <hr className="mb-4" />
          <h3 className="mb-2">Style options</h3>
          <div className="space-y-2  ">
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
            <Switch
              label="Header: gray bg"
              enabled={settings.headerGrayBg}
              setEnabled={value => setSetting({ headerGrayBg: !settings.headerGrayBg })}
            />
            <Switch
              label="Main content: gray background"
              enabled={settings.mainGrayBg}
              setEnabled={value => setSetting({ mainGrayBg: !settings.mainGrayBg })}
            />
            <Switch
              label="Header shadow"
              enabled={settings.shadows}
              setEnabled={value => setSetting({ shadows: !settings.shadows })}
            />
            <Switch
              label="Sidebar shadow"
              enabled={settings.shadowsSidebar}
              setEnabled={value => setSetting({ shadowsSidebar: !settings.shadowsSidebar })}
            />
          </div>
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
