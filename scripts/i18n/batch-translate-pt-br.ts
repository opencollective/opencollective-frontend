import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const setTranslation = path.join(__dirname, 'set-translation.ts');

const translations: Array<[string, string]> = [
  ['SetupGuide.EnableHosting.Documentation', 'Configurando um Administrador Fiscal'],
  ['SetupGuide.EnableMoneyManagement', 'Ativar gestão de dinheiro'],
  ['SetupGuide.Expenses', 'Configurar políticas de despesas'],
  ['SetupGuide.ExpensesPolicy', 'Defina suas políticas de despesas'],
  [
    'SetupGuide.ExpensesPolicy.Description',
    'Descreva seu processo e requisitos para processar solicitações de pagamento. Informe aos remetentes de despesas o que você precisa deles para processar eficientemente suas solicitações de pagamento e garantir pagamentos mais rápidos.',
  ],
  [
    'SetupGuide.FindAndApplyHosting.Description',
    'Se você ainda não tem um administrador fiscal, pode encontrar um que atenda às suas necessidades na plataforma e se candidatar diretamente pelo seu perfil.',
  ],
  ['SetupGuide.FindAndApplyHosting.Documentation', 'Escolhendo um Administrador Fiscal'],
  ['SetupGuide.HideSetupGuide', 'Ocultar guia de configuração'],
  ['SetupGuide.HostApplications', 'Ativar candidaturas de Coletivos'],
  ['SetupGuide.HostApplications.Action', 'Ativar candidaturas'],
  [
    'SetupGuide.HostApplications.Description',
    'Abra suas portas para Coletivos. Grupos interessados poderão enviar candidaturas pela página do seu perfil público.',
  ],
  ['SetupGuide.HostingFees', 'Definir taxas de hospedagem de Coletivos'],
  ['SetupGuide.HostingFees.Action', 'Configurar taxas de hospedagem'],
  [
    'SetupGuide.HostingFees.Description',
    'A plataforma permite cobrar automaticamente taxas de hospedagem dos seus Coletivos hospedados. As taxas são aplicadas a contribuições e fundos adicionados. Defina suas taxas de hospedagem padrão, que serão aplicadas a todos os Coletivos (permitindo também definir taxas personalizadas para Coletivos específicos).',
  ],
  ['SetupGuide.HostingFees.Documentation', 'Configurando suas taxas de Administrador Fiscal'],
  ['SetupGuide.InviteAdmins', 'Convidar administradores adicionais'],
  [
    'SetupGuide.InviteAdmins.CollectiveDescription',
    'Um Coletivo funciona melhor com vários administradores para ajudar a gerenciar suas atividades. Convide pelo menos mais um administrador para ajudar a gerenciar seu Coletivo.',
  ],
  [
    'SetupGuide.InviteAdmins.Description',
    'Exigimos que haja pelo menos dois administradores nas Organizações. Isso garante que nenhuma pessoa tenha acesso exclusivo à conta. Também reduz o potencial de uso fraudulento da conta.',
  ],
  ['SetupGuide.InviteAdmins.Documentation', 'Adicionar membros da equipe'],
  ['SetupGuide.MoneyManagement', 'Ativar gestão de dinheiro'],
  [
    'SetupGuide.MoneyManagement.Description',
    'A gestão de dinheiro permite adicionar fundos à sua conta e pagar despesas. Esta é uma etapa crucial para poder usar plenamente a plataforma em suas operações financeiras.',
  ],
  ['SetupGuide.PublicProfile', 'Crie sua página de perfil público'],
  ['SetupGuide.PublicProfile.Action', 'Editar seu perfil'],
  [
    'SetupGuide.PublicProfile.Description',
    'Seu perfil público informa ao mundo que você está ativo na plataforma. Ele conta sua história com uma descrição escrita da sua {type, select, ORGANIZATION {Organização} COLLECTIVE {Coletivo} other {Conta}}, sua missão e quais são seus objetivos ao usar a plataforma.',
  ],
  ['SetupGuide.PublicProfile.Documentation', 'Editando sua página de perfil'],
  ['SetupGuide.PublishUpdate', 'Publique sua primeira atualização'],
  ['SetupGuide.PublishUpdate.Action', 'Publicar atualização'],
  [
    'SetupGuide.PublishUpdate.Description',
    'Mantenha sua comunidade informada publicando atualizações sobre as atividades, marcos e novidades da sua organização.',
  ],
  ['SetupGuide.PublishUpdate.Documentation', 'Atualizações e contato'],
  ['SetupGuide.RequiresFiscalHosting', 'Requer hospedagem fiscal'],
];

for (const [id, text] of translations) {
  execSync(`npx tsx "${setTranslation}" pt-BR "${id}" ${JSON.stringify(text)}`, {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '../..'),
  });
}

console.log(`Applied ${translations.length} translations.`);
