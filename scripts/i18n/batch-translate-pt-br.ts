import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  ['tt3cH9', 'Contribuição reembolsada'],
  ['TVWH39', 'Instruções do host para enviar um reembolso'],
  [
    'TvyzUg',
    'Detalhes de pagamento que podem ser usados para {isPrivate,select,false{contribuir, adquirir ingressos ou} other {}} pagar suas faturas da plataforma.',
  ],
  ['TWl0xA', 'Coletivos inativos'],
  [
    'txRdqy',
    'Opcional. Fornecer esses detalhes permite a validação e o uso da variável de modelo <AccountVariable></AccountVariable> em suas instruções — um texto pré-formatado com todos os dados bancários necessários.',
  ],
  ['tZEZGT', '{n, plural, one {1 contribuição} other {{n} contribuições}}'],
  ['U62c6d', 'Última interação'],
  ['u8j6vX', 'Ir para'],
  [
    'uagR7O',
    '{entityType, select, expense{A despesa} contribution{A contribuição} other{A entidade}} NÃO será excluída nem modificada.',
  ],
  ['UDjr0F', 'Nos detalhes da despesa:'],
  ['ue3ZR1', 'Deduzir valor da taxa'],
  ['UfZM5J', 'Alocação de reembolso'],
  ['UHj+h/', 'Pesquisar em {entity}'],
  ['ULhK9y', 'Tem certeza de que deseja revogar esta verificação KYC?'],
  ['UnlinkTransactionImportRowSuccess', 'Linha de importação de transação desvinculada com sucesso'],
  ['Unschedule', 'Cancelar agendamento'],
  ['unSvmK', 'Estorno de imposto'],
  ['UNylJ0', 'Alterar o nível e o valor da contribuição recorrente.'],
  [
    'UpgradePlanCTA.AGREEMENTS.compliance',
    'Acompanhe obrigações legais e contratuais para o processamento adequado de despesas.',
  ],
  [
    'UpgradePlanCTA.AGREEMENTS.documentation',
    'Armazene todos os documentos de acordo em um local centralizado.',
  ],
  [
    'UpgradePlanCTA.AGREEMENTS.expiration',
    'Defina datas de expiração para acompanhar as renovações de acordos.',
  ],
  [
    'UpgradePlanCTA.AGREEMENTS.review',
    'Acesse acordos relevantes ao revisar despesas.',
  ],
  ['UpgradePlanCTA.AGREEMENTS.title', 'Atualize seu plano para enviar acordos'],
  [
    'UpgradePlanCTA.AUTOMATED_PAYMENTS.ledger',
    'Valores de transferência e taxas são registrados automaticamente.',
  ],
  ['UpgradePlanCTA.AUTOMATED_PAYMENTS.payOnPlatform', 'Pague com um clique.'],
  [
    'UpgradePlanCTA.AUTOMATED_PAYMENTS.reduceErrors',
    'Reduza erros de entrada manual de dados.',
  ],
  [
    'UpgradePlanCTA.AUTOMATED_PAYMENTS.saveTime',
    'Processe mais despesas em menos tempo.',
  ],
  [
    'UpgradePlanCTA.AUTOMATED_PAYMENTS.title',
    'Atualize seu plano para pagamentos automatizados.',
  ],
  [
    'UpgradePlanCTA.CHARGE_HOSTING_FEES.title',
    'Atualize seu plano para habilitar a cobrança de taxas de hospedagem.',
  ],
  [
    'UpgradePlanCTA.CHART_OF_ACCOUNTS.accountingCategories',
    'Configure suas categorias contábeis de acordo com suas necessidades contábeis.',
  ],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
