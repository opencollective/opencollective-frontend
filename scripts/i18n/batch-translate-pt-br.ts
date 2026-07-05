import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'solutions.features.participatoryFinances.description',
    'Capacite suas pessoas e equipes a gerenciar suas finanças usando nossas ferramentas financeiras simplificadas e acessíveis.',
  ],
  ['solutions.features.realTimeBalances', 'Saldos em tempo real'],
  [
    'solutions.features.realTimeBalances.description',
    'Acompanhe saldos, receitas e gastos usando saldos atualizados em tempo real.',
  ],
  [
    'solutions.features.section.accounting-accountability.description',
    'Revise e verifique atividades financeiras e forneça aos seus contadores informações confiáveis para seus processos contábeis.',
  ],
  [
    'solutions.features.section.accounting-accountability.title',
    'Contabilidade e prestação de contas',
  ],
  [
    'solutions.features.section.crowdfunding.description',
    'Crie uma variedade de campanhas de financiamento coletivo: caixinha simples com contribuições únicas, metas únicas, metas recorrentes mensais e até assinaturas anuais para gerar renda contínua via financiamento coletivo.',
  ],
  [
    'solutions.features.section.financial-platform.description',
    'Uma caixa de ferramentas integrada para gerenciar suas finanças de forma colaborativa e transparente.',
  ],
  ['solutions.features.section.financial-platform.title', 'Plataforma financeira'],
  [
    'solutions.features.section.hosting.description',
    'Convide outros grupos a operar sob seu guarda-chuva financeiro e jurídico como Coletivos. Com uma pequena equipe usando a plataforma, você pode apoiar eficientemente milhares de grupos e projetos.',
  ],
  [
    'solutions.features.section.money-in.description',
    'Documente e acompanhe todo o dinheiro recebido.',
  ],
  ['solutions.features.section.money-in.title', 'Entrada de dinheiro'],
  [
    'solutions.features.section.money-out.description',
    'Um conjunto completo de ferramentas para enviar, revisar, corrigir, aprovar e pagar desembolsos. Uma pequena equipe de administradores pode processar eficientemente milhares de solicitações de pagamento mensais.',
  ],
  ['solutions.features.section.money-out.title', 'Saída de dinheiro'],
  [
    'solutions.features.transparency.description',
    'Comunique suas finanças, transações e saldos em tempo real à sua comunidade.',
  ],
  ['solutions.hero.joinAsOrg', 'Participar como Organização'],
  ['solutions.hero.seePricing', 'Ver preços'],
  [
    'solutions.hero.subtitle',
    'Fundações, organizações sem fins lucrativos, empresas, setor público e cooperativas',
  ],
  ['solutions.hero.title', 'Finanças colaborativas para Organizações'],
  ['solutions.testimonials.title', 'Depoimentos'],
  ['SpamExpensesCount', '{count} despesas spam'],
  ['SQ9JvS', 'Última interação'],
  ['ssPeBO', 'Cancelar e remover contribuidor'],
  ['St4vQ3', '<Individual></Individual> converteu para Organização'],
  ['startsAt', 'Evento começa em'],
  ['Stats.contributionsReceived', 'Contribuições recebidas'],
  ['Stats.expensesPaid', 'Despesas pagas'],
  ['Stats.moneyManaged', 'Dinheiro gerenciado'],
  ['Stats.title', 'Nosso impacto, em números'],
  ['Stats.transactionsRecorded', 'Transações registradas'],
  ['Status', 'Situação'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
