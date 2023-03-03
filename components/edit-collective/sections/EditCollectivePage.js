import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation, useQuery } from '@apollo/client';
import { closestCenter, DndContext, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle';
import { DragIndicator } from '@styled-icons/material/DragIndicator';
import { cloneDeep, flatten, get, isEqual, set } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { getCollectiveSections, getSectionPath } from '../../../lib/collective-sections';
import { CollectiveType } from '../../../lib/constants/collectives';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../../lib/errors';
import { API_V2_CONTEXT, gqlV1 } from '../../../lib/graphql/helpers';
import i18nNavbarCategory from '../../../lib/i18n/navbar-categories';
import i18nCollectivePageSection from '../../../lib/i18n-collective-page-section';

import { Sections } from '../../collective-page/_constants';
import Container from '../../Container';
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
import SettingsSubtitle from '../SettingsSubtitle';

export const getSettingsQuery = gql`
  query GetSettingsForEditCollectivePage($slug: String!) {
    account(slug: $slug) {
      id
      type
      currency
      isActive
      isHost
      settings
      policies {
        EXPENSE_AUTHOR_CANNOT_APPROVE {
          enabled
          amountInCents
          appliesToHostedCollectives
          appliesToSingleAdminCollectives
        }
        COLLECTIVE_MINIMUM_ADMINS {
          numberOfAdmins
          applies
          freeze
        }
      }
      ... on AccountWithHost {
        host {
          id
          policies {
            EXPENSE_AUTHOR_CANNOT_APPROVE {
              enabled
              amountInCents
              appliesToHostedCollectives
              appliesToSingleAdminCollectives
            }
          }
        }
      }
    }
  }
`;

export const collectiveSettingsV1Query = gqlV1/* GraphQL */ `
  query EditCollectivePage($slug: String) {
    Collective(slug: $slug) {
      id
      settings
    }
  }
`;

const ItemContainer = styled.div`
  ${props =>
    props.isDragging &&
    css`
      border-color: #99c9ff;
      background: #f0f8ff;
      & > * {
        opacity: 0;
      }
    `}

  background: ${props =>
    props.isDragging
      ? '#f0f8ff'
      : !props.isDragOverlay
      ? 'transparent'
      : props.isSubSection
      ? props.theme.colors.black[100]
      : 'white'};

  ${props =>
    props.isDragOverlay &&
    css`
      box-shadow: 0px 4px 6px rgba(26, 27, 31, 0.16);
    `}
`;

const CollectiveSectionEntry = ({
  isEnabled,
  version,
  restrictedTo,
  section,
  onSectionToggle,
  collectiveType,
  isSubSection,
  hasData,
  showMissingDataWarning,
  showDragIcon,
  dragHandleProps,
}) => {
  const intl = useIntl();

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
      label: <FormattedMessage defaultMessage="Disabled" />,
      value: 'DISABLED',
    },
  ];

  // Remove the "Only for admins" option if it's not a FUND or PROJECT
  // That can be re-considered later
  if (collectiveType !== CollectiveType.FUND && collectiveType !== CollectiveType.PROJECT) {
    options = options.filter(({ value }) => value !== 'ADMIN');
  }
  // Can't hide the budget, except if already hidden
  if (section === 'budget') {
    if (isEnabled && !isEqual(restrictedTo, ['ADMIN'])) {
      options = options.filter(({ value }) => value !== 'ADMIN' && value !== 'DISABLED');
    }
    // New budget version not available for
    if (collectiveType !== CollectiveType.USER) {
      options.push({
        label: (
          <FormattedMessage id="EditCollectivePage.ShowSection.AlwaysVisibleV2" defaultMessage="New version visible" />
        ),
        value: 'ALWAYS_V2',
      });
    }
  }

  let defaultValue;
  if (!isEnabled) {
    defaultValue = options.find(({ value }) => value === 'DISABLED');
  } else if (restrictedTo && restrictedTo.includes('ADMIN')) {
    defaultValue = options.find(({ value }) => value === 'ADMIN');
  } else if (version === 2) {
    defaultValue = options.find(({ value }) => value === 'ALWAYS_V2');
  } else {
    defaultValue = options.find(({ value }) => value === 'ALWAYS');
  }

  return (
    <Flex justifyContent="space-between" alignItems="center" padding="4px 16px">
      {showDragIcon && (
        <Container mr={3} cursor="move" {...dragHandleProps}>
          <DragIndicator size={14} />
        </Container>
      )}
      <P
        letterSpacing={isSubSection ? undefined : 0}
        fontSize="14px"
        fontWeight={isSubSection ? '500' : '700'}
        css={{ flex: '1' }}
      >
        {i18nCollectivePageSection(intl, section)}
      </P>

      <StyledSelect
        inputId={`section-select-${section}`}
        fontSize="11px"
        name={`show-section-${section}`}
        defaultValue={defaultValue}
        options={options}
        minWidth={150}
        isSearchable={false}
        onChange={({ value }) => {
          const isEnabled = value !== 'DISABLED' || value === 'ALWAYS_V2';
          const restrictedTo = value === 'ADMIN' ? ['ADMIN'] : [];
          const version = value === 'ALWAYS_V2' ? 2 : 1;
          onSectionToggle(section, { isEnabled, restrictedTo, version });
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
    </Flex>
  );
};

CollectiveSectionEntry.propTypes = {
  isEnabled: PropTypes.bool,
  restrictedTo: PropTypes.array,
  section: PropTypes.oneOf(Object.values(Sections)),
  index: PropTypes.number,
  version: PropTypes.number,
  onMove: PropTypes.func,
  onDrop: PropTypes.func,
  onSectionToggle: PropTypes.func,
  collectiveType: PropTypes.string,
  fontWeight: PropTypes.string,
  hasData: PropTypes.bool,
  showMissingDataWarning: PropTypes.bool,
  showDragIcon: PropTypes.bool,
  parentItem: PropTypes.object,
  dragHandleProps: PropTypes.object,
  isSubSection: PropTypes.bool,
};

const MenuCategory = ({ item, collective, onSectionToggle, setSubSections, dragHandleProps }) => {
  const intl = useIntl();

  const [draggingId, setDraggingId] = React.useState(null);
  function handleDragStart(event) {
    setDraggingId(event.active.id);
  }
  function handleDragEnd(event) {
    const { active, over } = event;
    setDraggingId(null);
    if (active.id !== over.id) {
      const oldSubsections = item.sections;
      const oldIndex = oldSubsections.findIndex(item => item.name === active.id);
      const newIndex = oldSubsections.findIndex(item => item.name === over.id);

      const newSections = arrayMove(oldSubsections, oldIndex, newIndex);
      setSubSections(newSections);
    }
  }

  const draggingItem = item.sections.find(item => item.name === draggingId);

  return (
    <React.Fragment>
      <Container
        display="flex"
        px={3}
        py="10px"
        fontSize="14px"
        fontWeight="bold"
        boxShadow="0 3px 4px 0px #6b6b6b38"
        alignItems="center"
      >
        <Container display="inline-block" mr={3} cursor="move" {...dragHandleProps}>
          <DragIndicator size={14} />
        </Container>
        <Container>{i18nNavbarCategory(intl, item.name)}</Container>
      </Container>
      <Container>
        <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={item.sections?.map(item => item.name)} strategy={verticalListSortingStrategy}>
            {item.sections?.map(section => (
              <Container key={section.name} pl={1} borderLeft="8px solid" borderColor="black.200" bg="black.100">
                <DraggableItem
                  id={section.name}
                  item={section}
                  collective={collective}
                  onSectionToggle={onSectionToggle}
                  showDragIcon={item.sections.length > 1}
                  isSubSection
                />
              </Container>
            ))}
          </SortableContext>
          <DragOverlay>
            {draggingItem ? (
              <Item item={draggingItem} collective={collective} showDragIcon isDragOverlay isSubSection />
            ) : null}
          </DragOverlay>
        </DndContext>
      </Container>
    </React.Fragment>
  );
};

MenuCategory.propTypes = {
  item: PropTypes.object,
  index: PropTypes.number,
  collective: PropTypes.object,
  onMove: PropTypes.func,
  onDrop: PropTypes.func,
  onSectionToggle: PropTypes.func,
  setSubSections: PropTypes.func,
  isDragOverlay: PropTypes.bool,
  dragHandleProps: PropTypes.object,
};

const Item = React.forwardRef(
  (
    {
      dragHandleProps,
      isDragging,
      isDragOverlay,
      style,
      setSubSections,
      onSectionToggle,
      collective,
      item,
      isSubSection,
      showDragIcon,
    },
    ref,
  ) => {
    return (
      <ItemContainer
        ref={ref}
        style={style}
        isDragging={isDragging}
        isDragOverlay={isDragOverlay}
        isSubSection={isSubSection}
      >
        {item.type === 'CATEGORY' ? (
          <MenuCategory
            item={item}
            collective={collective}
            onSectionToggle={onSectionToggle}
            setSubSections={setSubSections}
            dragHandleProps={dragHandleProps}
          />
        ) : item.type === 'SECTION' ? (
          <CollectiveSectionEntry
            section={item.name}
            isEnabled={item.isEnabled}
            version={item.version}
            collectiveType={collective.type}
            restrictedTo={item.restrictedTo}
            onSectionToggle={onSectionToggle}
            isSubSection={isSubSection}
            showDragIcon={showDragIcon}
            dragHandleProps={dragHandleProps}
          />
        ) : null}
      </ItemContainer>
    );
  },
);

Item.propTypes = {
  dragHandleProps: PropTypes.object,
  isDragging: PropTypes.bool,
  isDragOverlay: PropTypes.bool,
  style: PropTypes.object,
  item: PropTypes.object,
  collective: PropTypes.object,
  onSectionToggle: PropTypes.func,
  setSubSections: PropTypes.func,
  isSubSection: PropTypes.bool,
  showDragIcon: PropTypes.bool,
};

Item.displayName = 'Item';

const MemoizedItem = memo(Item);

const DraggableItem = props => {
  const { attributes, listeners, isDragging, setNodeRef, transform, transition } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <MemoizedItem
      ref={setNodeRef}
      style={style}
      dragHandleProps={{ ...attributes, ...listeners }}
      isDragging={isDragging}
      {...props}
    />
  );
};

DraggableItem.propTypes = {
  item: PropTypes.object,
  collective: PropTypes.object,
  onSectionToggle: PropTypes.func,
  setSubSections: PropTypes.func,
  isSubSection: PropTypes.bool,
  showDragIcon: PropTypes.bool,
  id: PropTypes.string,
};

const EditCollectivePage = ({ collective }) => {
  const intl = useIntl();
  const [isDirty, setDirty] = React.useState(false);
  const [sections, setSections] = React.useState([]);
  const [draggingId, setDraggingId] = React.useState(null);

  const { loading, data } = useQuery(getSettingsQuery, {
    variables: { slug: collective.slug },
    context: API_V2_CONTEXT,
  });

  const [submitSetting, { loading: isSubmitting, error }] = useMutation(editAccountSettingsMutation, {
    context: API_V2_CONTEXT,
    // Refresh the settings for GQLV1 cache, to refresh the navbar
    refetchQueries: [{ query: collectiveSettingsV1Query, variables: { slug: collective.slug } }],
  });

  // Load sections from fetched collective
  React.useEffect(() => {
    if (data?.account) {
      const sections = getCollectiveSections(data.account);
      setSections(sections);
    }
  }, [data?.account]);

  const onSectionToggle = (selectedSection, { isEnabled, restrictedTo, version }) => {
    const newSections = cloneDeep(sections);
    const sectionPath = getSectionPath(sections, selectedSection);
    set(newSections, `${sectionPath}`, { ...get(newSections, sectionPath), isEnabled, restrictedTo, version });
    setSections(newSections);
    setDirty(true);
  };

  function handleDragStart(event) {
    setDraggingId(event.active.id);
  }

  function handleDragEnd(event) {
    const { active, over } = event;
    setDraggingId(null);
    if (active.id !== over.id) {
      const oldIndex = sections.findIndex(item => item.name === active.id);
      const newIndex = sections.findIndex(item => item.name === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      setDirty(true);
    }
  }

  const draggingSection = sections.find(section => section.name === draggingId);

  return (
    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <SettingsSubtitle>
        <FormattedMessage
          id="EditCollectivePage.SectionsDescription"
          defaultMessage="Drag and drop to reorder sections. Toggle on and off with the visibility setting dropdown. Remember to click save at the bottom!"
        />
      </SettingsSubtitle>
      <Flex flexWrap="wrap" mt={4}>
        <Box width="100%" maxWidth={436}>
          {loading || !sections ? (
            <LoadingPlaceholder height={400} />
          ) : (
            <div>
              <StyledCard mb={4} overflowX={'visible'} overflowY="visible" position="relative">
                <SortableContext items={sections?.map(item => item.name)} strategy={verticalListSortingStrategy}>
                  {sections.map((item, index) => {
                    return (
                      <React.Fragment key={item.name}>
                        {index !== 0 && <StyledHr borderColor="black.200" />}

                        <DraggableItem
                          id={item.name}
                          item={item}
                          collective={collective}
                          onSectionToggle={onSectionToggle}
                          fontWeight="bold"
                          showDragIcon
                          setSubSections={subSections => {
                            const newSections = cloneDeep(sections);
                            const subSectionsIdx = newSections.findIndex(
                              e => e.type === 'CATEGORY' && e.name === item.name,
                            );
                            newSections[subSectionsIdx] = { ...newSections[subSectionsIdx], sections: subSections };
                            setSections(newSections);
                            setDirty(true);
                          }}
                        />
                      </React.Fragment>
                    );
                  })}
                </SortableContext>
                <DragOverlay>
                  {draggingSection ? (
                    <Item item={draggingSection} collective={collective} isDragOverlay showDragIcon />
                  ) : null}
                </DragOverlay>
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
                  <Link href={`/${collective.slug}`}>
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
    </DndContext>
  );
};

EditCollectivePage.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
    type: PropTypes.string,
  }),
};

export default EditCollectivePage;
