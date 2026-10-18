// Reduz a foto no aparelho antes de gravar (RNF-04: até 100 KB cada).
// O Safari não gera WebP pelo canvas; nele a foto sai em JPEG.

export const LIMITE_FOTO = 100 * 1024;
const LADO_MAXIMO = 900;

function carregar(arquivo) {
  return new Promise((ok, falha) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      ok(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      falha(new Error('Não consegui abrir essa imagem.'));
    };
    img.src = url;
  });
}

const paraBlob = (canvas, tipo, qualidade) => new Promise((ok) => canvas.toBlob(ok, tipo, qualidade));

/** Devolve um Blob WebP ou JPEG com no máximo LIMITE_FOTO bytes. */
export async function reduzirImagem(arquivo) {
  const img = await carregar(arquivo);
  let lado = LADO_MAXIMO;
  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const escala = Math.min(1, lado / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * escala);
    canvas.height = Math.round(img.naturalHeight * escala);
    // A orientação da câmera (EXIF) já vem aplicada pelo navegador ao desenhar a <img>.
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const qualidade of [0.8, 0.65, 0.5]) {
      const webp = await paraBlob(canvas, 'image/webp', qualidade);
      const blob = webp?.type === 'image/webp' ? webp : await paraBlob(canvas, 'image/jpeg', qualidade);
      if (blob && blob.size <= LIMITE_FOTO) return blob;
    }
    lado = Math.round(lado * 0.75);
  }
  throw new Error('Não consegui reduzir essa foto. Tente outra.');
}
