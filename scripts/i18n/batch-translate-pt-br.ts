import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'UpgradePlanCTA.CHART_OF_ACCOUNTS.categorize',
    'Atribuir despesas e fundos adicionados às categorias contábeis corretas.',
  ],
  [
    'UpgradePlanCTA.CHART_OF_ACCOUNTS.export',
    'Incluir as categorias contábeis selecionadas em suas exportações.',
  ],
  [
    'UpgradePlanCTA.CHART_OF_ACCOUNTS.optimize',
    'Reduzir custos contábeis, carga de trabalho e risco de erros contábeis.',
  ],
  ['UpgradePlanCTA.CHART_OF_ACCOUNTS.title', 'Atualize seu plano para habilitar o plano de contas.'],
  [
    'UpgradePlanCTA.EXPECTED_FUNDS.allocate',
    'Alocar fundos esperados para Coletivos, projetos, eventos ou níveis específicos.',
  ],
  [
    'UpgradePlanCTA.EXPECTED_FUNDS.notify',
    'Notificar automaticamente administradores e financiadores quando os fundos forem recebidos e alocados.',
  ],
  [
    'UpgradePlanCTA.EXPECTED_FUNDS.reconcile',
    'Conciliar chegadas mais rapidamente com detalhes de contribuição pré-preenchidos e lançamentos no livro razão.',
  ],
  [
    'UpgradePlanCTA.EXPECTED_FUNDS.title',
    'Atualize seu plano para gerenciar fundos esperados sem esforço.',
  ],
  [
    'UpgradePlanCTA.EXPECTED_FUNDS.track',
    'Acompanhar transferências bancárias pendentes e promessas de arrecadação antes do dinheiro chegar.',
  ],
  [
    'UpgradePlanCTA.FUNDS_GRANTS_MANAGEMENT.title',
    'Atualize seu plano para gerenciar fundos e concessões.',
  ],
  [
    'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.accounting',
    'Forneça aos seus contadores exportações consolidadas de transações.',
  ],
  [
    'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.importCSV',
    'Importar manualmente transações com arquivos CSV',
  ],
  [
    'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.importing',
    'Importar automaticamente transações de bancos e outros serviços financeiros.',
  ],
  [
    'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.offPlatformTransactions',
    'Represente com precisão suas finanças na plataforma importando atividades financeiras fora da plataforma',
  ],
  [
    'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.reconcilliation',
    'Conciliar e corresponder transações importadas com atividades da plataforma.',
  ],
  [
    'UpgradePlanCTA.OFF_PLATFORM_TRANSACTIONS.title',
    'Atualize seu plano para importar transações fora da plataforma.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.collect',
    'Coletar automaticamente formulários fiscais necessários dos beneficiários.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.compliance',
    'Mantenha conformidade com as leis fiscais dos EUA sem acompanhamento manual.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.configureThreshold',
    'Configurar limites de pagamento para controlar quando formulários são necessários.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.export',
    'Exportar todos os formulários fiscais no final do ano para envio rápido.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.preventPayouts',
    'Impedir pagamentos até que todos os formulários necessários sejam enviados.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.prompt',
    'Solicitar que beneficiários enviem formulários antes de receber pagamentos.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.protect',
    'Proteja sua comunidade evitando armazenamento de dados de risco.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.sensitiveData',
    'Mantenha dados fiscais sensíveis seguros e acessíveis apenas a administradores.',
  ],
  [
    'UpgradePlanCTA.TAX_FORMS.title',
    'Atualize seu plano para coletar formulários fiscais compatíveis com os EUA',
  ],
  ['UpgradePlanCTA.title.DISABLED', 'Atualização necessária'],
  ['UpgradePlanCTA.title.UNSUPPORTED', 'Recurso não suportado para sua conta'],
  ['UpgradePlanCTA.upgradeButton', 'Atualizar seu plano'],
  ['us7tE9', 'Principais Fundos por valor gasto'],
  ['utJA9s', 'Detalhes da conta'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
