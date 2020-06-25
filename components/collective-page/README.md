# Collective page

This file documents some the development choices made for the collective page, as well
as some conventions that we must follow.

### Sections

Sections must be defined in `components/collective-page/_constants.js`.
Implementation occurs in `components/collective-page/sections`, filename must be `${sectionName}.js`.
The binding of the data to the section happens in `components/collective-page/index.js`.

### Data fetching

The following rule should ideally be applied when fetching data for a section:

If the section is going to be displayed for the majority of the collectives (contribute, updates...etc)
then we should fetch the data in the page container, `pages/collective-page.js`.

However if the section will only be displayed for certain collectives, under certain conditions or
if it will only be displayed for users/organizations/hosts then the data should be fetched at the component
level.

### Space between sections

Regarding the facts that:

- Sections can be hidden or re-ordered
- The sticky NavBar requires that we have some space at the top of each section

We should not rely on the order to define spaces. Instead, each section must define a padding top
(usually `[5, 6]`) and **no padding/margin bottom**.
