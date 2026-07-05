import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'solutions.features.item.export-ledger-data-for-your-accountants.title',
    'Exportar dados do livro razão para seus contadores',
  ],
  [
    'solutions.features.item.give-people-control.description',
    'Atribua administradores para gerenciar contas específicas. Adicione ou transfira dinheiro para as contas e deixe sua equipe gerenciar os gastos por conta própria.',
  ],
  ['solutions.features.item.give-people-control.title', 'Dar controle às pessoas'],
  [
    'solutions.features.item.host-other-groups.description',
    'Coletivos são mini-organizações dentro da sua Organização. Cada Coletivo pode configurar suas próprias contas, campanhas de financiamento coletivo e projetos.',
  ],
  ['solutions.features.item.host-other-groups.title', 'Hospedar outros grupos'],
  [
    'solutions.features.item.invite-people-to-get-paid.description',
    'Envie convites de solicitação de pagamento para pessoas que não estão na plataforma. Elas receberão um convite que as guiará para criar um novo usuário, preencher e enviar a solicitação de pagamento.',
  ],
  ['solutions.features.item.invite-people-to-get-paid.title', 'Convidar pessoas para receber pagamento'],
  [
    'solutions.features.item.legible-financial-summaries.description',
    'Um extrato de transações periódico (mensal, trimestral, anual) fornece uma visão geral da atividade do livro razão. Aprofunde-se em cada número do extrato para revisar e verificar as transações subjacentes do livro razão.',
  ],
  ['solutions.features.item.legible-financial-summaries.title', 'Resumos financeiros legíveis'],
  [
    'solutions.features.item.move-money-between-accounts.description',
    'Transfira dinheiro facilmente entre contas. Iniciando um novo projeto? Transfira um valor alocado para uma conta separada para gerenciar os gastos.',
  ],
  ['solutions.features.item.move-money-between-accounts.title', 'Mover dinheiro entre contas'],
  [
    'solutions.features.item.organize-your-money.description',
    'Organize seu dinheiro e controle seus gastos com contas. Crie contas para reservas, para contribuições de financiamento coletivo e para despesas.',
  ],
  ['solutions.features.item.organize-your-money.title', 'Organize seu dinheiro'],
  [
    'solutions.features.item.pay-approved-payment-requests.description',
    'Uma ferramenta reúne todas as informações necessárias para pagar rapidamente e com eficiência solicitações de pagamento aprovadas e outros desembolsos.',
  ],
  ['solutions.features.item.pay-approved-payment-requests.title', 'Pagar solicitações de pagamento aprovadas'],
  [
    'solutions.features.item.pay-instantly.description',
    'Pague usando integrações com Wise e PayPal ou marque manualmente despesas pagas fora da plataforma (por exemplo, da sua conta bancária) como pagas.',
  ],
  ['solutions.features.item.pay-instantly.title', 'Pagar instantaneamente'],
  [
    'solutions.features.item.quickly-resolve-issues.description',
    'Cada despesa é um fio de conversa com todas as pessoas envolvidas no envio, revisão e pagamento. A correspondência é salva para referência futura.',
  ],
  ['solutions.features.item.quickly-resolve-issues.title', 'Resolver problemas rapidamente'],
  [
    'solutions.features.item.set-commit-to-funding-goals.description',
    'Crie metas únicas para projetos pontuais. Crie metas recorrentes para pedir apoio de longo prazo à sua comunidade.',
  ],
  ['solutions.features.item.set-commit-to-funding-goals.title', 'Definir e se comprometer com metas de financiamento'],
  [
    'solutions.features.item.spend-within-your-balance.description',
    'A proteção automática de saldo garante que você pague apenas despesas que possam ser cobertas pelos saldos atuais da conta.',
  ],
  ['solutions.features.item.spend-within-your-balance.title', 'Gastar dentro do seu saldo'],
  [
    'solutions.features.item.tell-the-world-your-financial-story.description',
    'Ative um perfil público para tornar você e suas finanças visíveis ao mundo e convidar um engajamento mais amplo com campanhas de financiamento coletivo e solicitações de pagamento.',
  ],
  ['solutions.features.item.tell-the-world-your-financial-story.title', 'Conte sua história financeira ao mundo'],
  [
    'solutions.features.item.trace-and-verify-all-financial-activities.description',
    'Todas as atividades financeiras na plataforma (solicitações de pagamento, contribuições, concessões, etc.) podem ser rastreadas até suas transações relacionadas no livro razão e vice-versa.',
  ],
  [
    'solutions.features.item.trace-and-verify-all-financial-activities.title',
    'Rastrear e verificar todas as atividades financeiras',
  ],
  [
    'solutions.features.item.track-promised-funds.description',
    'Você recebeu uma concessão e agora está aguardando pagamentos? Documente e acompanhe a receita esperada até que chegue e seja adicionada às suas contas.',
  ],
  ['solutions.features.item.track-promised-funds.title', 'Acompanhar fundos prometidos'],
  ['solutions.features.participatoryFinances', 'Finanças participativas'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
