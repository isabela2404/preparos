// Testa firestore.rules no emulador. Roda com `npm run test:regras`;
// no `npm test` comum fica de fora, porque o emulador precisa de Java.
import { deleteApp, initializeApp } from 'firebase/app';
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { afterAll, describe, expect, it } from 'vitest';

const emulador = process.env.FIRESTORE_EMULATOR_HOST;

describe.skipIf(!emulador)('regras do Firestore', () => {
  const app = initializeApp({ projectId: 'demo-preparos', apiKey: 'teste' }, 'regras');
  const db = getFirestore(app);
  if (emulador) connectFirestoreEmulator(db, ...emulador.split(':').map((p, i) => (i ? Number(p) : p)));
  afterAll(() => deleteApp(app));

  const codigo = 'AbCdEfGhIjKlMnOpQrStUvWxYz012345';
  const casal = doc(db, 'casais', codigo);
  const negado = (promessa) => expect(promessa).rejects.toMatchObject({ code: 'permission-denied' });

  it('cria, lê e altera o casal com código válido', async () => {
    await setDoc(casal, { planejador: {}, marcados: {}, versaoCarga: 1 });
    await updateDoc(casal, { 'planejador.arroz': 6 });
    expect((await getDoc(casal)).data().planejador).toEqual({ arroz: 6 });
  });

  it('não deixa listar casais', () => negado(getDocs(collection(db, 'casais'))));

  it('não deixa apagar o casal', () => negado(deleteDoc(casal)));

  it('recusa código curto', () =>
    negado(setDoc(doc(db, 'casais', 'curto'), { planejador: {}, marcados: {} })));

  it('aceita itens avulsos como mapa', async () => {
    await updateDoc(casal, { 'avulsos.a1': { nome: 'Papel toalha', setor: 'temperos', marcado: false } });
    expect((await getDoc(casal)).data().avulsos.a1.nome).toBe('Papel toalha');
  });

  it('recusa campos fora do formato', async () => {
    await negado(updateDoc(casal, { outroCampo: 1 }));
    await negado(updateDoc(casal, { planejador: 'texto' }));
    await negado(updateDoc(casal, { avulsos: ['lista'] }));
  });

  it('lê e grava receitas e ingredientes do casal, e nada além disso', async () => {
    await setDoc(doc(casal, 'receitas', 'arroz'), { nome: 'Arroz' });
    expect((await getDocs(collection(casal, 'receitas'))).size).toBe(1);
    await negado(setDoc(doc(casal, 'outra', 'x'), { a: 1 }));
  });
});
