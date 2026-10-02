import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import AnimateHeight from 'react-animate-height';
import { FormattedMessage } from 'react-intl';

import Image from '../Image';
import { Button } from '../ui/Button';

const CollapseSection = ({ title, isExpanded, toggleExpanded, subtitle, imageSrc, children }) => {
  const [height, setHeight] = useState(isExpanded ? 'auto' : 0);

  useEffect(() => {
    setHeight(isExpanded ? 'auto' : 0);
  }, [isExpanded]);

  return (
    <div>
      <div className="mt-8 mb-3 flex items-start gap-3">
        <Image src={imageSrc} width={48} height={48} />
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-3">
            <h3 className="text-lg leading-6 font-semibold text-foreground">{title}</h3>
            <div className="h-px flex-1 bg-border" />
            <Button type="button" size="xs" variant="outline" onClick={toggleExpanded}>
              {isExpanded ? (
                <React.Fragment>
                  <ChevronUp size={16} />
                  <FormattedMessage id="ShowLess" defaultMessage="Show Less" />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <ChevronDown size={16} />
                  <FormattedMessage id="Expand" defaultMessage="Expand" />
                </React.Fragment>
              )}
            </Button>
          </div>
          <p className="text-sm leading-5 text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <AnimateHeight duration={500} height={height}>
        <div className={`transition-opacity duration-500 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>{children}</div>
      </AnimateHeight>
    </div>
  );
};

export default CollapseSection;
