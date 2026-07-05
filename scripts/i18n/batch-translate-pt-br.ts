import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  [
    'signup.inviteAdmins.description',
    'Ter sua equipe ajuda a dividir o trabalho e adiciona responsabilidade para gerenciar finanças de forma transparente.',
  ],
  ['signup.inviteAdmins.error', 'Ocorreu um erro ao convidar sua equipe'],
  ['signup.inviteAdmins.success', 'Convites enviados!'],
  ['signup.inviteAdmins.teamMembers', 'Membros da equipe (até 5)'],
  ['signup.inviteAdmins.title', 'Convide sua equipe'],
  [
    'signup.otp.description',
    'Precisamos verificar seu endereço de e-mail para proteger sua conta e garantir que você receba atualizações importantes.',
  ],
  ['signup.otp.resendSuccess', 'Um novo código OTP foi enviado para seu e-mail.'],
  ['signup.otp.title', 'Vamos verificar seu e-mail'],
  ['signup.requiresVerificationError', 'E-mail não verificado, por favor finalize seu cadastro.'],
  ['skcLyR', 'Comece a digitar para criar um beneficiário'],
  ['SKFWE+', 'Cancelar assinatura'],
  ['SkipToDashboard', 'Ir para o painel'],
  [
    'sKMOr5',
    'Adicionar uma contribuição para a plataforma nos ajuda a manter a plataforma e introduzir novos recursos. <Link>Por quê?</Link>',
  ],
  ['slHtsr', 'Transações importadas de <Link>contas bancárias conectadas</Link>.'],
  ['smQ1pN', 'Escolher nível'],
  [
    'smuSiU',
    'Converta {name} em uma Organização para habilitar gestão de dinheiro e capacidades de hospedagem fiscal.',
  ],
  ['SnHGJH', 'Encontre {entities} no seu espaço de trabalho.'],
  ['solutions.features.crowdfunding', 'Financiamento coletivo'],
  [
    'solutions.features.crowdfunding.description',
    'Lance campanhas para arrecadar apoio para projetos únicos e continuamente financiados.',
  ],
  ['solutions.features.expenseProcessing', 'Processamento de despesas'],
  [
    'solutions.features.expenseProcessing.description',
    'Processe solicitações de pagamento, pague faturas e reembolsos usando integrações automatizadas.',
  ],
  [
    'solutions.features.hosting.description',
    'Ofereça um guarda-chuva fiscal gerenciando com segurança o dinheiro de grupos não constituídos.',
  ],
  [
    'solutions.features.item.accept-applications-from-groups-looking-for-a-host.description',
    'Aceite candidaturas de grupos interessados em ser hospedados por você. Uma conversa dentro de cada candidatura documenta o processo de revisão e aceitação até que sejam aceitos (e se tornem Coletivos hospedados) ou rejeitados.',
  ],
  [
    'solutions.features.item.accept-applications-from-groups-looking-for-a-host.title',
    'Aceitar candidaturas de grupos em busca de um Administrador Fiscal',
  ],
  [
    'solutions.features.item.accept-contributions.description',
    'Configure campanhas de financiamento coletivo para engajar sua comunidade. Contribuições concluídas são automaticamente registradas no livro razão e adicionadas aos saldos da sua conta.',
  ],
  ['solutions.features.item.accept-contributions.title', 'Aceitar contribuições'],
  [
    'solutions.features.item.accept-requests-from-people-asking-to-get-paid.description',
    'Um formulário de solicitação de pagamento passo a passo guiará os usuários no envio de solicitações de pagamento corretas e completas. Inclua suas próprias instruções sobre como enviar corretamente uma solicitação de pagamento para receber o pagamento.',
  ],
  [
    'solutions.features.item.accept-requests-from-people-asking-to-get-paid.title',
    'Aceitar solicitações de pessoas que querem receber pagamento',
  ],
  [
    'solutions.features.item.add-money-to-your-accounts.description',
    'Quando o dinheiro aparecer em sua conta bancária ou um cheque for recebido e processado, adicione-o a uma conta e ele estará imediatamente disponível para desembolso.',
  ],
  ['solutions.features.item.add-money-to-your-accounts.title', 'Adicionar dinheiro às suas contas'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
