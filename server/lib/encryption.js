import { secretbox, randomBytes } from 'tweetnacl';
import { encodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

const { nonceLength, keyLength } = secretbox;
const Nonce = () => randomBytes(nonceLength);

export const generateKey = () => encodeBase64(randomBytes(keyLength));

export const encrypt = (buff, key) => {
  const keyUint8Array = decodeBase64(key);

  const nonce = Nonce();
  const box = secretbox(buff, nonce, keyUint8Array);

  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);

  return Buffer.from(fullMessage);
};

export const decrypt = (buffWithNonce, key) => {
  const keyUint8Array = decodeBase64(key);
  const nonce = buffWithNonce.slice(0, nonceLength);
  const message = buffWithNonce.slice(nonceLength, buffWithNonce.length);

  const decrypted = secretbox.open(message, nonce, keyUint8Array);

  if (!decrypted) {
    throw new Error('Could not decrypt message');
  }

  return encodeUTF8(decrypted);
};
