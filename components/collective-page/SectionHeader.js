import React from 'react';
import PropTypes from 'prop-types';
import { Info } from '@styled-icons/feather/Info';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import i18nCollectivePageSection from '../../lib/i18n-collective-page-section';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import StyledHr from '../StyledHr';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';

import { Dimensions } from './_constants';
import SectionTitle from './SectionTitle';

import budgetSectionHeaderIcon from '../../public/static/images/collective-navigation/CollectiveSectionHeaderIconBudget.png';
import connectSectionHeaderIcon from '../../public/static/images/collective-navigation/CollectiveSectionHeaderIconConnect.png';
import contributeSectionHeaderIcon from '../../public/static/images/collective-navigation/CollectiveSectionHeaderIconContribute.png';
import eventsSectionHeaderIcon from '../../public/static/images/collective-navigation/CollectiveSectionHeaderIconEvents.png';

const ContainerWithMaxWidth = styled(Container).attrs({
  maxWidth: Dimensions.MAX_SECTION_WIDTH,
  m: '0 auto',
})``;

const TypeIllustration = styled.img.attrs({ alt: '' })`
  width: 48px;
  height: 48px;
`;

const illustrations = {
  budget: budgetSectionHeaderIcon,
  connect: connectSectionHeaderIcon,
  contribute: contributeSectionHeaderIcon,
  events: eventsSectionHeaderIcon,
};

/**
 * New v2 section header. Pass in graphic, title, and subtitle content.
 */
const SectionHeader = ({ section, subtitle, info }) => {
  const intl = useIntl();
  const illustrationSrc = illustrations[section];
  return (
    <ContainerWithMaxWidth display="flex" flexDirection="column">
      <Box order={[1, 2]} flex="1 1 50%" width={1} p={3}>
        <Flex alignItems="center" justifyContent="center">
          <Flex alignItems="center" mr={2}>
            <TypeIllustration src={illustrationSrc} />
          </Flex>
          <Flex alignItems="center" mr={3}>
            <SectionTitle mr={2}>{i18nCollectivePageSection(intl, section)}</SectionTitle>
            <StyledTooltip content={() => info}>
              <Info size={18} color="#76777A" />
            </StyledTooltip>
          </Flex>
          <StyledHr flex="1" borderStyle="solid" borderColor="black.300" />
        </Flex>
        <Flex mb={4} justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <P color="black.700" my={2} mr={2} css={{ flex: '1 0 50%', maxWidth: 780 }}>
            {subtitle}
          </P>
        </Flex>
      </Box>
    </ContainerWithMaxWidth>
  );
};

SectionHeader.propTypes = {
  section: PropTypes.string,
  subtitle: PropTypes.object,
  info: PropTypes.object,
  /** @ignore from injectIntl */
  intl: PropTypes.object,
};

export default SectionHeader;
