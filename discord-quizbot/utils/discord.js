import nacl from 'tweetnacl';

/**
 * Discord リクエスト署名検証
 */
export function verifyKey(body, signature, timestamp, publicKey) {
  try {
    const timestampData = new TextEncoder().encode(timestamp);
    const bodyData = new TextEncoder().encode(body);
    const message = new Uint8Array(timestampData.length + bodyData.length);
    message.set(timestampData);
    message.set(bodyData, timestampData.length);
    
    const signatureData = hexToUint8Array(signature);
    const publicKeyData = hexToUint8Array(publicKey);
    
    return nacl.sign.detached.verify(message, signatureData, publicKeyData);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function hexToUint8Array(hex) {
  return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
