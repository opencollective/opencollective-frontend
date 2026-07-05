import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'solutions.features.item.all-financial-activities-are-recorded.description',
    'No coração da plataforma está um livro razão de transações. Todas as atividades financeiras na plataforma geram transações no livro razão.',
  ],
  [
    'solutions.features.item.all-financial-activities-are-recorded.title',
    'Todas as atividades financeiras são registradas',
  ],
  [
    'solutions.features.item.approve-payment-requests.description',
    'Revise as solicitações de pagamento que foram enviadas. Aprove as solicitações legítimas que deseja pagar e rejeite ou exclua as outras.',
  ],
  [
    'solutions.features.item.automated-security-checks-protect-against-fraud.description',
    'Verificações de segurança em tempo real estão integradas à ferramenta de pagamento e alertarão você se algo for suspeito. Verde significa seguro para pagar, amarelo é um aviso e vermelho requer atenção.',
  ],
  [
    'solutions.features.item.automated-security-checks-protect-against-fraud.title',
    'Verificações de segurança automatizadas protegem contra fraudes',
  ],
  [
    'solutions.features.item.categorize-financial-activities-for-accounting.description',
    'Configure seu plano de contas e categorize seus desembolsos e fundos adicionados. Inclua isso em suas exportações e reduza o tempo, o esforço e os custos contábeis.',
  ],
  [
    'solutions.features.item.categorize-financial-activities-for-accounting.title',
    'Categorizar atividades financeiras para contabilidade',
  ],
  [
    'solutions.features.item.charge-hosting-fees.description',
    'Cobre automaticamente taxas de hospedagem dos seus Coletivos hospedados. As taxas são aplicadas e rastreadas automaticamente no livro razão e visíveis tanto para você quanto para seus Coletivos hospedados.',
  ],
  ['solutions.features.item.charge-hosting-fees.title', 'Cobrar taxas de hospedagem'],
  [
    'solutions.features.item.check-your-balance.description',
    'Dinheiro adicionado a uma conta aumenta seu saldo e dinheiro gasto (ou transferido) diminuirá seu saldo. Você sempre sabe onde está, pois o saldo está sempre atualizado e verificável.',
  ],
  ['solutions.features.item.check-your-balance.title', 'Verificar seu saldo'],
  [
    'solutions.features.item.collect-tax-forms.description',
    'Colete automaticamente formulários fiscais dos EUA de pessoas que recebem pagamento pela plataforma. No final do ano fiscal, baixe todos os formulários fiscais relevantes, prontos para enviar às autoridades.',
  ],
  ['solutions.features.item.collect-tax-forms.title', 'Coletar formulários fiscais'],
  [
    'solutions.features.item.collectives-autonomously-manage-their-finances.description',
    'Os Coletivos sempre têm acesso a saldos atualizados em suas contas e podem operar de forma autônoma.',
  ],
  [
    'solutions.features.item.collectives-autonomously-manage-their-finances.title',
    'Coletivos gerenciam suas finanças de forma autônoma',
  ],
  [
    'solutions.features.item.collectives-decide-which-expenses-to-pay.description',
    'Os Coletivos podem revisar e aprovar suas próprias despesas de forma independente. Despesas aprovadas aguardarão sua revisão e pagamento.',
  ],
  [
    'solutions.features.item.collectives-decide-which-expenses-to-pay.title',
    'Coletivos decidem quais despesas pagar',
  ],
  [
    'solutions.features.item.connect-your-bank-accounts.description',
    'Conecte sua conta na plataforma aos seus serviços bancários preferidos e concilie transações fora da plataforma com atividades financeiras na plataforma.',
  ],
  ['solutions.features.item.connect-your-bank-accounts.title', 'Conectar suas contas bancárias'],
  [
    'solutions.features.item.different-ways-to-contribute.description',
    'Níveis flexíveis permitem criar uma diversidade de campanhas de financiamento coletivo. Projete níveis adequados para você e seu público. Colete gorjetas, contribuições únicas e contribuições recorrentes.',
  ],
  ['solutions.features.item.different-ways-to-contribute.title', 'Diferentes formas de contribuir'],
  [
    'solutions.features.item.document-financial-agreements.description',
    'Faça upload e acompanhe acordos financeiros. Vincule acordos a Coletivos hospedados e referencie-os ao pagar desembolsos.',
  ],
  ['solutions.features.item.document-financial-agreements.title', 'Documentar acordos financeiros'],
  [
    'solutions.features.item.easily-work-your-way-through-all-payment-requests.description',
    'Marque solicitações de pagamento como "incompletas" quando forem devolvidas aos remetentes para correção. Marque-as como "em espera" enquanto as analisa com seu contador ou advogado.',
  ],
  [
    'solutions.features.item.easily-work-your-way-through-all-payment-requests.title',
    'Percorra facilmente todas as solicitações de pagamento',
  ],
  [
    'solutions.features.item.efficiently-process-payment-requests.description',
    'Todas as solicitações de pagamento aprovadas são verificadas contra os saldos do Coletivo. Quando o saldo é suficiente, elas aparecem na sua fila de despesas prontas para pagamento.',
  ],
  [
    'solutions.features.item.efficiently-process-payment-requests.title',
    'Processar solicitações de pagamento com eficiência',
  ],
  [
    'solutions.features.item.everything-you-need-to-know-do-in-one-place.description',
    'Seu painel reúne todas as ferramentas necessárias para gerenciar suas finanças de forma colaborativa e ficar por dentro das atividades financeiras que requerem sua atenção.',
  ],
  [
    'solutions.features.item.everything-you-need-to-know-do-in-one-place.title',
    'Tudo o que você precisa saber e fazer em um só lugar',
  ],
  [
    'solutions.features.item.export-ledger-data-for-your-accountants.description',
    'Forneça aos seus contadores exportações periódicas de transações detalhadas do livro razão.',
  ],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
