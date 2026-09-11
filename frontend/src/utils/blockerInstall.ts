import { detectTV } from '../tv/navigation.ts';

const instructions = 'https://github.com/gorhill/uBlock#installation';
export function getBlockerInstall(userAgent: string) {
  if (detectTV(userAgent)) return {
    url: instructions, label: 'Consultar compatibilidade',
    description: 'Muitos navegadores de TV não aceitam extensões. Consulte as opções compatíveis com o aparelho.',
  };
  if (/Firefox\//i.test(userAgent) && !/FxiOS\//i.test(userAgent)) return {
    url: 'https://addons.mozilla.org/firefox/addon/ublock-origin/', label: 'Instalar uBlock Origin no Firefox',
    description: 'Disponível para Firefox no computador e no Android.',
  };
  if (/Android|iPhone|iPad|iPod|FxiOS|CriOS|EdgiOS/i.test(userAgent)) return {
    url: 'https://github.com/uBlockOrigin/uBOL-home', label: 'Ver opções para este dispositivo',
    description: 'O suporte a extensões varia no celular e no tablet. Confira os navegadores e versões aceitos pelo projeto.',
  };
  if (/Edg\//i.test(userAgent)) return {
    url: 'https://microsoftedge.microsoft.com/addons/detail/ublock-origin-lite/cimighlppcgcoapaliogpjjdehbnofhn', label: 'Instalar uBlock Origin Lite no Edge',
    description: 'Versão Lite compatível com o modelo atual de extensões do Edge.',
  };
  if (/OPR\//i.test(userAgent)) return {
    url: instructions, label: 'Ver opções para Opera',
    description: 'Confira a instalação compatível com a sua versão do Opera.',
  };
  if (/Chrome\//i.test(userAgent)) return {
    url: 'https://chromewebstore.google.com/detail/ublock-origin-lite/ddkjiahejlhfcafbddmgiahcphecmpfh', label: 'Instalar uBlock Origin Lite',
    description: 'Para Chrome e navegadores compatíveis com a Chrome Web Store. A versão original foi substituída aqui pela Lite.',
  };
  if (/Version\/.*Safari\//i.test(userAgent)) return {
    url: 'https://apps.apple.com/app/ublock-origin-lite/id6745342698', label: 'Ver uBlock Origin Lite para Safari',
    description: 'Confira os requisitos do sistema na App Store antes de instalar.',
  };
  return { url: instructions, label: 'Ver instalação oficial', description: 'Escolha a opção compatível com o seu navegador nas instruções do projeto.' };
}
