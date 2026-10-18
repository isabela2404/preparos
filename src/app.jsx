import { useEffect, useMemo, useState } from 'preact/hooks';
import { BarraInferior } from './componentes/BarraInferior.jsx';
import { useRepositorio } from './dados/useRepositorio.js';
import { agruparLista, calcularItens } from './dominio/lista.js';
import { validarCarga } from './dominio/validacao.js';
import { useRota } from './rotas.js';
import { Ajustes } from './telas/Ajustes.jsx';
import { Caderno } from './telas/Caderno.jsx';
import { DetalheReceita } from './telas/DetalheReceita.jsx';
import { Lista } from './telas/Lista.jsx';
import { Planejador } from './telas/Planejador.jsx';

export function App() {
  const rota = useRota();
  const dados = useRepositorio();
  const [categoriaCaderno, setCategoriaCaderno] = useState(null);
  const [categoriaPlanejador, setCategoriaPlanejador] = useState(null);

  const caderno = dados?.caderno;
  const estado = dados?.estado;

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
  const grupos = useMemo(() => (estado ? agruparLista(itens, estado.marcados) : []), [itens, estado?.marcados]);

  if (!dados) return null;
  const { status, codigo } = dados;

  let tela;
  switch (rota.tela) {
    case 'receita':
      tela = (
        <DetalheReceita
          key={rota.id}
          receita={caderno.receitas.find((r) => r.id === rota.id)}
          ingredientes={caderno.ingredientes}
          porcoes={estado.planejador[rota.id]}
        />
      );
      break;
    case 'planejador':
      tela = (
        <Planejador
          receitas={caderno.receitas}
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
    default:
      tela = (
        <Caderno
          receitas={caderno.receitas}
          planejador={estado.planejador}
          status={status}
          categoria={categoriaCaderno}
          aoMudarCategoria={setCategoriaCaderno}
        />
      );
  }

  return (
    <>
      {tela}
      <BarraInferior telaAtual={rota.tela} pendentesNaLista={grupos.reduce((soma, g) => soma + g.pendentes, 0)} />
    </>
  );
}
