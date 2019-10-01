# About translations

## 🚨️🚨️🚨️ Please never update the translation files manually 🚨️🚨️🚨️

The proper way to update the translation files is to use:

```bash
npm run build:langs
```

If you've edited the files already, you can do the following:

```bash
# If work has already being commit, reset to the pre-commit state
git reset --soft HEAD~0
# Checkout language files to their HEAD version
git checkout langs/*
# Build languages
npm run build langs
# Add the changes to git
git add langs
# Commit
git commit
# Use `-f` if commit was already pushed
git push -f
```
