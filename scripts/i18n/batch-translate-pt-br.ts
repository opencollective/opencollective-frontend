import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'step.1.gocardless.redirect',
    'Você será redirecionado para o GoCardless, nosso parceiro de open banking.',
  ],
  ['step.2.bank.signin', 'Entre na sua conta bancária usando suas credenciais habituais.'],
  [
    'step.3.finalize.connection',
    'Você será redirecionado de volta para {WebsiteName} para finalizar a conexão.',
  ],
  ['StripeConnection', 'Conexão com Stripe'],
  ['StripeConnectionFailed', 'Falha na conexão com Stripe'],
  [
    'StripeConnectionFailedDetails',
    'Ocorreu um erro ao conectar sua conta Stripe. Por favor, tente novamente.',
  ],
  ['su6SvX', 'Revisar solicitações de concessão recebidas'],
  [
    'SubmitExpense.payee.createLegalEntity',
    'Gostaria de receber pagamento por meio de uma entidade jurídica',
  ],
  ['SubscriptionPlan', 'Plano de assinatura'],
  ['SWkpeH', 'Comece a usar, descubra a plataforma e processe despesas manualmente.'],
  ['SZ0HfS', '{count} despesas pagas mensalmente'],
  ['T26lW2', 'Acesso negado'],
  ['Tags.Placeholder', 'Adicione tags para melhorar a descoberta'],
  ['Tags.Untagged', 'Sem tags'],
  ['tApWSV', 'Se você está criando um perfil para sua Organização, <a>clique aqui</a>.'],
  ['tax.gst.description', 'Este tipo de nível está sujeito ao GST na Nova Zelândia.'],
  ['tax.vat.description', 'Este tipo de nível está sujeito ao IVA na Europa.'],
  ['TaxForm.USTitle', 'Formulário fiscal dos EUA'],
  ['TBxuUA', 'Principais Coletivos por valor gasto'],
  ['tcfKDv', 'Reembolsar, cancelar e remover contribuidor'],
  ['tdc8bZ', 'Nome legal da organização'],
  [
    'tDuKL5',
    'Eles representam milhares de Coletivos e orientam a direção estratégica da nossa plataforma.',
  ],
  ['TE4fIS', 'Cidade'],
  ['Team.Description', 'Gerencie membros da equipe, seus papéis e convide novos membros.'],
  ['Team.InheritedMember', 'Herdado'],
  [
    'Team.InheritedMember.Tooltip',
    'Este membro é herdado de {parentCollectiveName} e não pode ser removido.',
  ],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
