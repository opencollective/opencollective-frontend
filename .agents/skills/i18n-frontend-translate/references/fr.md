# French (`fr`) Style Guide

Rules for `lang/fr.json` (paths are relative to `opencollective-frontend/`). Read this before translating, reviewing or bulk-editing French strings. The goal is French that reads as if a French-speaking product team wrote it, not as a translation of the English: no calques ("supprimé avec succès", "Êtes-vous sûr"), no English capitals on common nouns ("votre Collectif"), and one French term per concept ("actualité" for a Collective's Update, never "mise à jour").

Priority when rules conflict: placeholders intact > financial accuracy > one term per concept > natural French > closeness to the English wording.

## Principles

1. **Write French, not translated English.** Work out what the string does in the UI, then write what a French product team would write: reorder, split or shorten freely. Read the French on its own. If it sounds translated, it is a calque: rewrite it. See [Calques](#calques).
2. **Financial accuracy first.** Use the words a French association treasurer or accountant uses: solde, justificatif, note de frais, plan comptable, rapprochement, prestataire de paiement.
3. **One concept, one term.** Match the glossary, then the existing catalog. Users must never wonder whether "méthode de paiement" and "moyen de paiement" are two different things.
4. **Address the user as "vous".** Buttons and menu items use an infinitive or a noun ("Enregistrer", "Soumettre une dépense"). See [Addressing the user](#addressing-the-user).
5. **Keep the brand.** "Open Collective" is never translated ("Collectif ouvert" and "Open Collectif" were real bugs) and elides like any word starting with a vowel: "d'Open Collective", "l'équipe d'Open Collective".
6. **French capitalization.** Common nouns are lowercase mid-sentence, product concepts included: "votre collectif", "l'hôte fiscal", "votre organisation". Titles, buttons and menu items use sentence case: "Fonds ajoutés", "Hôtes fiscaux". See [Typography](#typography).
7. **No inclusive writing.** Prefer an epicene word when a natural one exists ("membres", "personnes", "équipe"), otherwise the masculine generic ("contributeurs", "administrateurs"). No point médian ("contributeur·rices"), no "(e)", no doubled forms ("contributeurs et contributrices"). When agreement with the reader would be gendered, rephrase if it is easy: "Voulez-vous vraiment …" rather than "Êtes-vous sûr …".
8. **Never rename placeholders.** ICU argument names (`{amount}`), rich-text tag names (`<Link>`, `<Individual></Individual>`) and plural/select keys (`one`, `other`, `ORGANIZATION`) stay exactly as in English. `{valeur}` for `{value}` and `{Name}` for `{name}` were real bugs. The French around them can be restructured freely, including moving words into branches (see [Grammar pitfalls](#grammar-pitfalls)).

## Key terms

The most visible terms in the product. Get these right before anything else.

| English         | French          | Notes                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open Collective | Open Collective | Brand name, never translated and never one word.                                                                                                                                                                                                                                                                                                                                                                               |
| Collective      | collectif       | Masculine: le collectif, les collectifs.                                                                                                                                                                                                                                                                                                                                                                                       |
| Organization    | organisation    |                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Fiscal Host     | hôte fiscal     | Masculine: l'hôte fiscal, les hôtes fiscaux. Once the context is clear, "l'hôte" alone ("les administrateurs de l'hôte"). The verb is "héberger" ("les collectifs hébergés"), and the service (Fiscal Hosting) is "l'hébergement fiscal". Not "Fiscal Host" in English, "sponsor fiscal" or "parrain". In help text, explain it once: "un hôte fiscal, c'est-à-dire la structure juridique qui détient l'argent du collectif". |

Brand names keep their English form and capitals: "Open Source Collective", "Open Collective Europe", "Open Collective Foundation".

## Glossary

### Accounts and roles

| English                                            | French                | Notes                                                                                                                                                                                                                                                                   |
| -------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Individual (account type)                          | personne              | "Type de compte : Personne". Not "individu" or "individuel". In legal and tax text: "personne physique" / "personne morale".                                                                                                                                            |
| Fund (account type)                                | fonds                 | Masculine, same form in singular and plural: un fonds, les fonds. "fonds" also means money ("ajouter des fonds"): where the two could be confused, name the account ("le fonds {name}") or say "argent" / "montant". "Funds & Grants" (menu) is "Fonds et subventions". |
| Project, Event                                     | projet, événement     | "événement" with two acute accents, the spelling used throughout the catalog.                                                                                                                                                                                           |
| Admin                                              | administrateur        | The short "Admin" only in the existing tight label `AdminPanel.button`.                                                                                                                                                                                                 |
| Core contributor (team role)                       | membre de l'équipe    |                                                                                                                                                                                                                                                                         |
| User                                               | utilisateur           |                                                                                                                                                                                                                                                                         |
| Vendor                                             | fournisseur           |                                                                                                                                                                                                                                                                         |
| Payee / payer                                      | bénéficiaire / payeur | The bénéficiaire receives a payout.                                                                                                                                                                                                                                     |
| Host fee                                           | frais de l'hôte       | Not "frais d'hébergement" (sounds like web hosting) or "commission". Platform fee: "frais de plateforme".                                                                                                                                                               |
| Agreement (between a host and a hosted collective) | convention            | Feminine: une convention, "Ajouter une convention". Host agreements: "conventions d'hébergement". The usual French word for a signed document between an association and the projects it carries. Not "accord".                                                         |
| Plan (Open Collective pricing)                     | forfait               | "le forfait Pro", "changer de forfait". Not "plan", and not "formule", which is reserved for tiers.                                                                                                                                                                     |

### People who give

| English              | French                        | Notes                                                                                                                                                                                                                       |
| -------------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contributor, backer  | contributeur                  | Covers money and work (French open-source projects call code contributors "contributeurs" too), so no split is needed. Financial contributor: "contributeur financier". Not "donateur" (implies a donation) or "supporter". |
| Sponsor              | sponsor                       | Not "mécène".                                                                                                                                                                                                               |
| Grantmakers, funders | financeurs                    | Not "bailleurs de fonds" (heavier, with a development-aid flavor).                                                                                                                                                          |
| Grantee              | bénéficiaire de la subvention |                                                                                                                                                                                                                             |

### Money in

| English                                  | French                               | Notes                                                                                                                                                                                                                                                 |
| ---------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contribution                             | contribution                         | Feminine. Not "don", which implies a donation: keep "don" only where the English says donation (tier type "Donation" is "Don"). Buttons "Contribute" and "Make contribution": "Contribuer".                                                           |
| Recurring / one-time contribution        | contribution récurrente / ponctuelle | Frequencies: mensuelle, annuelle.                                                                                                                                                                                                                     |
| Contribution tier                        | formule                              | Feminine: une formule, cette formule. "Choisir une formule", "formule de contribution". Not "palier" (in French crowdfunding a palier is a stretch goal) or "niveau".                                                                                 |
| Ticket (event tier type)                 | billet                               | "Billets", "catégories de billets". Not "ticket".                                                                                                                                                                                                     |
| Membership (tier type)                   | adhésion                             |                                                                                                                                                                                                                                                       |
| Perks, rewards                           | contreparties                        | The word French crowdfunding platforms use. Not "récompenses".                                                                                                                                                                                        |
| Goal                                     | objectif                             |                                                                                                                                                                                                                                                       |
| Tip jar (a simple one-off donation page) | cagnotte                             | Not "boîte à pourboires": a pourboire is the platform tip.                                                                                                                                                                                            |
| Crowdfunding                             | financement participatif             |                                                                                                                                                                                                                                                       |
| Expected funds                           | fonds attendus                       |                                                                                                                                                                                                                                                       |
| Added funds / add funds                  | fonds ajoutés / ajouter des fonds    |                                                                                                                                                                                                                                                       |
| Payment method (how a contributor pays)  | moyen de paiement                    | Masculine. The standard French banking term. Not "méthode de paiement" or "mode de paiement".                                                                                                                                                         |
| Credit card                              | carte bancaire                       | "carte" in short labels. Not "carte de crédit": most French cards are debit cards, and "carte bancaire" covers both.                                                                                                                                  |
| Bank transfer / direct debit             | virement / prélèvement               | "virement SEPA", "prélèvement SEPA", "prélèvement ACH".                                                                                                                                                                                               |
| Payment processor                        | prestataire de paiement              | "frais du prestataire de paiement". Not "processeur de paiement", or "fournisseur de paiement" (fournisseur is a vendor).                                                                                                                             |
| Subscription (recurring payment)         | abonnement                           | Not "souscription" (shares, insurance).                                                                                                                                                                                                               |
| Disputed                                 | contestée                            | Agrees with "contribution".                                                                                                                                                                                                                           |
| Platform tip                             | pourboire                            | Masculine: le pourboire, les pourboires. Long form "pourboire pour la plateforme" or "pourboire pour Open Collective". In help text, explain it once: "un pourboire facultatif qui finance la plateforme". "Tip" in the sense of advice is "conseil". |

### Money out

French has a single word for refund and reimbursement, "remboursement", and context separates them. The reimbursement expense type gets its own name, "note de frais".

| English                                    | French                  | Notes                                                                                                                                  |
| ------------------------------------------ | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Expense                                    | dépense                 | Feminine. The generic object, whatever its type. Not "note de frais" (one type of expense) or "frais".                                 |
| Expense type Invoice                       | facture                 |                                                                                                                                        |
| Expense type Receipt / Reimbursement       | note de frais           | Feminine. Getting paid back for a purchase already made: what French companies and associations call a "note de frais".                |
| Expense type Grant                         | subvention              | Feminine. Grant request: "demande de subvention". "Allow grants" (expense policy): "Autoriser les demandes de subvention".             |
| Expense type Settlement                    | règlement               |                                                                                                                                        |
| Receipt (proof attached to an expense)     | justificatif            | Masculine. "Joindre un justificatif", "justificatif manquant". A reçu, a ticket de caisse and a facture are all kinds of justificatif. |
| Receipt (document issued to a contributor) | reçu                    | "reçu de paiement", "reçus annuels". Tax-deductible: "reçu fiscal".                                                                    |
| Refund (money returned to a contributor)   | remboursement           | "rembourser une contribution".                                                                                                         |
| Payout (money paid to a payee)             | versement               | Menu "Payouts": "Versements". Not "paiement sortant", or "remboursement" (paying an invoice reimburses nothing).                       |
| Payout method                              | mode de versement       | Masculine. Kept distinct from "moyen de paiement", which is how contributors pay.                                                      |
| Disbursement (seen from the host)          | décaissement            | Not "déboursement".                                                                                                                    |
| Approve / reject                           | approuver / rejeter     | Statuses: approuvée, rejetée. Decline (an application, a contribution): "refuser".                                                     |
| Submit (an expense, an application)        | soumettre               | Sending a message, an invitation or an e-mail: "envoyer".                                                                              |
| Pending / on hold                          | en attente / en suspens | Two different expense statuses that must stay different. "Put on hold": "mettre en suspens".                                           |
| Paused (contribution)                      | en pause                | "mettre en pause", "reprendre".                                                                                                        |
| Tax form                                   | formulaire fiscal       | Tax information: "informations fiscales".                                                                                              |
| Legal name                                 | nom légal               | Not "nom juridique". Display name: "nom d'affichage".                                                                                  |

### Ledger and accounting

Chart of accounts, categories, exports, bank imports. Readers are accountants and treasurers, so use their terms.

| English                    | French                 | Notes                                                                                              |
| -------------------------- | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Balance                    | solde                  | "solde total", "solde estimé". Not "balance" (in French accounting, a balance is a trial balance). |
| Credit / debit             | crédit / débit         | Correct in French accounting, unlike German. A ledger debit is never a "prélèvement".              |
| Transaction                | transaction            | Not "opération".                                                                                   |
| Ledger                     | grand livre            | Not "registre".                                                                                    |
| Chart of accounts          | plan comptable         | Not "tableau de comptes".                                                                          |
| Accounting category        | catégorie comptable    |                                                                                                    |
| Reconcile                  | rapprocher             | "rapprochement bancaire", "transactions rapprochées".                                              |
| Off-platform               | hors plateforme        |                                                                                                    |
| Opposite account (exports) | compte de contrepartie | The accounting term, unrelated to the "contreparties" of a tier.                                   |
| Fiscal year                | exercice               | "exercice comptable" in accounting. "année fiscale" for yearly totals on tax receipts.             |
| VAT                        | TVA                    | VAT number: "numéro de TVA". Tax ID: "numéro d'identification fiscale".                            |
| Accountant                 | comptable              |                                                                                                    |

### Applications

French separates three things English calls "application":

| English                                           | French                | Notes                                                                            |
| ------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------- |
| Host application (applying to join a fiscal host) | candidature           | "candidater", "formulaire de candidature", "accepter / refuser une candidature". |
| App (software, OAuth)                             | application           |                                                                                  |
| Grant request                                     | demande de subvention |                                                                                  |

A bare "Applications" or "Apply" can be any of these: find where the id is used before translating.

### Collective content, account and security

| English                      | French                                     | Notes                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Update (a Collective's post) | actualité                                  | Feminine: une actualité, les actualités. "Publier une actualité", "Nouvelle actualité", "Actualité publiée", "Actualité n° {id}". Keep "mettre à jour" for the verb and "mise à jour" for software or data updates. |
| Sign in / sign up / log out  | se connecter / s'inscrire / se déconnecter | Nouns: connexion, inscription. "Créer un compte" also works for sign up. Not "s'identifier" or "s'authentifier".                                                                                                    |
| Two-factor authentication    | authentification à deux facteurs (2FA)     |                                                                                                                                                                                                                     |
| Token                        | jeton                                      |                                                                                                                                                                                                                     |
| Email                        | e-mail                                     | "adresse e-mail", "les e-mails". Not "email", "courriel" or "mail".                                                                                                                                                 |
| Settings / save / edit       | paramètres / enregistrer / modifier        | Not "réglages", "sauvegarder", or "éditer" (in French, éditer means to publish).                                                                                                                                    |
| Dashboard / workspace        | tableau de bord / espace de travail        |                                                                                                                                                                                                                     |
| Upload / download            | importer / télécharger                     | "Importer un fichier", "Importer des conventions". "télécharger" alone reads as download.                                                                                                                           |

## English terms we keep

Brand names (Stripe, PayPal, Wise, GitHub), technical terms (webhook, API, CSV, URL, slug, 2FA, KYC, explained once as "vérification d'identité (KYC)") and the English words French already uses: tags, newsletter, sponsor, blog, avatar, meetup, open source (lowercase as an adjective: "projets open source").

Translate where English is tempting: tableau de bord, jeton, financement participatif, billet, versement, administrateur, cagnotte, actualité.

### Register intentional English in `IGNORED`

A string that is correctly identical to English needs its **id** in `IGNORED.fr` in `scripts/i18n/translation-stats.ts`; otherwise `show-untranslated.ts fr` keeps listing it and the next translation run turns it into French. When a term rule changes, remove the ids it now translates from `IGNORED.fr` ("Email" becomes "E-mail", "Ticket" becomes "Billet").

## Addressing the user

Use "vous", like HelloAsso, Ulule, Qonto and Shine. "vous" also addresses a group, so copy a Collective sends to all its contributors needs no exception.

| Where                                     | Form                             | Example                                                 |
| ----------------------------------------- | -------------------------------- | ------------------------------------------------------- |
| Buttons, menu items, tabs, column headers | Infinitive or noun               | "Enregistrer", "Soumettre une dépense", "Paramètres"    |
| Instructions, help text, placeholders     | vous, imperative                 | "Saisissez le montant", "Vérifiez vos informations"     |
| Marketing calls to action                 | Imperative allowed               | "Créez votre collectif", "Rejoignez-nous"               |
| Progress and success messages             | Noun or past participle          | "Enregistrement…", "Dépense soumise", "Carte supprimée" |
| Confirmations                             | "Voulez-vous vraiment … ?"       | "Voulez-vous vraiment supprimer cette carte ?"          |
| Errors                                    | What went wrong, then what to do | "Impossible d'enregistrer la dépense. Réessayez."       |
| Activity log with an actor tag            | Passé composé with "a"           | "<Individual></Individual> a approuvé …"                |
| Activity log without an actor             | Noun phrase or participle        | "Rappel envoyé à <Account></Account>"                   |

Keep "Veuillez" for formal requests and errors ("Veuillez réessayer"); instructions read better as a plain imperative. Keep "S'il vous plaît" out of the UI.

## Tone

- **Short and direct.** Say what happens, then stop: "Carte supprimée" rather than "La carte a été supprimée avec succès".
- **Verbs over noun chains.** "Envoyez automatiquement les instructions de virement" rather than "Fourniture automatique des instructions de virement".
- **"nous" for Open Collective** when it is the actor: "Nous prévenons vos contributeurs".
- **Explain administrative terms where they appear**, in half a sentence: "un hôte fiscal, c'est-à-dire …".
- **Friendly asides and idioms belong in help and marketing text**, never in errors or money confirmations. "Oups" is fine on a 404 page.
- **Exclamation marks are rare**, and absent from errors and money confirmations.

### Calques

Literal translations that mark a string as machine-translated. Fix them whenever you touch a string. Calques of glossary terms (carte de crédit, processeur de paiement, souscription, sauvegarder, éditer) are covered above.

| English                        | Calque                    | French                                |
| ------------------------------ | ------------------------- | ------------------------------------- |
| X successfully deleted         | X supprimé avec succès    | X supprimé                            |
| Are you sure you want to …     | Êtes-vous sûr de vouloir… | Voulez-vous vraiment …                |
| based on                       | basé sur                  | selon, en fonction de, d'après        |
| supported (feature, file type) | supporté                  | pris en charge                        |
| support (a Collective)         | supporter                 | soutenir                              |
| initiate                       | initier                   | lancer, démarrer                      |
| not found                      | non trouvé                | introuvable, aucun résultat           |
| commented on                   | a commenté sur            | a commenté                            |
| using X                        | en utilisant X            | avec X, via X                         |
| created at {date}              | créé à {date}             | créé le {date}                        |
| load more                      | charger plus              | afficher plus                         |
| ZIP code                       | code ZIP                  | code postal                           |
| chapter (local group)          | chapitre                  | antenne, groupe local                 |
| by doing so                    | en faisant ainsi          | ce faisant                            |
| please (mid-sentence)          | s'il vous plaît           | imperative, or "veuillez"             |
| them (a Collective)            | eux, leur                 | lui, son, sa: a collectif is singular |

## Grammar pitfalls

- **Gender of status labels.** A bare past participle agrees with the object it describes, so find the component before translating one. Feminine: dépense, contribution, transaction, candidature, carte, actualité, note de frais ("Payée", "Rejetée", "Contestée", "Publiée"). Masculine: compte, versement, fonds, projet, événement, collectif, justificatif. The build already allows duplicate English for words ending in "-ed" and for the words in `DUPLICATED_IGNORED_MESSAGES` (`scripts/i18n/translate.js`), so one id per context is normal. When a single id serves both genders, see [Shared message ids](#shared-message-ids).
- **Agreement after a term swap.** Every article, adjective and participle follows the new noun: "palier" (m) to "formule" (f) turns "ce palier a été supprimé" into "cette formule a été supprimée"; "méthode de paiement" (f) to "moyen de paiement" (m); "reçu" (m) to "note de frais" (f).
- **Agreeing words inside select branches.** Put the article, the possessive and anything that agrees inside each branch: `{type, select, COLLECTIVE {votre collectif est archivé} ORGANIZATION {votre organisation est archivée} other {votre compte est archivé}}`.
- **Plural `one` includes 0.** In French "0 contribution" is singular, and the CLDR `one` category covers 0 and 1. For "Aucune contribution", add an `=0` branch. `one` and `other` are enough (`many`, used for millions, falls back to `other`). Words that depend on the count go inside the branches: `{count, plural, one {# dépense est en attente} other {# dépenses sont en attente}}`.
- **No elision before placeholders.** A name can start with any letter, so write "de {collective}" and "le profil de {name}", never "d'{name}". "d'Open Collective" is fine: the brand is fixed.
- **Interpolated nouns without an article.** `{accountType}` comes from `formatCollectiveType` as a bare noun ("Collectif", "Projet") of unknown gender. Use apposition: "Le solde de ce compte ({accountType}) …".
- **Hyphenated imperatives.** "Dépensez-le", "Ajoutez-en un", "Rejoignez-nous".

## Typography

- **Capitalization.** Sentence case for titles, buttons, menus and column headers: "Exporter les collectifs hébergés". Lowercase for common nouns mid-sentence, account types and product concepts included, and after a colon: "Attention : la désactivation de la TVA …". Accents stay on capitals: "État", "Événement", "À propos".
- **Spaces.** A plain space before `:`, `;`, `!`, `?` and `%`, and inside guillemets: "Besoin d'aide ?", "15 %", "{rate} %". Use the ordinary space character: browsers already keep `: ; ! ?` on the line of the preceding word, and no-break spaces are invisible in review.
- **Quotes.** Guillemets with spaces: « Nouvelle actualité », « {name} ». Nested quotes: “…”. Straight double quotes look English and need escaping in JSON.
- **Apostrophe.** The straight apostrophe `'`, as in most of the catalog. Replace `’` in strings you edit, so the catalog converges on one form.
- **Ellipsis.** The single character "…", with no space before it: "Recherche…", "Enregistrement…".
- **Dashes.** Rephrase an English em dash with a colon, parentheses or a comma. Where a dash is really needed, a spaced en dash: " – ".
- **Abbreviations.** "Ex. :" at the start of a placeholder ("Ex. : dons récurrents"), "par exemple" in running text, "etc.". English "#{id}" in titles becomes "n° {id}": "Dépense n° {id}".
- **"&" in labels** becomes "et" ("Factures et reçus"), except in brand names.
- **Numbers and currencies** come formatted from `Intl`: keep "€", "$" and thousands separators out of translations.

## Shared message ids

One English id is often reused in several places. When French needs different words in those places (a gender, "Candidater" vs "Appliquer" for "Apply", "Actualité" vs "Mettre à jour" for "Update"), no single translation is right everywhere.

- **Fix it in code, not with a compromise translation.** Give the other place its own message, reusing an existing one when it fits. If the task is limited to `lang/fr.json`, translate for the most visible usage and report the id as needing a code split.
- **Two ids with the same English text are allowed only on purpose.** `npm run build:langs` fails on duplicate English strings unless they end in "-ed" or are listed in `DUPLICATED_IGNORED_MESSAGES` in `scripts/i18n/translate.js`, with a comment saying why the translation depends on context.
- **Watch for fragments.** English labels like "Paid", "Since" or "Other" lean on context that French has to make explicit through agreement or a fuller phrase.

## Deliberate choices

- **"hôte fiscal"** is a calque ("fiscal" means tax-related in French), but French collectives on Open Collective already use it (Open Collective Paris, CaptainFact), and it forms a consistent family with "héberger", "hébergement fiscal" and "collectifs hébergés". Keep it rather than switching to "Fiscal Host" or "structure porteuse".
- **"pourboire"** for platform tips: short and clearly distinct from "contribution". GoFundMe France also says "pourboire facultatif". HelloAsso's "contribution volontaire" would collide with our core term.
- **"actualité"** for Updates, although Ulule and KissKissBankBank say "publications": "Actualités" is already the section name in the catalog, and it leaves "mise à jour" to the verb.
- **`Transaction.kind.APPLICATION_FEE`** stays "Frais d'application". It is the Stripe application fee that moves a platform tip to OFiTech. Keep the literal translation of the English label, as German does, without adding "Stripe": the English doesn't say it.
- **"contributeur"** for people who give money or work, and **"remboursement"** for both refunds and reimbursements: French needs no split here, unlike German.

## References

Use them for terminology and tone, not for proofreading.

- **French collectives on Open Collective** say "hôte fiscal" and "hébergement fiscal": [Open Collective Paris](https://opencollective.com/paris/updates/cloture-de-lhote-fiscal-opencollective-paris) (a former French host), [CaptainFact](https://opencollective.com/captainfact_io/updates/captainfact-change-dhote-fiscal).
- **HelloAsso** ([info.helloasso.com](https://info.helloasso.com/projets/cagnotte-solidaire)), the French payment platform for associations: "vous", "cagnotte". Its "contribution volontaire" is the term we did not take for tips.
- **Ulule and KissKissBankBank** ([ulule.com](https://www.ulule.com/), [kisskissbankbank.com](https://www.kisskissbankbank.com/)), French crowdfunding: "Contribuer", "contributeurs", "contreparties", "objectif", "reçu fiscal", "vous".
- **Qonto, Spendesk** ([Qonto](https://qonto.com/fr/expense-management/gestion-notes-de-frais), [Spendesk](https://www.spendesk.com/fr/blog/note-de-frais/)), French expense tools: "note de frais", "justificatif", "remboursement de frais".
- **Don't copy:** Ulule's inclusive forms ("Contributeur·rices") and its "Publications" for updates.

## Review checklist for terminology changes

1. **Check where short strings are used.** For every changed string of three words or fewer, `rg` its id in `components/`, `lib/` and `pages/`. Bare participles need the gender of their noun, and "Apply", "Update", "Applications", "Funds", "Paid" and "Pending" each have several meanings.
2. **Read the French without the English.** Anything that sounds translated is a calque: check the [Calques](#calques) table.
3. **Check agreements after a term swap.** See [Grammar pitfalls](#grammar-pitfalls).
4. **Grep the catalog for the old term and the variants the glossary rules out** ("palier", "méthode de paiement", "paiement sortant", "processeur de paiement", "carte de crédit", "individu", "balance", "registre", "souscription", "avec succès", "Êtes-vous sûr", "email", mid-sentence "Collectif" and "Hôte"), plus straight double quotes, "...", "ex:" and "·". After any regex-based fix, check that quotes are still balanced and that no placeholder was touched.
5. **Compare the sentence with the English, not just the term.** "Présentation récurrente confirmée" for "Recurring contribution confirmed" survives every term grep.

## Validation before submitting

1. Every message parses with the FormatJS ICU parser (`@formatjs/icu-messageformat-parser`).
2. Argument names, tag names and plural/select keys match `lang/en.json` exactly.
3. Message keys are unchanged, and the key set matches `lang/en.json`.
4. `npx prettier --write lang/fr.json` leaves no diff.
5. `npx tsx scripts/i18n/show-untranslated.ts fr` prints only real translation work (intentional English is in `IGNORED.fr`).
