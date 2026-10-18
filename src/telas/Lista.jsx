import { useState } from 'preact/hooks';
import {
  Apple,
  Archive,
  Check,
  ChevronDown,
  Drumstick,
  Milk,
  Package,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
  X,
} from 'lucide-preact';
import { BotaoZerar } from '../componentes/BotaoZerar.jsx';
import { TopoTitulo } from '../componentes/TopoTitulo.jsx';
import { adicionarAvulso, definirMarcacao, marcarAvulso, removerAvulso } from '../dados/repositorio.js';
import { GRUPO_OUTROS, quantidadeAoMarcar, textoQuantidade, textoWhatsApp } from '../dominio/lista.js';
import { SETORES } from '../dominio/setores.js';
import { formatarQuantidade } from '../dominio/unidades.js';
import { linkReceita } from '../rotas.js';

const ICONE_SETOR = {
  acougue: Drumstick,
  hortifruti: Apple,
  mercearia: Package,
  frios: Milk,
  temperos: Sparkles,
  outros: ShoppingBag,
  despensa: Archive,
};

// RF-20 a RF-28.
export function Lista({ grupos, status }) {
  const [abertos, setAbertos] = useState(() => new Set());
  const alternarOrigem = (codigo) =>
    setAbertos((atuais) => {
      const novos = new Set(atuais);
      if (novos.has(codigo)) novos.delete(codigo);
      else novos.add(codigo);
      return novos;
    });

  const total = grupos.reduce((soma, g) => soma + g.itens.length, 0);
  const pendentes = grupos.reduce((soma, g) => soma + g.pendentes, 0);
  const feitos = total - pendentes;

  return (
    <>
      <header class="topo">
        <TopoTitulo titulo="Lista de compras" status={status} />
        {total > 0 && (
          <div class="progresso">
            <span>
              {feitos} de {total} itens
            </span>
            <div
              class="progresso-barra"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={feitos}
            >
              <div style={{ width: `${(feitos / total) * 100}%` }} />
            </div>
          </div>
        )}
      </header>

      <main class={total ? 'conteudo com-resumo' : 'conteudo'}>
        {!total && (
          <div class="lista-vazia">
            <p>
              A lista sai das receitas escolhidas no Planejador. Também dá para anotar aqui o que não vem de receita.
            </p>
            <a class="botao botao-secundario" href="#/planejador">
              Ir para o Planejador
            </a>
          </div>
        )}

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
                    <div class="item-linha">
                      <label class={item.marcado ? 'item marcado' : 'item'}>
                        <input
                          type="checkbox"
                          class="so-leitor"
                          checked={item.marcado}
                          onChange={() =>
                            item.avulso
                              ? marcarAvulso(item.id, !item.marcado)
                              : definirMarcacao(item.codigo, item.marcado ? null : quantidadeAoMarcar(item))
                          }
                        />
                        <span class="caixa" aria-hidden="true">
                          <Check size={20} strokeWidth={3} />
                        </span>
                        <span class="item-nome">{item.nome}</span>
                        <span class="item-qtd">{textoQuantidade(item)}</span>
                      </label>
                      {item.avulso ? (
                        <button
                          type="button"
                          class="item-remover"
                          aria-label={`Tirar ${item.nome} da lista`}
                          onClick={() => removerAvulso(item.id)}
                        >
                          <X size={20} aria-hidden="true" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          class="item-remover item-origem"
                          aria-expanded={abertos.has(item.codigo)}
                          aria-label={`De onde vem ${item.nome}`}
                          onClick={() => alternarOrigem(item.codigo)}
                        >
                          <ChevronDown size={20} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                    {abertos.has(item.codigo) && <Origens item={item} />}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <NovoAvulso />
      </main>

      {total > 0 && (
        <div class="resumo">
          <div class="resumo-acoes">
            <BotaoZerar />
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
      )}
    </>
  );
}

// RF-27: item que não vem de receita, como papel toalha.
function NovoAvulso() {
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState(GRUPO_OUTROS.id);
  return (
    <form
      class="novo-avulso"
      onSubmit={(e) => {
        e.preventDefault();
        if (!nome.trim()) return;
        adicionarAvulso(nome, setor);
        setNome('');
      }}
    >
      <label for="avulso-nome" class="novo-avulso-titulo">
        Adicionar à lista
      </label>
      <div class="novo-avulso-campos">
        <input
          id="avulso-nome"
          type="text"
          placeholder="Ex.: papel toalha"
          enterkeyhint="done"
          value={nome}
          onInput={(e) => setNome(e.currentTarget.value)}
        />
        <select aria-label="Setor do mercado" value={setor} onChange={(e) => setSetor(e.currentTarget.value)}>
          {[...SETORES, GRUPO_OUTROS].map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        <button type="submit" class="botao" disabled={!nome.trim()} aria-label="Adicionar item">
          <Plus size={22} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}

// RF-28: de quais receitas vem o item e quanto cada uma pede.
function Origens({ item }) {
  const arredondado = item.qtdCompra != null && Math.abs(item.qtdCompra - item.total) > 1e-6;
  return (
    <div class="origens">
      <ul>
        {item.origens.map((o) => (
          <li key={o.receitaId}>
            <a href={linkReceita(o.receitaId)}>{o.nome}</a>
            <span>
              {o.porcoes} {o.porcoes === 1 ? 'porção' : 'porções'} ·{' '}
              {o.quantidade == null ? 'a gosto' : formatarQuantidade(o.quantidade, item.unidade)}
            </span>
          </li>
        ))}
      </ul>
      {arredondado && <p>Somando dá {formatarQuantidade(item.total, item.unidade)}; a lista arredonda para cima.</p>}
    </div>
  );
}
