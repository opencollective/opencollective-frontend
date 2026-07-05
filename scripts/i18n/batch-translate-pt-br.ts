import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'SetupGuide.2FARequirements.Description',
    'Para proteger plenamente sua Organização, é importante que todos os seus administradores ativem a autenticação de dois fatores (2FA) em suas contas. Recomendamos que você ative a configuração que exige que todos os administradores também configurem a 2FA.',
  ],
  ['SetupGuide.2FARequirements.Documentation', 'Segurança do Administrador Fiscal'],
  ['SetupGuide.ApproveExpense', 'Aprove sua primeira despesa'],
  ['SetupGuide.ApproveExpense.Action', 'Aprovar despesa'],
  [
    'SetupGuide.ApproveExpense.Description',
    'Despesas são solicitações de pagamento enviadas por contribuidores. Aprovar despesas é uma etapa fundamental na gestão das finanças da sua Organização.',
  ],
  ['SetupGuide.ApproveExpense.Documentation', 'Recebendo despesas enviadas'],
  ['SetupGuide.ChartOfAccounts', 'Configure seu plano de contas'],
  ['SetupGuide.ChartOfAccounts.Action', 'Adicionar plano de contas'],
  [
    'SetupGuide.ChartOfAccounts.Description',
    'Um plano de contas permite categorizar despesas e fundos adicionados manualmente de acordo com suas exigências contábeis. Configure seu plano de contas, categorize suas despesas e fundos adicionados e suas exportações de transações incluirão essas informações. Isso economizará tempo e dinheiro ao fazer sua contabilidade.',
  ],
  ['SetupGuide.ChartOfAccountsForCollectives', 'Estender plano de contas para fundos gerenciados'],
  ['SetupGuide.ChartOfAccountsForCollectives.Action', 'Estender plano de contas'],
  [
    'SetupGuide.ChartOfAccountsForCollectives.Description',
    'Adapte seu plano de contas para incluir categorias contábeis específicas para Coletivos hospedados e fundos gerenciados. Isso garante que todas as despesas e fundos adicionados sejam contabilizados de forma clara, separados das finanças da sua própria Organização.',
  ],
  [
    'SetupGuide.CollectiveExpensesPolicy.Description',
    'Forneça informações e orientações aos remetentes de despesas sobre os tipos de despesas que você está disposto a pagar e quais informações você precisa para facilitar o processo.',
  ],
  ['SetupGuide.CollectiveExpensesPolicy.Documentation', 'Gastando dinheiro'],
  ['SetupGuide.ContributionPolicy', 'Defina sua política de contribuição'],
  ['SetupGuide.ContributionPolicy.Action', 'Configurar política de contribuição'],
  [
    'SetupGuide.ContributionPolicy.Description',
    'Descreva sua política de contribuição para alinhar expectativas e construir confiança com os contribuidores.',
  ],
  ['SetupGuide.CreateProject', 'Crie seu primeiro projeto'],
  ['SetupGuide.CreateProject.Action', 'Criar projeto'],
  [
    'SetupGuide.CreateProject.Description',
    'Projetos ajudam você a organizar seu trabalho e destacar iniciativas específicas dentro do seu Coletivo. Crie um projeto para destacar seus esforços e engajar sua comunidade.',
  ],
  ['SetupGuide.CreateProject.Documentation', 'Criando e gerenciando projetos'],
  ['SetupGuide.CustomizeProfileSections', 'Personalizar seções do perfil'],
  ['SetupGuide.CustomizeProfileSections.Action', 'Configurar seções do perfil'],
  [
    'SetupGuide.CustomizeProfileSections.Description',
    'Destaque informações importantes no seu perfil público personalizando as seções exibidas.',
  ],
  ['SetupGuide.DisableEnableHosting', 'Desativar hospedagem fiscal'],
  ['SetupGuide.DisableMoneyManagement', 'Desativar gestão de dinheiro'],
  ['SetupGuide.DisplaySetupGuide', 'Exibir guia de configuração'],
  ['SetupGuide.DisplayWelcomeGuide', 'Exibir guia de boas-vindas'],
  ['SetupGuide.EnableHosting', 'Ativar hospedagem fiscal'],
  [
    'SetupGuide.EnableHosting.Description',
    'A hospedagem fiscal permite que você gerencie o dinheiro de outros Coletivos e grupos sob seu guarda-chuva fiscal e jurídico, além das finanças da sua própria Organização.',
  ],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
