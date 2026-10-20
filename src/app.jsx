import { useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { BarraInferior } from './componentes/BarraInferior.jsx';
import { FotosContext } from './componentes/CapaReceita.jsx';
import { sincronizacaoDisponivel } from './dados/repositorio.js';
import { useRepositorio } from './dados/useRepositorio.js';
import { agruparLista, calcularItens } from './dominio/lista.js';
import { validarCarga } from './dominio/validacao.js';
import { useRota } from './rotas.js';
import { Ajustes } from './telas/Ajustes.jsx';
import { Caderno } from './telas/Caderno.jsx';
import { DetalheReceita } from './telas/DetalheReceita.jsx';
import { EditarReceita } from './telas/EditarReceita.jsx';
import { Ingredientes } from './telas/Ingredientes.jsx';
import { Lista } from './telas/Lista.jsx';
import { ModoCozinha } from './telas/ModoCozinha.jsx';
import { Planejador } from './telas/Planejador.jsx';

// Telas de foco, sem a barra inferior.
const TELAS_CHEIAS = new Set(['cozinha', 'editar']);

export function App() {
  const rota = useRota();
  const dados = useRepositorio();
  const [categoriaCaderno, setCategoriaCaderno] = useState(null);
  const [categoriaPlanejador, setCategoriaPlanejador] = useState(null);
  const [buscaCaderno, setBuscaCaderno] = useState('');

  const caderno = dados?.caderno;
  const estado = dados?.estado;

  // Toda tela abre no topo. O Caderno é a exceção: ele mesmo volta para onde
  // estava, para quem sai de uma receita não perder o lugar na galeria.
  useLayoutEffect(() => {
    if (rota.tela !== 'caderno') scrollTo(0, 0);
  }, [rota.tela, rota.id]);

  useEffect(() => {
    if (!caderno) return;
    const erros = validarCarga(caderno);
    if (erros.length) console.warn('Problemas no caderno:\n' + erros.join('\n'));
  }, [caderno]);

  // RN-01: a lista é recalculada sempre que o planejador muda (RF-15).
  const itens = useMemo(
    () => (caderno ? calcularItens(estado.planejador, caderno.receitas, caderno.ingredientes) : []),
    [caderno, estado?.planejador],
  );
  const grupos = useMemo(
    () => (estado ? agruparLista(itens, estado.marcados, estado.avulsos) : []),
    [itens, estado?.marcados, estado?.avulsos],
  );

  if (!dados) return null;
  const { status, codigo } = dados;
  const podeEditar = sincronizacaoDisponivel && Boolean(codigo);
  const receitaDaRota = rota.id ? caderno.receitas.find((r) => r.id === rota.id) : null;

  let tela;
  switch (rota.tela) {
    case 'receita':
      tela = (
        <DetalheReceita
          key={rota.id}
          receita={receitaDaRota}
          ingredientes={caderno.ingredientes}
          porcoes={estado.planejador[rota.id]}
        />
      );
      break;
    case 'cozinha':
      tela = receitaDaRota ? (
        <ModoCozinha
          key={`${rota.id}:${rota.porcoes}`}
          receita={receitaDaRota}
          ingredientes={caderno.ingredientes}
          porcoes={rota.porcoes}
        />
      ) : (
        <DetalheReceita receita={null} />
      );
      break;
    case 'editar':
      tela =
        rota.id && !receitaDaRota ? (
          <DetalheReceita receita={null} />
        ) : (
          <EditarReceita key={rota.id ?? 'nova'} receita={receitaDaRota} caderno={caderno} podeEditar={podeEditar} />
        );
      break;
    case 'planejador':
      tela = (
        <Planejador
          caderno={caderno}
          planejador={estado.planejador}
          status={status}
          categoria={categoriaPlanejador}
          aoMudarCategoria={setCategoriaPlanejador}
        />
      );
      break;
    case 'lista':
      tela = <Lista grupos={grupos} status={status} />;
      break;
    case 'ajustes':
      tela = <Ajustes codigo={codigo} status={status} convite={rota.convite} />;
      break;
    case 'ingredientes':
      tela = <Ingredientes caderno={caderno} podeEditar={podeEditar} />;
      break;
    default:
      tela = (
        <Caderno
          caderno={caderno}
          planejador={estado.planejador}
          status={status}
          categoria={categoriaCaderno}
          aoMudarCategoria={setCategoriaCaderno}
          busca={buscaCaderno}
          aoMudarBusca={setBuscaCaderno}
        />
      );
  }

  return (
    <FotosContext.Provider value={dados.fotos}>
      {tela}
      {!TELAS_CHEIAS.has(rota.tela) && (
        <BarraInferior telaAtual={rota.tela} pendentesNaLista={grupos.reduce((soma, g) => soma + g.pendentes, 0)} />
      )}
    </FotosContext.Provider>
  );
}
