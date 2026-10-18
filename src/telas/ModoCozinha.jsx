import { useEffect, useState } from 'preact/hooks';
import { Check, RotateCcw, Sun, X } from 'lucide-preact';
import { voltar } from '../rotas.js';

// RF-06: letra grande, tela acesa enquanto a receita está aberta e passos
// que podem ser marcados. As marcações ficam só neste aparelho.
export function ModoCozinha({ receita }) {
  const chave = `caderno-de-preparos:cozinha:${receita.id}`;
  const [feitos, setFeitos] = useState(() => lerFeitos(chave));
  const telaAcesa = useTelaAcesa();

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(feitos));
    } catch {
      // Sem armazenamento: as marcações valem enquanto a tela estiver aberta.
    }
  }, [feitos]);

  const alternar = (lista, i) =>
    setFeitos((atual) => ({
      ...atual,
      [lista]: atual[lista].includes(i) ? atual[lista].filter((x) => x !== i) : [...atual[lista], i],
    }));

  const passosFeitos = feitos.passos.length;

  return (
    <main class="cozinha">
      <header class="cozinha-topo">
        <button type="button" class="botao-voltar-simples" onClick={voltar} aria-label="Sair do modo cozinha">
          <X size={28} aria-hidden="true" />
        </button>
        <h1>{receita.nome}</h1>
      </header>
      {telaAcesa && (
        <p class="cozinha-aviso">
          <Sun size={18} aria-hidden="true" /> A tela fica acesa enquanto a receita estiver aberta.
        </p>
      )}

      <section aria-labelledby="cozinha-separe">
        <h2 id="cozinha-separe">Separe</h2>
        <ul class="cozinha-lista">
          {receita.ingredientesTexto.map((linha, i) => (
            <li key={i}>
              <button
                type="button"
                class="cozinha-item"
                aria-pressed={feitos.ingredientes.includes(i)}
                onClick={() => alternar('ingredientes', i)}
              >
                <span class="caixa" aria-hidden="true">
                  <Check size={22} strokeWidth={3} />
                </span>
                <span>{linha}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="cozinha-prepare">
        <h2 id="cozinha-prepare">
          Prepare{' '}
          <span class="secao-nota">
            {passosFeitos} de {receita.passos.length}
          </span>
        </h2>
        <ol class="cozinha-lista">
          {receita.passos.map((passo, i) => (
            <li key={i}>
              <button
                type="button"
                class="cozinha-item cozinha-passo"
                aria-pressed={feitos.passos.includes(i)}
                onClick={() => alternar('passos', i)}
              >
                <span class="cozinha-numero" aria-hidden="true">
                  {feitos.passos.includes(i) ? <Check size={24} strokeWidth={3} /> : i + 1}
                </span>
                <span>{passo}</span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      {receita.vira && <p class="vira cozinha-vira">Vira: {receita.vira}</p>}

      <button
        type="button"
        class="botao botao-secundario botao-largo"
        onClick={() => setFeitos({ ingredientes: [], passos: [] })}
      >
        <RotateCcw size={20} aria-hidden="true" /> Recomeçar
      </button>
    </main>
  );
}

function lerFeitos(chave) {
  try {
    const salvo = JSON.parse(localStorage.getItem(chave));
    if (Array.isArray(salvo?.ingredientes) && Array.isArray(salvo?.passos)) return salvo;
  } catch {
    // ignora e começa do zero
  }
  return { ingredientes: [], passos: [] };
}

/** Pede para a tela não apagar (Wake Lock) e pede de novo quando o app volta ao primeiro plano. */
function useTelaAcesa() {
  const [ativa, setAtiva] = useState(false);
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let trava = null;
    let montado = true;
    const pedir = async () => {
      try {
        const nova = await navigator.wakeLock.request('screen');
        if (!montado) return nova.release();
        trava = nova;
        setAtiva(true);
        nova.addEventListener('release', () => montado && setAtiva(false));
      } catch {
        setAtiva(false);
      }
    };
    const aoVoltar = () => document.visibilityState === 'visible' && pedir();
    pedir();
    document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      montado = false;
      document.removeEventListener('visibilitychange', aoVoltar);
      trava?.release();
    };
  }, []);
  return ativa;
}
