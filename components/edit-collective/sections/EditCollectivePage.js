import React from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { DragIndicator } from '@styled-icons/material/DragIndicator';
import { cloneDeep, difference, get, isEqual, set, uniqBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { useDrag, useDrop } from 'react-dnd';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import hasFeature, { FEATURES } from '../../../lib/allowed-features';
import DRAG_AND_DROP_TYPES from '../../../lib/constants/drag-and-drop';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import i18nCollectivePageSection from '../../../lib/i18n-collective-page-section';

import { Sections } from '../../collective-page/_constants';
import { getDefaultSectionsForCollectiveType } from '../../CollectiveNavbar';
import Container from '../../Container';
import DndProviderHTML5Backend from '../../DndProviderHTML5Backend';
import EditCollectivePageFAQ from '../../faqs/EditCollectivePageFAQ';
import { Box, Flex } from '../../Grid';
import Link from '../../Link';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledHr from '../../StyledHr';
import StyledSelect from '../../StyledSelect';
import { H3, P, Span } from '../../Text';
import { editAccountSettingsMutation } from '../mutations';

const getSettingsQuery = gqlV2/* GraphQL */ `
  query GetSettingsForEditCollectivePage($slug: String!) {
    account(slug: $slug) {
      id
      type
      settings
    }
  }
`;

const DRAG_TYPE = DRAG_AND_DROP_TYPES.COLLECTIVE_PAGE_EDIT_SECTION;

const SectionEntryContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;

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

const CollectiveSectionEntry = ({ intl, isEnabled, restrictedTo, section, index, onMove, onDrop, onSectionToggle }) => {
  const ref = React.useRef(null);

  const [, drop] = useDrop({
    accept: DRAG_TYPE,
    hover: item => onMove(item.index, index),
  });

  const [{ isDragging }, drag, preview] = useDrag({
    item: { type: DRAG_TYPE, index },
    end: item => onDrop(item.index, index),
    collect: monitor => ({ isDragging: monitor.isDragging() }),
  });

  drag(drop(ref));

  const options = [
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
      <Container mr={3} cursor="move" ref={ref}>
        <DragIndicator size={14} />
      </Container>
      <P fontWeight="bold">{i18nCollectivePageSection(intl, section)}</P>

      <StyledSelect
        fontSize="10px"
        name={`show-section-${section}`}
        defaultValue={defaultValue}
        options={options}
        minWidth={150}
        onChange={({ value }) => {
          const isEnabled = value !== 'DISABLED';
          const restrictedTo = value === 'ADMIN' ? ['ADMIN'] : [];
          onSectionToggle(section, isEnabled, restrictedTo);
        }}
        menuPortalTarget={document.body}
        formatOptionLabel={option => <Span fontSize="10px">{option.label}</Span>}
      />
    </SectionEntryContainer>
  );
};

CollectiveSectionEntry.propTypes = {
  intl: PropTypes.object,
  isEnabled: PropTypes.bool,
  restrictedTo: PropTypes.array,
  section: PropTypes.oneOf(Object.values(Sections)),
  index: PropTypes.number,
  onMove: PropTypes.func,
  onDrop: PropTypes.func,
  onSectionToggle: PropTypes.func,
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
const loadSectionsForCollective = collective => {
  const collectiveSections = get(collective, 'settings.collectivePage.sections');
  let defaultSections = getDefaultSectionsForCollectiveType(collective.type);

  // Funds MVP, to refactor
  if (collective.settings?.fund === true) {
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

const getNewSections = memoizeOne((sections, moveIndex, toIndex) => {
  const newSections = [...sections];
  newSections.splice(toIndex, 0, newSections.splice(moveIndex, 1)[0]);
  return newSections;
});

const EditCollectivePage = ({ collective }) => {
  const intl = useIntl();
  const [isDirty, setDirty] = React.useState(false);
  const [sections, setSections] = React.useState(null);
  const [tmpSections, setTmpSections] = React.useState(null);

  const { loading, data } = useQuery(getSettingsQuery, {
    variables: { slug: collective.slug },
    context: API_V2_CONTEXT,
  });

  const [submitSetting, { loading: isSubmitting }] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
  });

  // Load sections from fetched collective
  React.useEffect(() => {
    if (data?.account) {
      const sectionsFromCollective = loadSectionsForCollective(data.account);
      setSections(sectionsFromCollective);
    }
  }, [data?.account]);

  const displayedSections = tmpSections || sections;
  return (
    <DndProviderHTML5Backend>
      <H3>
        <FormattedMessage id="EditCollectivePage.Sections" defaultMessage="Page sections" />
      </H3>
      <Box mb={3}>
        <P color="black.600">
          <FormattedMessage
            id="EditCollectivePage.SectionsDescription"
            defaultMessage="In this section you can use drag and drop to reorder the Profile Page sections."
          />
        </P>
      </Box>
      <Flex flexWrap="wrap">
        <Box width="100%" maxWidth={436}>
          {loading || !displayedSections ? (
            <LoadingPlaceholder height={400} />
          ) : (
            <div>
              <StyledCard mb={4}>
                {displayedSections.map(({ section, isEnabled, restrictedTo }, index) => (
                  <React.Fragment key={section}>
                    <CollectiveSectionEntry
                      intl={intl}
                      section={section}
                      index={index}
                      isEnabled={isEnabled}
                      restrictedTo={restrictedTo}
                      onMove={(dragIndex, hoverIndex) => {
                        const newSections = getNewSections(sections, dragIndex, hoverIndex);
                        if (!isEqual(tmpSections, newSections)) {
                          setTmpSections(newSections);
                        }
                      }}
                      onDrop={(dragIndex, hoverIndex) => {
                        setTmpSections(null);
                        setSections(getNewSections(sections, dragIndex, hoverIndex));
                        setDirty(true);
                      }}
                      onSectionToggle={(selectedSection, isEnabled, restrictedTo) => {
                        const sectionIdx = sections.findIndex(({ section }) => section === selectedSection);
                        let newSections = cloneDeep(sections);
                        set(newSections, `${sectionIdx}.isEnabled`, isEnabled);
                        set(newSections, `${sectionIdx}.restrictedTo`, restrictedTo);
                        setSections(newSections);
                        setDirty(true);
                      }}
                    />
                    {index !== displayedSections.length - 1 && <StyledHr borderColor="#DCDEE0" />}
                  </React.Fragment>
                ))}
              </StyledCard>
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
                          showGoals: sections.some(({ section }) => section === Sections.GOALS),
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
  }),
};

export default EditCollectivePage;
