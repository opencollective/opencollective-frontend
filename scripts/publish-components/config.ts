export default {
  /** A list of glob patterns to define the files to include in the package */
  includeFiles: [
    // Theme lib
    'lib/theme/**/*.(js|jsx|ts|tsx)',
    'lib/styled*',
    'lib/date-utils*',
    // Avatar
    'components/Avatar*',
    // Typography
    'components/Text..*',
    // Toasts
    'components/Toast*',
    // Layout
    'components/Grid..*',
    'components/Container',
    // Misc helpers
    'components/Currency.*',
    // Filters
    'components/filters/*',
    // Loading
    'components/Loading*',
    // Styled components
    'components/StyledAmountPicker.*',
    'components/StyledButtonSet.*',
    'components/StyledButton.*',
    'components/StyledCard.*',
    'components/StyledCarousel.*',
    'components/StyledCheckbox.*',
    // 'components/StyledCollectiveCard.*', // Depends on Link
    'components/StyledDropdown.*',
    // 'components/StyledDropzone.*', // Not included as it contains API calls. Should be separated in two components, a "dumb" one and a "plugged" one
    'components/StyledFilters.*',
    'components/StyledHr.*',
    'components/StyledInputAmount.*',
    'components/StyledInputField.*',
    // 'components/StyledInputFormikField.*', // To enable, add formik to peerDependencies
    'components/StyledInputGroup.*',
    'components/StyledInputLocation.*',
    'components/StyledInputMask.*',
    'components/StyledInputPercentage.*',
    'components/StyledInputSlider.*',
    'components/EditTags.*',
    'components/StyledInput.*',
    'components/StyledKeyframes.*',
    'components/StyledLinkButton.*',
    'components/StyledLink.*',
    // 'components/StyledMembershipCard.*', // Contains a reference to StyledCollectiveCard, and thus to Link
    // 'components/StyledModal.*', // Contains a reference to Router for `warnIfUnsavedChanges`
    'components/StyledMultiEmailInput.*',
    'components/StyledProgressBar.*',
    'components/StyledRadioList.*',
    'components/StyledRoundButton.*',
    'components/StyledSelectCreatable.*',
    'components/StyledSelectFilter.*',
    'components/StyledSelect.*',
    'components/StyledSpinner.*',
    'components/StyledTag.*',
    'components/StyledTextarea.*',
    'components/StyledTooltip.*',
  ],
  /** Will be marked as peerDependencies. Remember to update scripts/publish-components/static/README.md. */
  peerDependencies: ['react', 'react-dom', 'styled-components'],
};
