import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/client';
import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle';
import { DragIndicator } from '@styled-icons/material/DragIndicator';
import { cloneDeep, difference, flatten, get, isEqual, set, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { useRouter } from 'next/router';
import { useDrag, useDrop } from 'react-dnd';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import {
  addDefaultSections,
  convertSectionsToNewFormat,
  getDefaultSectionsForCollective,
  getSectionPath,
  hasNewNavbar,
} from '../../../lib/collective-sections';
import { CollectiveType } from '../../../lib/constants/collectives';
import DRAG_AND_DROP_TYPES from '../../../lib/constants/drag-and-drop';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import i18nNavbarCategory from '../../../lib/i18n/navbar-categories';
import i18nCollectivePageSection from '../../../lib/i18n-collective-page-section';

import { Sections } from '../../collective-page/_constants';
import Container from '../../Container';
import DndProviderHTML5Backend from '../../DndProviderHTML5Backend';
import EditCollectivePageFAQ from '../../faqs/EditCollectivePageFAQ';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledHr from '../../StyledHr';
import StyledSelect from '../../StyledSelect';
import StyledTooltip from '../../StyledTooltip';
import { P, Span } from '../../Text';
import { editAccountSettingsMutation } from '../mutations';
import SettingsTitle from '../SettingsTitle';

export const getSettingsQuery = gqlV2/* GraphQL */ `
  query GetSettingsForEditCollectivePage($slug: String!) {
    account(slug: $slug) {
      id
      type
      isActive
      settings
    }
  }
`;

const DRAG_TYPE = DRAG_AND_DROP_TYPES.COLLECTIVE_PAGE_EDIT_SECTION;

const SectionEntryContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px;

  ${props =>
    props.isDragging &&
    css`
      border-color: #99c9ff;
      background: #f0f8ff;
      & > * {
        opacity: 0;
      }
    `}
`;

const TopLevelMenuEntryContainer = styled.div`
  ${props =>
    props.isDragging &&
    css`
      border-color: #99c9ff;
      background: #f0f8ff;
      & > * {
        opacity: 0;
      }
    `}
`;

const getItemType = parent => {
  return parent ? `${parent.name}-${DRAG_TYPE}` : DRAG_TYPE;
};

const CollectiveSectionEntry = ({
  parentItem,
  isEnabled,
  restrictedTo,
  section,
  index,
  onMove,
  onDrop,
  onSectionToggle,
  collectiveType,
  fontWeight,
  hasData,
  showMissingDataWarning,
  showDragIcon,
}) => {
  const intl = useIntl();
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: getItemType(parentItem),
    hover: item => onMove(item, index),
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: getItemType(parentItem), index, parentItem },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
    end: onDrop,
  });

  drag(drop(ref));

  let options = [
    {
      label: <FormattedMessage id="EditCollectivePage.ShowSection.AlwaysVisible" defaultMessage="Always visible" />,
      value: 'ALWAYS',
    },
    {
      label: <FormattedMessage id="EditCollectivePage.ShowSection.OnlyAdmins" defaultMessage="Only for admins" />,
      value: 'ADMIN',
    },
    {
      label: <FormattedMessage id="EditCollectivePage.ShowSection.Disabled" defaultMessage="Disabled" />,
      value: 'DISABLED',
    },
  ];

  // Remove the "Only for admins" option if it's not a FUND or PROJECT
  // That can be re-considered later
  if (collectiveType !== CollectiveType.FUND && collectiveType !== CollectiveType.PROJECT) {
    options = options.filter(({ value }) => value !== 'ADMIN');
  }
  if (section === 'budget' && ![CollectiveType.FUND, CollectiveType.PROJECT].includes(collectiveType)) {
    options = options.filter(({ value }) => value !== 'DISABLED');
  }

  let defaultValue;
  if (!isEnabled) {
    defaultValue = options.find(({ value }) => value == 'DISABLED');
  } else if (restrictedTo && restrictedTo.includes('ADMIN')) {
    defaultValue = options.find(({ value }) => value == 'ADMIN');
  } else {
    defaultValue = options.find(({ value }) => value == 'ALWAYS');
  }

  return (
    <SectionEntryContainer ref={preview} isDragging={isDragging}>
      {showDragIcon && (
        <Container mr={3} cursor="move" ref={ref}>
          <DragIndicator size={14} />
        </Container>
      )}
      <P fontSize="14px" fontWeight={fontWeight || '500'} css={{ flex: '1' }}>
        {i18nCollectivePageSection(intl, section)}
      </P>

      <StyledSelect
        fontSize="11px"
        name={`show-section-${section}`}
        defaultValue={defaultValue}
        options={options}
        minWidth={150}
        isSearchable={false}
        onChange={({ value }) => {
          const isEnabled = value !== 'DISABLED';
          const restrictedTo = value === 'ADMIN' ? ['ADMIN'] : [];
          onSectionToggle(section, isEnabled, restrictedTo);
        }}
        formatOptionLabel={option => <Span fontSize="11px">{option.label}</Span>}
      />
      {/**
        Our query uses GQLV2, but the `filterSectionsByData` helper only work with GQLV1 at the moment.
        We'll switch this flag once either https://github.com/opencollective/opencollective/issues/2807
        or https://github.com/opencollective/opencollective/issues/3275 will be resolved.
      */}
      {showMissingDataWarning && (
        <Box width={16} ml={2}>
          {!hasData && (
            <StyledTooltip
              content={() => (
                <FormattedMessage
                  id="EditCollectivePage.EmptySection"
                  defaultMessage="This section does not appear to have any associated data and will not appear publicly until it does."
                />
              )}
            >
              <InfoCircle size={16} />
            </StyledTooltip>
          )}
        </Box>
      )}
    </SectionEntryContainer>
  );
};

CollectiveSectionEntry.propTypes = {
  isEnabled: PropTypes.bool,
  restrictedTo: PropTypes.array,
  section: PropTypes.oneOf(Object.values(Sections)),
  index: PropTypes.number,
  onMove: PropTypes.func,
  onDrop: PropTypes.func,
  onSectionToggle: PropTypes.func,
  collectiveType: PropTypes.string,
  fontWeight: PropTypes.string,
  hasData: PropTypes.bool,
  showMissingDataWarning: PropTypes.bool,
  showDragIcon: PropTypes.bool,
  parentItem: PropTypes.object,
};

export const isCollectiveSectionEnabled = (collective, section) => {
  switch (section) {
    case Sections.GOALS:
      return hasFeature(collective, FEATURES.COLLECTIVE_GOALS);
    case Sections.CONVERSATIONS:
      return hasFeature(collective, FEATURES.CONVERSATIONS);
    case Sections.UPDATES:
      return hasFeature(collective, FEATURES.UPDATES);
    default:
      return true;
  }
};

/**
 * Sections used to be stored as an array of string. This helpers loads and convert them to
 * the new format if necessary.
 */
const loadSectionsForCollective = (collective, useNewSections) => {
  const collectiveSections = get(collective, 'settings.collectivePage.sections');
  if (collective.settings?.collectivePage?.useNewSections) {
    return collectiveSections;
  }

  const defaultSections = getDefaultSectionsForCollective(collective.type, collective.isActive, useNewSections);

  const transformLegacySection = section => {
    return typeof section === 'string'
      ? { section, isEnabled: isCollectiveSectionEnabled(collective, section) }
      : section;
  };

  if (collectiveSections) {
    const existingSections = collectiveSections.map(transformLegacySection);
    const addedSections = defaultSections.map(section => ({ section, isEnabled: false }));
    return uniqBy([...existingSections, ...addedSections], 'section');
  } else {
    return defaultSections.map(transformLegacySection);
  }
};

const getNewSections = memoizeOne((sections, item, toIndex, useNewSections) => {
  const newSections = cloneDeep(sections);
  if (useNewSections && item.parentItem) {
    const subSectionsIdx = newSections.findIndex(e => e.type === 'CATEGORY' && e.name === item.parentItem.name);
    const newSubsections = [...newSections[subSectionsIdx].sections];
    newSubsections.splice(toIndex, 0, newSubsections.splice(item.index, 1)[0]);
    newSections[subSectionsIdx] = { ...newSections[subSectionsIdx], sections: newSubsections };
  } else {
    newSections.splice(toIndex, 0, newSections.splice(item.index, 1)[0]);
  }

  return newSections;
});

const MenuCategory = ({ item, index, collective, onMove, onDrop, onSectionToggle }) => {
  const intl = useIntl();
  const ref = React.useRef(null);
  const [, drop] = useDrop({
    accept: getItemType(),
    hover: item => onMove(item, index),
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: getItemType(), index },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
    end: onDrop,
  });

  drag(drop(ref));

  return (
    <TopLevelMenuEntryContainer isDragging={isDragging} ref={preview}>
      <Container
        position="relative"
        display="flex"
        px={3}
        py="10px"
        fontSize="14px"
        fontWeight="bold"
        alignItems="middle"
        boxShadow="0 3px 4px 0px #6b6b6b38"
      >
        <Container display="inline-block" mr={3} cursor="move" ref={ref}>
          <DragIndicator size={14} />
        </Container>
        <Container>{i18nNavbarCategory(intl, item.name)}</Container>
      </Container>
      <Container>
        {item.sections?.map((section, index) => (
          <Container key={section.name} pl={1} borderLeft="8px solid" borderColor="black.200" bg="black.100">
            <CollectiveSectionEntry
              parentItem={item}
              section={section.name}
              index={index}
              isEnabled={section.isEnabled}
              collectiveType={collective.type}
              restrictedTo={section.restrictedTo}
              onMove={onMove}
              onDrop={onDrop}
              onSectionToggle={onSectionToggle}
              showDragIcon={item.sections.length > 1}
            />
          </Container>
        ))}
      </Container>
    </TopLevelMenuEntryContainer>
  );
};

MenuCategory.propTypes = {
  item: PropTypes.object,
  index: PropTypes.number,
  collective: PropTypes.object,
  onMove: PropTypes.func,
  onDrop: PropTypes.func,
  onSectionToggle: PropTypes.func,
};

/**
 * Sections used to be stored as an array of string. This helpers loads and convert them to
 * the new format if necessary.
 */
const loadSectionsForCollectiveV1 = collective => {
  const collectiveSections = get(collective, 'settings.collectivePage.sections');
  let defaultSections = getDefaultSectionsForCollective(collective.type, collective.isActive);

  if (collective.type === CollectiveType.FUND) {
    // TODO this is not the right place for this
    defaultSections = difference(defaultSections, [Sections.GOALS, Sections.CONVERSATIONS]);
  }

  const transformLegacySection = section => {
    return typeof section === 'string'
      ? { section, isEnabled: isCollectiveSectionEnabled(collective, section) }
      : section;
  };

  if (collectiveSections) {
    const existingSections = collectiveSections.map(transformLegacySection);
    const addedSections = defaultSections.map(section => ({ section, isEnabled: false }));
    return uniqBy([...existingSections, ...addedSections], 'section');
  } else {
    return defaultSections.map(transformLegacySection);
  }
};

const EditCollectivePage = ({ collective }) => {
  const intl = useIntl();
  const router = useRouter();
  const useNewSections = hasNewNavbar(get(router, 'query.navbarVersion'));
  const [isDirty, setDirty] = React.useState(false);
  const [sections, setSections] = React.useState(null);
  const [tmpSections, setTmpSections] = React.useState(null);

  const { loading, data } = useQuery(getSettingsQuery, {
    variables: { slug: collective.slug },
    context: API_V2_CONTEXT,
  });

  const [submitSetting, { loading: isSubmitting, error }] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  // Load sections from fetched collective
  React.useEffect(() => {
    if (data?.account) {
      const sectionsFromCollective = loadSectionsForCollective(data.account, useNewSections);
      if (useNewSections) {
        if (!data.account.settings?.collectivePage?.useNewSections) {
          const convertedSections = convertSectionsToNewFormat(sectionsFromCollective, data.account.type);
          setSections(addDefaultSections(data.account, convertedSections));
        } else {
          setSections(addDefaultSections(data.account, sectionsFromCollective));
        }
      } else {
        setSections(loadSectionsForCollectiveV1(data.account));
      }
    }
  }, [data?.account]);

  const onMove = (item, hoverIndex) => {
    const newSections = getNewSections(sections, item, hoverIndex, useNewSections);
    if (!isEqual(tmpSections, newSections)) {
      setTmpSections(newSections);
    }
  };

  const onDrop = () => {
    setSections(tmpSections);
    setTmpSections(null);
    setDirty(true);
  };

  const onSectionToggle = (selectedSection, isEnabled, restrictedTo) => {
    const newSections = cloneDeep(sections);
    const sectionPath = getSectionPath(sections, selectedSection);
    set(newSections, `${sectionPath}.isEnabled`, isEnabled);
    set(newSections, `${sectionPath}.restrictedTo`, restrictedTo);
    setSections(newSections);
    setDirty(true);
  };

  if (!useNewSections && get(data, 'account.settings.collectivePage.useNewSections')) {
    return (
      <MessageBox type="warning" withIcon>
        This page has been temporarily disabled for this account.
      </MessageBox>
    );
  }

  const displayedSections = tmpSections || sections;
  return (
    <DndProviderHTML5Backend>
      <SettingsTitle
        subtitle={
          <FormattedMessage
            id="EditCollectivePage.SectionsDescription"
            defaultMessage="In this section you can use drag and drop to reorder the Profile Page sections."
          />
        }
      >
        <FormattedMessage id="EditCollectivePage.Sections" defaultMessage="Page sections" />
      </SettingsTitle>
      <Flex flexWrap="wrap" mt={4}>
        <Box width="100%" maxWidth={436}>
          {loading || !displayedSections ? (
            <LoadingPlaceholder height={400} />
          ) : (
            <div>
              <StyledCard mb={4}>
                {useNewSections
                  ? displayedSections.map((item, index) => (
                      <React.Fragment key={`${item.type}-${item.name}`}>
                        {index !== 0 && <StyledHr borderColor="black.200" />}
                        {item.type === 'CATEGORY' ? (
                          <MenuCategory
                            item={item}
                            index={index}
                            collective={collective}
                            onMove={onMove}
                            onDrop={onDrop}
                            onSectionToggle={onSectionToggle}
                          />
                        ) : item.type === 'SECTION' ? (
                          <CollectiveSectionEntry
                            key={`${item.type}-${item.name}`}
                            section={item.name}
                            index={index}
                            isEnabled={item.isEnabled}
                            collectiveType={collective.type}
                            restrictedTo={item.restrictedTo}
                            onMove={onMove}
                            onDrop={onDrop}
                            onSectionToggle={onSectionToggle}
                            fontWeight="bold"
                            showDragIcon
                          />
                        ) : null}
                      </React.Fragment>
                    ))
                  : displayedSections.map(({ section, isEnabled, restrictedTo }, index) => (
                      <React.Fragment key={section}>
                        <CollectiveSectionEntry
                          section={section}
                          index={index}
                          isEnabled={isEnabled}
                          collectiveType={collective.type}
                          restrictedTo={restrictedTo}
                          onMove={onMove}
                          onDrop={onDrop}
                          onSectionToggle={onSectionToggle}
                          showDragIcon
                        />
                        {index !== displayedSections.length - 1 && <StyledHr borderColor="black.200" />}
                      </React.Fragment>
                    ))}
              </StyledCard>
              {error && (
                <MessageBox type="error" fontSize="14px" withIcon my={2}>
                  {formatErrorMessage(intl, getErrorFromGraphqlException(error))}
                </MessageBox>
              )}
              <Flex flexWrap="wrap" alignItems="center" justifyContent={['center', 'flex-start']}>
                <StyledButton
                  buttonStyle="primary"
                  m={2}
                  minWidth={150}
                  loading={isSubmitting}
                  disabled={!isDirty}
                  onClick={async () => {
                    await submitSetting({
                      variables: {
                        account: { id: data.account.id },
                        key: 'collectivePage',
                        value: {
                          ...data.account.settings.collectivePage,
                          sections,
                          useNewSections,
                          showGoals: flatten(sections, item => item.sections || item).some(
                            ({ section }) => section === Sections.GOALS,
                          ),
                        },
                      },
                    });

                    setDirty(false);
                  }}
                >
                  <FormattedMessage id="save" defaultMessage="Save" />
                </StyledButton>
                <Box m={2}>
                  <Link route="collective" params={{ slug: collective.slug }}>
                    <Span fontSize="14px">
                      <FormattedMessage id="ViewCollectivePage" defaultMessage="View Profile page" />
                    </Span>
                  </Link>
                </Box>
              </Flex>
            </div>
          )}
        </Box>
        <Box ml={[0, null, null, 42]} maxWidth={400} width="100%">
          <EditCollectivePageFAQ withNewButtons withBorderLeft />
        </Box>
      </Flex>
    </DndProviderHTML5Backend>
  );
};

EditCollectivePage.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
  }),
};

export default EditCollectivePage;
