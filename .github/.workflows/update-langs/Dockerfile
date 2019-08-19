FROM node:slim

# A bunch of `LABEL` fields for GitHub to index
LABEL "com.github.actions.name"="Delete merged branches"
LABEL "com.github.actions.description"="Cleans up merged branches."
LABEL "com.github.actions.icon"="gear"
LABEL "com.github.actions.color"="red"
LABEL "repository"="https://github.com/JasonEtco/node-branch-cleanup-action"
LABEL "homepage"="https://github.com/JasonEtco/node-branch-cleanup-action"
LABEL "maintainer"="Jason Etcovitch <jasonetco@github.com>"

# Copy over project files
COPY . .

# Install dependencies
RUN npm install

# This is what GitHub will run
ENTRYPOINT ["node", "/index.js"]
