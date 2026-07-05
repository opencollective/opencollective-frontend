import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'tGx5HV',
    'Isso criará uma verificação KYC manual pendente deste titular de conta.',
  ],
  ['tier.Basic.title', 'Básico'],
  ['tier.Discover.title', 'Descobrir'],
  ['tjroCC', 'O nome completo da conta principal, se existir.'],
  [
    'TjxXB1',
    'Fundos com pelo menos uma transação no livro razão registrada neste mês.',
  ],
  [
    'TK5atK',
    'Aceito que cobranças adicionais podem ser aplicadas se eu exceder os limites do plano.',
  ],
  ['tkkyjR', 'E-mail (opcional)'],
  ['tLNi3x', 'Enviar mensagem personalizada ao contribuidor'],
  [
    'tMbYww',
    '<Individual></Individual> aprovou a candidatura de <Account></Account> para ser hospedado',
  ],
  ['tnRDuU', 'Revogar'],
  [
    'To33FZ',
    'Contribuições feitas à sua Organização e aos Coletivos que você hospeda.',
  ],
  ['TotalCharge', 'Cobrança total'],
  ['TotalContributed', 'Total contribuído'],
  ['TotalContributions', 'Total de contribuições'],
  ['TotalExpended', 'Total gasto'],
  ['TotalExpenses', 'Total de despesas'],
  ['Transaction.Unlink', 'Desvincular'],
  ['transactions.editedReversals', 'Estornos editados'],
  ['transactions.import.status', 'Situação'],
  ['transactions.import.status.expired', 'Expirado'],
  [
    'transactions.import.status.expired.tooltip',
    'A autorização de conexão bancária expirou. Reconecte sua conta nas configurações para retomar a sincronização de transações. <Link>Saiba mais</Link>.',
  ],
  ['TrustLevel.Label', 'Nível de confiança'],
  ['TrustLevel.OFiCoMember', 'Membro OFiCo'],
  ['TrustLevel.Verified', 'Verificado'],
  ['TryAgain', 'Tentar novamente'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
