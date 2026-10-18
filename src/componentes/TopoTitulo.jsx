import { Cloud, CloudOff, RefreshCw, Settings, TriangleAlert } from 'lucide-preact';

// RF-33: indicador discreto do estado da sincronização; leva aos Ajustes.
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
      <a href="#/ajustes" class={`indicador indicador-${status}`} aria-label={`Ajustes. ${texto}`}>
        <Icone size={20} aria-hidden="true" />
        {status !== 'local' && <span class="indicador-texto">{texto}</span>}
      </a>
    </div>
  );
}
