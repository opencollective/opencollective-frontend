/* eslint-disable camelcase */

/**
 * Static data the for the expense form
 */
export default function (slug = '') {
  let categories = [];
  let base_slug = slug;
  if (slug.match(/^wwcode/)) {
    base_slug = 'wwcode';
  }

  switch (base_slug) {
    // Women Who Code
    case 'agora':
      categories = [
        'WGT Assemblee',
        'WGT Comm',
        'WGT Mouvement / Beweging',
        'WGT IT',
        'WGT Finance',
        'WGT RelEx',
        'WGT Legal Team',
        'Team Parlement',
        'Secretariaat / Forum',
      ];
      break;
    case 'wwcode':
      categories = [
        'Conference',
        'Donation',
        'Fees',
        'Fireside Chat',
        'Global Development',
        'Hack Night',
        'Hackathon',
        'Leadership Development',
        'Leadership Supplies',
        'Lightning Talks',
        'Scholarship',
        'Speaker Series',
        'Sponsorship',
        'Tech Panel',
        'Transaction Fees',
        'Study Group',
        'Workshop',
        'Other WWCode Event',
        'Other',
      ];
      break;
    case 'laprimaire': // laprimaire
    case 'nuitdebout': // nuitdebout
    case 'lesbarbares': // lesbarbares
      categories = [
        'Admin',
        'Autre',
        'Communication',
        'Déplacement',
        'Marketing',
        'NDD',
        'Outils',
        'PI',
        'Papeterie',
        'Représentation',
        'Serveur',
        'Transport',
      ];
      break;
    case 'partidodigital':
    case 'technovationmx':
      categories = [
        'Comunicación',
        'Diseño',
        'Aporte',
        'Sistemas',
        'Fondos',
        'Alimentos y Bebidas',
        'Marketing',
        'Legales',
        'Suministros & materiales',
        'Viajes',
        'Equipo',
        'Oficina',
        'Otros',
        'Servicios Digitales',
      ];
      break;
    case 'analizebasilicata':
      categories = [
        'Comunicazioni',
        'Disign',
        'Donazione',
        'Sviluppo software',
        'Accantonamento',
        'Cibo & bevande',
        'Marketing',
        'Legale',
        'Forniture & materiali',
        'Viaggio',
        'Squadra',
        'Ufficio',
        'Altro',
        'Servizi web',
      ];
      break;
    case 'rappdutchess':
    case 'adoptiveparentsupportgroupnyc':
    case 'nufaces':
    case 'sharefamilysupports':
    case 'ontariofosteradoptive':
    case 'grahamsforeverfamilies':
    case 'fosterparentsstlawrencecounty':
    case 'fosterparentsnassaucounty':
    case 'westernnyfosteradoptive':
    case 'suffolkfosterparents':
    case 'liftadoptionsupportgroup':
    case 'circlesoflove':
    case 'capitalregionfosteradoptive':
    case 'tompkinscountyfosterparents':
    case 'rapporangecounty':
    case 'fosteradoptiverocklandcounty':
    case 'brighterstars':
    case 'adoptivefamliescapitalregion':
    case 'affcny':
      categories = ['Training', 'Outreach', 'Supplies', 'Other'];
      break;

    default:
      categories = [
        'Communications',
        'Design',
        'Donation',
        'Engineering',
        'Fund',
        'Food & Beverage',
        'Marketing',
        'Legal',
        'Supplies & materials',
        'Travel',
        'Team',
        'Office',
        'Other',
        'Web services',
      ];
  }
  return categories.sort();
}
