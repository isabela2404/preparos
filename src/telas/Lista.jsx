import { useState } from 'preact/hooks';
import { Apple, Archive, Check, ClipboardList, Drumstick, Milk, Package, Share2, Sparkles } from 'lucide-preact';
import { Confirmacao } from '../componentes/Confirmacao.jsx';
import { definirMarcacao, zerarMarcacoes } from '../dados/repositorio.js';
import { quantidadeAoMarcar, textoQuantidade, textoWhatsApp } from '../dominio/lista.js';

const ICONE_SETOR = {
  acougue: Drumstick,
  hortifruti: Apple,
  mercearia: Package,
  frios: Milk,
  temperos: Sparkles,
  despensa: Archive,
};

// RF-20 a RF-26.
export function Lista({ grupos }) {
  const [confirmando, setConfirmando] = useState(false);

  if (!grupos.length) {
    return (
      <main class="conteudo vazio">
        <ClipboardList size={48} strokeWidth={1.5} aria-hidden="true" />
        <h1 class="topo-titulo">Lista vazia</h1>
        <p>A lista sai das receitas escolhidas no Planejador.</p>
        <a class="botao" href="#/planejador">
          Ir para o Planejador
        </a>
      </main>
    );
  }

  const total = grupos.reduce((soma, g) => soma + g.itens.length, 0);
  const pendentes = grupos.reduce((soma, g) => soma + g.pendentes, 0);
  const feitos = total - pendentes;

  return (
    <>
      <header class="topo">
        <h1 class="topo-titulo">Lista de compras</h1>
        <div class="progresso">
          <span>
            {feitos} de {total} itens
          </span>
          <div class="progresso-barra" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={feitos}>
            <div style={{ width: `${(feitos / total) * 100}%` }} />
          </div>
        </div>
      </header>

      <main class="conteudo com-resumo">
        {grupos.map((grupo) => {
          const Icone = ICONE_SETOR[grupo.id];
          return (
            <section key={grupo.id} class="setor" aria-labelledby={`setor-${grupo.id}`}>
              <h2 id={`setor-${grupo.id}`} class="setor-titulo">
                <Icone size={22} aria-hidden="true" />
                <span>{grupo.nome}</span>
                <span class="setor-contagem">{grupo.pendentes ? `faltam ${grupo.pendentes}` : 'tudo certo'}</span>
              </h2>
              <ul class="itens">
                {grupo.itens.map((item) => (
                  <li key={item.codigo}>
                    <label class={item.marcado ? 'item marcado' : 'item'}>
                      <input
                        type="checkbox"
                        class="so-leitor"
                        checked={item.marcado}
                        onChange={() => definirMarcacao(item.codigo, item.marcado ? null : quantidadeAoMarcar(item))}
                      />
                      <span class="caixa" aria-hidden="true">
                        <Check size={20} strokeWidth={3} />
                      </span>
                      <span class="item-nome">{item.nome}</span>
                      <span class="item-qtd">{textoQuantidade(item)}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>

      <div class="resumo">
        <div class="resumo-acoes">
          <button
            type="button"
            class="botao botao-secundario"
            disabled={!feitos}
            onClick={() => setConfirmando(true)}
          >
            Zerar lista
          </button>
          <a
            class={pendentes ? 'botao botao-whatsapp' : 'botao botao-whatsapp desabilitado'}
            href={`https://wa.me/?text=${encodeURIComponent(textoWhatsApp(grupos))}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Share2 size={20} aria-hidden="true" /> WhatsApp
          </a>
        </div>
      </div>

      <Confirmacao
        aberta={confirmando}
        titulo="Zerar a lista?"
        texto="As marcações serão apagadas. As receitas do planejador continuam."
        rotuloConfirmar="Zerar lista"
        aoConfirmar={() => {
          zerarMarcacoes();
          setConfirmando(false);
        }}
        aoCancelar={() => setConfirmando(false)}
      />
    </>
  );
}
