import { Cloud, CloudOff, RefreshCw, Settings, TriangleAlert } from 'lucide-preact';

// RF-33: indicador discreto do estado da sincronização, só o ícone; o texto
// aparece na tela de Ajustes, para onde ele leva.
export const STATUS = {
  local: { Icone: Settings, texto: 'Só neste aparelho' },
  sincronizado: { Icone: Cloud, texto: 'Sincronizado' },
  sincronizando: { Icone: RefreshCw, texto: 'Sincronizando' },
  offline: { Icone: CloudOff, texto: 'Offline' },
  erro: { Icone: TriangleAlert, texto: 'Erro ao sincronizar' },
};

export function TopoTitulo({ titulo, status }) {
  const { Icone, texto } = STATUS[status] ?? STATUS.local;
  return (
    <div class="topo-linha">
      <h1 class="topo-titulo">{titulo}</h1>
      <a href="#/ajustes" class={`indicador indicador-${status}`} aria-label={`Ajustes. ${texto}`} title={texto}>
        <Icone size={22} aria-hidden="true" />
      </a>
    </div>
  );
}
