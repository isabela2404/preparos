// Implementação da sincronização com o Firestore (plano Spark).
// Só é carregada (import dinâmico) quando o aparelho tem um código do casal,
// então quem usa o app sem sincronizar não baixa o SDK.
//
// Estrutura no banco:
//   casais/{codigo}                 → { planejador, marcados, avulsos, versaoCarga, criadoEm, substituido? }
//   casais/{codigo}/receitas/{id}   → receita da carga, com o campo `ordem`
//   casais/{codigo}/ingredientes/{id}
//   casais/{codigo}/fotos/{receita}  → { dados (bytes), tipo, atualizadoEm }, reduzida no aparelho

import { initializeApp } from 'firebase/app';
import {
  Bytes,
  FieldPath,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  deleteField,
  doc,
  getDocFromServer,
  getDocsFromServer,
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

/** 'ativo', 'trocado' (substituído por um código novo) ou 'inexistente'. */
export async function situacaoDoCasal(codigo) {
  const casal = await getDocFromServer(casalRef(codigo));
  if (!casal.exists()) return 'inexistente';
  return casal.get('substituido') ? 'trocado' : 'ativo';
}

/**
 * Esvazia o espaço de um código trocado: apaga receitas e ingredientes, limpa
 * o estado e marca como substituído, para quem tiver o código antigo não ver
 * mais nada e o outro celular saber que precisa do código novo.
 */
export async function encerrarCasal(codigo) {
  const casal = casalRef(codigo);
  const lote = writeBatch(db);
  for (const colecao of ['receitas', 'ingredientes', 'fotos']) {
    (await getDocsFromServer(collection(casal, colecao))).docs.forEach((d) => lote.delete(d.ref));
  }
  lote.update(casal, { planejador: {}, marcados: {}, avulsos: {}, substituido: true });
  await lote.commit();
}

/** Copia as fotos para o código novo, em lotes pequenos (cada foto tem até 100 KB). */
export async function copiarFotos(de, para) {
  const fotos = (await getDocsFromServer(collection(casalRef(de), 'fotos'))).docs;
  for (let i = 0; i < fotos.length; i += 20) {
    const lote = writeBatch(db);
    fotos.slice(i, i + 20).forEach((d) => lote.set(doc(casalRef(para), 'fotos', d.id), d.data()));
    await lote.commit();
  }
}

/**
 * Passa a ouvir o espaço do casal. Devolve `gravar(mudancas)` e `desconectar()`.
 * Status: 'sincronizado', 'sincronizando', 'offline' ou 'erro'.
 */
export function conectar(codigo, { aoMudarCaderno, aoMudarEstado, aoMudarStatus, aoMudarFotos }) {
  const casal = casalRef(codigo);
  let receitas = null;
  let ingredientes = null;
  // receita → endereço local (blob:) da foto, para as <img> do app.
  const fotos = new Map();

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
      collection(casal, 'fotos'),
      (s) => {
        for (const mudanca of s.docChanges()) {
          const id = mudanca.doc.id;
          if (fotos.has(id)) URL.revokeObjectURL(fotos.get(id));
          fotos.delete(id);
          if (mudanca.type !== 'removed') {
            const { dados, tipo } = mudanca.doc.data();
            fotos.set(id, URL.createObjectURL(new Blob([dados.toUint8Array()], { type: tipo })));
          }
        }
        aoMudarFotos(Object.fromEntries(fotos));
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
        if (dados.substituido) return aoMudarStatus('substituido');
        aoMudarEstado({
          planejador: dados.planejador ?? {},
          marcados: dados.marcados ?? {},
          avulsos: dados.avulsos ?? {},
        });
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
      const lote = writeBatch(db);
      lote.delete(doc(casal, 'receitas', id));
      lote.delete(doc(casal, 'fotos', id));
      lote.commit().catch(falhar);
    },
    async salvarFoto(receitaId, blob) {
      const dados = Bytes.fromUint8Array(new Uint8Array(await blob.arrayBuffer()));
      setDoc(doc(casal, 'fotos', receitaId), { dados, tipo: blob.type, atualizadoEm: serverTimestamp() }).catch(falhar);
    },
    removerFoto(receitaId) {
      deleteDoc(doc(casal, 'fotos', receitaId)).catch(falhar);
    },
    salvarIngrediente(id, ingrediente) {
      setDoc(doc(casal, 'ingredientes', id), ingrediente).catch(falhar);
    },
    apagarIngrediente(id) {
      deleteDoc(doc(casal, 'ingredientes', id)).catch(falhar);
    },
    desconectar() {
      paradas.forEach((parar) => parar());
      fotos.forEach((url) => URL.revokeObjectURL(url));
    },
  };
}
