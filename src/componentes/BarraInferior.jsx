import { BookOpen, ClipboardList, ShoppingCart } from 'lucide-preact';

// RF-41: três destinos fixos. A tela de receita conta como parte do Caderno.
const DESTINOS = [
  { tela: 'caderno', rotulo: 'Caderno', href: '#/', Icone: BookOpen },
  { tela: 'planejador', rotulo: 'Planejador', href: '#/planejador', Icone: ClipboardList },
  { tela: 'lista', rotulo: 'Lista', href: '#/lista', Icone: ShoppingCart },
];

export function BarraInferior({ telaAtual, pendentesNaLista }) {
  const ativa = telaAtual === 'receita' ? 'caderno' : telaAtual;
  return (
    <nav class="barra-inferior" aria-label="Principal">
      {DESTINOS.map(({ tela, rotulo, href, Icone }) => (
        <a key={tela} href={href} class="barra-item" aria-current={ativa === tela ? 'page' : undefined}>
          <span class="barra-icone">
            <Icone size={24} aria-hidden="true" />
            {tela === 'lista' && pendentesNaLista > 0 && (
              <span class="selo">
                {pendentesNaLista}
                <span class="so-leitor"> itens pendentes</span>
              </span>
            )}
          </span>
          <span>{rotulo}</span>
        </a>
      ))}
    </nav>
  );
}
