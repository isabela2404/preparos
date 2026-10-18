// Implementação da sincronização com o Firestore (plano Spark).
// Só é carregada (import dinâmico) quando o aparelho tem um código do casal,
// então quem usa o app sem sincronizar não baixa o SDK.
//
// Estrutura no banco:
//   casais/{codigo}                 → { planejador, marcados, avulsos, versaoCarga, criadoEm }
//   casais/{codigo}/receitas/{id}   → receita da carga, com o campo `ordem`
//   casais/{codigo}/ingredientes/{id}

import { initializeApp } from 'firebase/app';
import {
  FieldPath,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  deleteField,
  doc,
  getDocFromServer,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  persistentMultipleTabManager,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
});

// Cache no aparelho: o app abre offline e as gravações sobem quando a conexão volta (RF-32).
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true,
});

if (import.meta.env.VITE_FIRESTORE_EMULADOR) {
  const [host, porta] = import.meta.env.VITE_FIRESTORE_EMULADOR.split(':');
  connectFirestoreEmulator(db, host, Number(porta));
}

const casalRef = (codigo) => doc(db, 'casais', codigo);

function escreverCarga(lote, casal, carga) {
  carga.receitas.forEach((receita, ordem) => lote.set(doc(casal, 'receitas', receita.id), { ...receita, ordem }));
  for (const [id, ingrediente] of Object.entries(carga.ingredientes)) {
    lote.set(doc(casal, 'ingredientes', id), ingrediente);
  }
}

/**
 * Cria o espaço do casal com a carga inicial e o estado que já estava no
 * aparelho. Depois disso, as receitas são editadas pela tela e o banco passa
 * a ser a fonte delas; a carga do repositório não é regravada.
 */
export async function criarCasal(codigo, carga, estado) {
  const casal = casalRef(codigo);
  const lote = writeBatch(db);
  escreverCarga(lote, casal, carga);
  lote.set(casal, {
    planejador: estado.planejador,
    marcados: estado.marcados,
    avulsos: estado.avulsos ?? {},
    versaoCarga: carga.versao,
    criadoEm: serverTimestamp(),
  });
  await lote.commit();
}

export async function casalExiste(codigo) {
  return (await getDocFromServer(casalRef(codigo))).exists();
}

/**
 * Passa a ouvir o espaço do casal. Devolve `gravar(mudancas)` e `desconectar()`.
 * Status: 'sincronizado', 'sincronizando', 'offline' ou 'erro'.
 */
export function conectar(codigo, { aoMudarCaderno, aoMudarEstado, aoMudarStatus }) {
  const casal = casalRef(codigo);
  let receitas = null;
  let ingredientes = null;

  const falhar = (erro) => {
    console.error('Sincronização:', erro);
    aoMudarStatus('erro');
  };
  const emitirCaderno = () => {
    // Enquanto o cache ainda está vazio, o app segue com a carga empacotada.
    if (receitas?.length && ingredientes) aoMudarCaderno({ receitas, ingredientes });
  };

  const paradas = [
    onSnapshot(
      collection(casal, 'receitas'),
      (s) => {
        receitas = s.docs.map((d) => d.data()).sort((a, b) => a.ordem - b.ordem);
        emitirCaderno();
      },
      falhar,
    ),
    onSnapshot(
      collection(casal, 'ingredientes'),
      (s) => {
        ingredientes = Object.fromEntries(s.docs.map((d) => [d.id, d.data()]));
        emitirCaderno();
      },
      falhar,
    ),
    onSnapshot(
      casal,
      { includeMetadataChanges: true },
      (s) => {
        const { fromCache, hasPendingWrites } = s.metadata;
        if (!s.exists()) {
          if (!fromCache) falhar(new Error(`O caderno ${codigo.slice(0, 4)}… não existe no banco`));
          return;
        }
        const dados = s.data();
        aoMudarEstado({ planejador: dados.planejador ?? {}, marcados: dados.marcados ?? {}, avulsos: dados.avulsos ?? {} });
        if (!navigator.onLine) aoMudarStatus('offline');
        else aoMudarStatus(hasPendingWrites || fromCache ? 'sincronizando' : 'sincronizado');
      },
      falhar,
    ),
  ];

  return {
    gravar(mudancas) {
      const [campo, valor, ...resto] = mudancas.flatMap((m) => [
        new FieldPath(...m.campo),
        m.valor == null ? deleteField() : m.valor,
      ]);
      // Sem await: offline, a promessa só resolve quando a conexão volta.
      updateDoc(casal, campo, valor, ...resto).catch(falhar);
    },
    // Cadastro pela tela. Sem await, pelo mesmo motivo: offline a gravação fica
    // na fila, e o cache local já mostra a mudança na hora.
    salvarReceita(receita, novosIngredientes) {
      const lote = writeBatch(db);
      lote.set(doc(casal, 'receitas', receita.id), receita);
      for (const [id, ing] of Object.entries(novosIngredientes)) lote.set(doc(casal, 'ingredientes', id), ing);
      lote.commit().catch(falhar);
    },
    apagarReceita(id) {
      deleteDoc(doc(casal, 'receitas', id)).catch(falhar);
    },
    salvarIngrediente(id, ingrediente) {
      setDoc(doc(casal, 'ingredientes', id), ingrediente).catch(falhar);
    },
    apagarIngrediente(id) {
      deleteDoc(doc(casal, 'ingredientes', id)).catch(falhar);
    },
    desconectar() {
      paradas.forEach((parar) => parar());
    },
  };
}
