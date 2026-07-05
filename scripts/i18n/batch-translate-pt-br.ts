import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  ['SetupGuide.RequiresMoneyManagement', 'Requer gestão de dinheiro'],
  ['SetupGuide.SetupTiers', 'Configurar níveis de contribuição'],
  ['SetupGuide.SetupTiers.Action', 'Configurar níveis'],
  [
    'SetupGuide.SetupTiers.Description',
    'Os níveis de contribuição permitem definir diferentes níveis de apoio para seus contribuidores. Configure níveis para incentivar mais contribuições e construir uma comunidade em torno da sua Organização.',
  ],
  ['SetupGuide.Step.SeeDocumentation', 'Ver'],
  ['SetupGuide.StepsCompleted', '{completed}/{total} concluído'],
  ['SetupGuide.Stripe', 'Configurar Stripe para receber contribuições'],
  ['SetupGuide.Stripe.Action', 'Conectar Stripe'],
  [
    'SetupGuide.Stripe.Description',
    'Usamos o Stripe como processador de pagamentos para receber pagamentos e contribuições. O Stripe oferece diversas opções de pagamento, incluindo cartões de crédito e transferências bancárias. Conecte sua conta ao Stripe para receber pagamentos e contribuições na conta da sua Organização.',
  ],
  ['SetupGuide.Stripe.Documentation', 'Pagamentos com Stripe'],
  ['SetupGuide.Wise', 'Configurar Wise para pagamentos'],
  ['SetupGuide.Wise.Action', 'Conectar Wise'],
  [
    'SetupGuide.Wise.Description',
    'Usamos o Wise para pagamentos de despesas sem complicações. O Wise oferece cobertura global e taxas competitivas de processamento de pagamentos. Conecte sua conta Wise para pagar despesas com um clique.',
  ],
  ['SetupGuide.Wise.Documentation', 'Pagando despesas com Wise'],
  ['sGtR3j', 'Um e-mail de contato para a conta principal (apenas para pessoas físicas).'],
  ['SignUp', 'Cadastrar-se'],
  ['signup.alreadyHaveAccount', 'Já tem uma conta? <SignInLink>Entrar</SignInLink>'],
  ['signup.alreadyLoggedIn', 'Você já está conectado.'],
  ['signup.completeProfile.action', 'Criar perfil'],
  ['signup.completeProfile.description', 'Um perfil completo e bem elaborado aumenta a confiança.'],
  ['signup.completeProfile.error', 'Erro ao completar perfil'],
  ['signup.completeProfile.password.hint', 'Você sempre pode entrar usando apenas seu e-mail.'],
  ['signup.completeProfile.title', 'Vamos completar seu perfil'],
  ['signup.createOrganization.title', 'Criar uma organização'],
  [
    'signup.individual.description',
    'Junte-se ao Open Collective para começar a contribuir, arrecadar fundos ou gerenciar seu grupo em uma plataforma transparente e impulsionada pela comunidade.',
  ],
  [
    'signup.individual.orgFlow.description',
    'Você precisa de uma conta pessoal para criar {type, select, organization {uma Organização} other {um Coletivo}}. {newLine}Entre ou crie uma para continuar.',
  ],
  [
    'signup.individual.resendOTP',
    'Não recebeu um código? Reenviar{secondsLeft, select, 0 {} other { ({secondsLeft}s)}}',
  ],
  ['signup.individual.title', 'Crie sua conta'],
  [
    'signup.individual.tosAgreement',
    'Ao criar uma conta, você concorda com nossos{newLine}<TOSLink>Termos de Serviço</TOSLink> e <PrivacyPolicyLink>Política de Privacidade</PrivacyPolicyLink>.',
  ],
  ['signup.individual.verifyOtp.description', 'Digite o código enviado para <strong>{email}</strong>.'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
