import { useEffect, useRef, useState } from 'preact/hooks';
import { Camera, Plus, Trash2, X } from 'lucide-preact';
import { CapaReceita, useFoto } from '../componentes/CapaReceita.jsx';
import { Confirmacao } from '../componentes/Confirmacao.jsx';
import { SeletorIngrediente } from '../componentes/SeletorIngrediente.jsx';
import { apagarReceita, removerFoto, salvarFoto, salvarReceita } from '../dados/repositorio.js';
import { reduzirImagem } from '../dados/imagem.js';
import { CATEGORIAS } from '../dominio/categorias.js';
import {
  NOME_MEDIDA,
  NOME_UNIDADE,
  formularioParaReceita,
  novaChave,
  quantidadeNaBase,
  receitaParaFormulario,
} from '../dominio/edicao.js';
import { formatarQuantidade } from '../dominio/unidades.js';
import { linkReceita, voltar } from '../rotas.js';

// Cadastro de receitas pela tela: criar, editar e apagar. Grava no banco do casal.
export function EditarReceita({ receita, caderno, podeEditar }) {
  const [form, setForm] = useState(() => receitaParaFormulario(receita));
  const [novos, setNovos] = useState({});
  const [erros, setErros] = useState([]);
  const [escolhendo, setEscolhendo] = useState(null);
  const [apagando, setApagando] = useState(false);
  // Foto: { blob, url } escolhida agora, ou 'remover'; null mantém a atual.
  const [foto, setFoto] = useState(null);
  const [estadoFoto, setEstadoFoto] = useState(null);
  const fotoAtual = useFoto(receita ?? { id: '', foto: null });
  const topo = useRef(null);

  useEffect(() => () => foto?.url && URL.revokeObjectURL(foto.url), [foto]);

  const titulo = receita ? 'Editar receita' : 'Nova receita';
  const catalogo = { ...caderno.ingredientes, ...novos };
  const porcoes = Number(form.porcoes);

  if (!podeEditar) {
    return (
      <main class="conteudo editor">
        <Cabecalho titulo={titulo} />
        <section class="cartao">
          <p>
            As receitas ficam no caderno compartilhado. Para criar ou editar, crie antes o código do casal em Ajustes.
          </p>
          <a class="botao" href="#/ajustes">
            Ir para Ajustes
          </a>
        </section>
      </main>
    );
  }

  // Sempre a partir do valor mais recente: duas mudanças seguidas não se atropelam.
  const mudar = (mudanca) => setForm((atual) => ({ ...atual, ...mudanca(atual) }));
  const campo = (nome) => ({
    value: form[nome],
    onInput: (e) => {
      const valor = e.currentTarget.value;
      mudar(() => ({ [nome]: valor }));
    },
  });
  const mudarItem = (chave, mudanca) =>
    mudar((atual) => ({ itens: atual.itens.map((i) => (i.chave === chave ? { ...i, ...mudanca } : i)) }));

  function salvar(e) {
    e.preventDefault();
    const { receita: pronta, erros: problemas } = formularioParaReceita(form, {
      original: receita,
      receitas: caderno.receitas,
      ingredientes: catalogo,
    });
    setErros(problemas);
    if (problemas.length) {
      topo.current?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const usados = new Set(pronta.ingredientes.map((i) => i.ingrediente));
    salvarReceita(pronta, Object.fromEntries(Object.entries(novos).filter(([id]) => usados.has(id))));
    if (foto === 'remover') removerFoto(pronta.id);
    else if (foto) salvarFoto(pronta.id, foto.blob);
    if (receita) voltar();
    else location.replace(linkReceita(pronta.id));
  }

  return (
    <main class="conteudo editor" ref={topo}>
      <Cabecalho titulo={titulo} />

      {erros.length > 0 && (
        <div class="mensagem mensagem-erro" role="alert">
          <strong>Falta pouco:</strong>
          <ul>
            {erros.map((erro) => (
              <li key={erro}>{erro}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={salvar} novalidate>
        <label class="campo">
          <span>Nome</span>
          <input type="text" {...campo('nome')} />
        </label>

        <fieldset class="campo">
          <legend>Categoria</legend>
          <div class="chips chips-quebra" role="radiogroup">
            {CATEGORIAS.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={form.categoria === c.id}
                class="chip"
                style={{ '--cor-categoria': c.cor }}
                onClick={() => mudar(() => ({ categoria: c.id }))}
              >
                {c.nomeCurto ?? c.nome}
              </button>
            ))}
          </div>
        </fieldset>

        <div class="campo">
          <span>Foto</span>
          <CapaReceita
            class="editor-foto"
            receita={{ id: receita?.id ?? '', categoria: form.categoria }}
            foto={foto === 'remover' ? null : (foto?.url ?? fotoAtual ?? null)}
          />
          <div class="ajustes-acoes">
            <label class="botao botao-secundario">
              <Camera size={20} aria-hidden="true" />
              {foto?.url || (fotoAtual && foto !== 'remover') ? 'Trocar foto' : 'Escolher foto'}
              <input
                type="file"
                accept="image/*"
                class="so-leitor"
                onChange={async (e) => {
                  const arquivo = e.currentTarget.files[0];
                  e.currentTarget.value = '';
                  if (!arquivo) return;
                  setEstadoFoto('Reduzindo a foto…');
                  try {
                    const blob = await reduzirImagem(arquivo);
                    setFoto({ blob, url: URL.createObjectURL(blob) });
                    setEstadoFoto(`Foto pronta (${Math.ceil(blob.size / 1024)} KB). Ela é gravada ao salvar.`);
                  } catch (erro) {
                    setEstadoFoto(erro.message);
                  }
                }}
              />
            </label>
            {(foto?.url || (fotoAtual && foto !== 'remover')) && (
              <button
                type="button"
                class="botao botao-perigo-texto"
                onClick={() => {
                  setFoto('remover');
                  setEstadoFoto('A foto sai ao salvar.');
                }}
              >
                Remover foto
              </button>
            )}
          </div>
          {estadoFoto && <small role="status">{estadoFoto}</small>}
        </div>

        <div class="campos-lado">
          <label class="campo">
            <span>Rende (porções)</span>
            <input type="number" inputmode="numeric" min="1" max="99" {...campo('porcoes')} />
          </label>
          <label class="campo">
            <span>Tempo</span>
            <input type="text" placeholder="35 min" {...campo('tempo')} />
          </label>
        </div>

        <label class="campo">
          <span>1 porção é</span>
          <input type="text" placeholder="3 almôndegas" {...campo('descricaoPorcao')} />
        </label>

        <label class="campo">
          <span>Ingredientes</span>
          <small>Como aparecem na receita, um por linha. É o que aparece em "Receita inteira".</small>
          <textarea rows="5" {...campo('ingredientesTexto')} />
        </label>

        <fieldset class="campo">
          <legend>Para a lista de compras</legend>
          <small>Quantidade da receita inteira; o app divide pelas {porcoes >= 1 ? porcoes : ''} porções.</small>
          <ul class="editor-itens">
            {form.itens.map((item) => {
              const ing = catalogo[item.ingrediente];
              const total = ing && !item.aGosto ? quantidadeNaBase(item, catalogo) : NaN;
              return (
                <li key={item.chave} class="editor-item">
                  <div class="editor-item-linha">
                    <button type="button" class="editor-ingrediente" onClick={() => setEscolhendo(item.chave)}>
                      {ing?.nome ?? 'Escolher ingrediente'}
                    </button>
                    <button
                      type="button"
                      class="item-remover"
                      aria-label={`Tirar ${ing?.nome ?? 'linha'}`}
                      onClick={() => mudar((atual) => ({ itens: atual.itens.filter((i) => i.chave !== item.chave) }))}
                    >
                      <X size={20} aria-hidden="true" />
                    </button>
                  </div>
                  {ing && (
                    <div class="editor-item-linha">
                      {!item.aGosto && (
                        <>
                          <input
                            type="text"
                            inputmode="decimal"
                            class="editor-qtd"
                            aria-label={`Quantidade de ${ing.nome}`}
                            value={item.quantidade}
                            onInput={(e) => mudarItem(item.chave, { quantidade: e.currentTarget.value })}
                          />
                          <select
                            aria-label={`Medida de ${ing.nome}`}
                            value={item.medida}
                            onChange={(e) => mudarItem(item.chave, { medida: e.currentTarget.value })}
                          >
                            <option value="base">{NOME_UNIDADE[ing.unidade]}</option>
                            {Object.entries(ing.medidas ?? {}).map(([medida, fator]) => (
                              <option key={medida} value={medida}>
                                {NOME_MEDIDA[medida] ?? medida} ({formatarQuantidade(fator, ing.unidade)})
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      <label class="opcao editor-agosto">
                        <input
                          type="checkbox"
                          checked={item.aGosto}
                          onChange={(e) => mudarItem(item.chave, { aGosto: e.currentTarget.checked })}
                        />
                        <span>a gosto</span>
                      </label>
                    </div>
                  )}
                  {total > 0 && porcoes >= 1 && (
                    <small class="editor-porcao">≈ {formatarQuantidade(total / porcoes, ing.unidade)} por porção</small>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            class="botao botao-secundario"
            onClick={() => {
              const chave = novaChave();
              mudar((atual) => ({
                itens: [...atual.itens, { chave, ingrediente: null, medida: 'base', quantidade: '', aGosto: false }],
              }));
              setEscolhendo(chave);
            }}
          >
            <Plus size={20} aria-hidden="true" /> Adicionar ingrediente
          </button>
        </fieldset>

        <label class="campo">
          <span>Modo de preparo</span>
          <small>Um passo por linha.</small>
          <textarea rows="6" {...campo('passos')} />
        </label>

        <label class="campo">
          <span>Conservação</span>
          <small>Um local por linha, como "Geladeira: 3 a 4 dias".</small>
          <textarea rows="2" {...campo('conservacao')} />
        </label>

        <label class="campo">
          <span>Vira</span>
          <small>Ideias para aproveitar o preparo.</small>
          <textarea rows="2" {...campo('vira')} />
        </label>

        <button type="submit" class="botao botao-largo">
          Salvar receita
        </button>

        {receita && (
          <button type="button" class="botao botao-perigo-texto botao-largo" onClick={() => setApagando(true)}>
            <Trash2 size={20} aria-hidden="true" /> Apagar receita
          </button>
        )}
      </form>

      <SeletorIngrediente
        aberto={escolhendo != null}
        ingredientes={catalogo}
        aoFechar={() => {
          // Linha nova que ficou sem ingrediente sai da lista.
          mudar((atual) => ({ itens: atual.itens.filter((i) => i.ingrediente || i.chave !== escolhendo) }));
          setEscolhendo(null);
        }}
        aoEscolher={(codigo, ingrediente) => {
          if (ingrediente) setNovos((atuais) => ({ ...atuais, [codigo]: ingrediente }));
          mudarItem(escolhendo, { ingrediente: codigo, medida: 'base' });
          setEscolhendo(null);
        }}
      />

      <Confirmacao
        aberta={apagando}
        titulo="Apagar esta receita?"
        texto="Ela sai do caderno nos dois celulares e do planejador. Não dá para desfazer."
        rotuloConfirmar="Apagar"
        aoConfirmar={() => {
          apagarReceita(receita.id);
          location.replace('#/');
        }}
        aoCancelar={() => setApagando(false)}
      />
    </main>
  );
}

function Cabecalho({ titulo }) {
  return (
    <div class="ajustes-topo">
      <button type="button" class="botao-voltar-simples" onClick={voltar} aria-label="Cancelar">
        <X size={24} aria-hidden="true" />
      </button>
      <h1 class="topo-titulo">{titulo}</h1>
    </div>
  );
}
