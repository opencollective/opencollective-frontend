import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  ['uYdPRG', '{expenseType} de {payeeName} para {accountName}'],
  ['UZEPLR', 'Ocorreu um erro desconhecido'],
  [
    'uzfoYE',
    'Observe que a moeda do seu método de pagamento é {currency}. O valor real que você receberá dependerá das taxas de câmbio e das taxas cobradas por processadores de pagamento e bancos.',
  ],
  ['v+IOuX', 'Ativou "Gestão de dinheiro" em <Account></Account>'],
  ['V35NqH', '{includedCount} despesas pagas'],
  [
    'vBQwI8',
    'Você pode fazer downgrade para nosso plano gratuito "Discover 1" a qualquer momento usando "Modificar assinatura". Se precisar cancelar a renovação da sua assinatura, por favor <SupportLink>entre em contato com o suporte</SupportLink>.',
  ],
  ['Vendor.ArchiveVendor', 'Arquivar fornecedor'],
  ['Vendor.UnarchiveVendor', 'Desarquivar fornecedor'],
  [
    'VendorsAndOrganizations.Description',
    'Gerencie todas as organizações externas com as quais você trabalha como fornecedores e visualize rapidamente toda a atividade entre seus Coletivos hospedados e outras Organizações da plataforma.',
  ],
  ['Verified', 'Verificado'],
  ['VErmYl', 'Duplicar concessão'],
  ['Vf1x2A', 'Entrou em'],
  ['VICsET', 'Modificar assinatura'],
  ['ViewAllContributions', 'Ver todas as contribuições'],
  ['ViewAllExpenses', 'Ver todas as despesas'],
  ['viewProfile', 'Ver perfil'],
  ['VirtualCards.Status', 'Situação'],
  ['VlBhuE', 'Conta não verificada'],
  ['vNN8Hw', '{amount} / Coletivo depois disso'],
  ['vpLBRJ', 'Todas as solicitações de pagamento enviadas'],
  ['VVgt/a', 'Atualizar #{id}'],
  ['vxQI0/', 'Deduzido da plataforma'],
  ['vxyyjF', 'Utilização atual do plano'],
  ['VzPJtr', 'Buscar fusos horários...'],
  ['w0rsxB', 'Apenas em relação a {orgName}'],
  ['W3mNpa', 'Deduzido do saldo do Host'],
  ['w5tdiG', 'Solicitação de concessão não é suportada para esta conta.'],
  ['Wb0E1r', 'Falha na validação do formulário'],
  [
    'wdsjMO',
    'Buscar contas, despesas, transações, atualizações, comentários e mais',
  ],
  ['wdu2yl', 'Reembolsos'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
