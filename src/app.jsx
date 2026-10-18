import { useEffect, useState } from 'preact/hooks';
import { ClipboardList, ShoppingCart } from 'lucide-preact';
import { BarraInferior } from './componentes/BarraInferior.jsx';
import { carregarCaderno } from './dados/repositorio.js';
import { validarCarga } from './dominio/validacao.js';
import { useRota } from './rotas.js';
import { Caderno } from './telas/Caderno.jsx';
import { DetalheReceita } from './telas/DetalheReceita.jsx';
import { EmBreve } from './telas/EmBreve.jsx';

export function App() {
  const rota = useRota();
  const [caderno, setCaderno] = useState(null);
  const [categoria, setCategoria] = useState(null);

  useEffect(() => {
    carregarCaderno().then((dados) => {
      const erros = validarCarga(dados);
      if (erros.length) console.warn('Problemas no caderno:\n' + erros.join('\n'));
      setCaderno(dados);
    });
  }, []);

  if (!caderno) return null;

  let tela;
  switch (rota.tela) {
    case 'receita':
      tela = (
        <DetalheReceita
          key={rota.id}
          receita={caderno.receitas.find((r) => r.id === rota.id)}
          ingredientes={caderno.ingredientes}
        />
      );
      break;
    case 'planejador':
      tela = <EmBreve titulo="Planejador" Icone={ClipboardList} />;
      break;
    case 'lista':
      tela = <EmBreve titulo="Lista de compras" Icone={ShoppingCart} />;
      break;
    default:
      tela = <Caderno receitas={caderno.receitas} categoria={categoria} aoMudarCategoria={setCategoria} />;
  }

  return (
    <>
      {tela}
      <BarraInferior telaAtual={rota.tela} />
    </>
  );
}
