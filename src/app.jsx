import { useEffect, useMemo, useState } from 'preact/hooks';
import { BarraInferior } from './componentes/BarraInferior.jsx';
import { carregarCaderno, observarEstado, removerMarcacoes } from './dados/repositorio.js';
import { agruparLista, calcularItens } from './dominio/lista.js';
import { validarCarga } from './dominio/validacao.js';
import { useRota } from './rotas.js';
import { Caderno } from './telas/Caderno.jsx';
import { DetalheReceita } from './telas/DetalheReceita.jsx';
import { Lista } from './telas/Lista.jsx';
import { Planejador } from './telas/Planejador.jsx';

export function App() {
  const rota = useRota();
  const [caderno, setCaderno] = useState(null);
  const [estado, setEstado] = useState(null);
  const [categoriaCaderno, setCategoriaCaderno] = useState(null);
  const [categoriaPlanejador, setCategoriaPlanejador] = useState(null);

  useEffect(() => {
    carregarCaderno().then((dados) => {
      const erros = validarCarga(dados);
      if (erros.length) console.warn('Problemas no caderno:\n' + erros.join('\n'));
      setCaderno(dados);
    });
    return observarEstado(setEstado);
  }, []);

  // RN-01: a lista é recalculada sempre que o planejador muda (RF-15).
  const itens = useMemo(
    () => (caderno && estado ? calcularItens(estado.planejador, caderno.receitas, caderno.ingredientes) : null),
    [caderno, estado?.planejador],
  );
  const grupos = useMemo(() => (itens ? agruparLista(itens, estado.marcados) : []), [itens, estado?.marcados]);

  // RN-07: marcações de itens que saíram da lista não ficam guardadas.
  useEffect(() => {
    if (!itens) return;
    const naLista = new Set(itens.map((i) => i.codigo));
    const sobrando = Object.keys(estado.marcados).filter((codigo) => !naLista.has(codigo));
    if (sobrando.length) removerMarcacoes(sobrando);
  }, [itens]);

  if (!caderno || !estado) return null;

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
          categoria={categoriaPlanejador}
          aoMudarCategoria={setCategoriaPlanejador}
        />
      );
      break;
    case 'lista':
      tela = <Lista grupos={grupos} />;
      break;
    default:
      tela = (
        <Caderno
          receitas={caderno.receitas}
          planejador={estado.planejador}
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
