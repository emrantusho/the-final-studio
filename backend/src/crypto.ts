const buf2hex = (buf: ArrayBuffer | ArrayBufferView) => Array.prototype.map.call(new Uint8Array(buf as ArrayBuffer), x => ('00' + x.toString(16)).slice(-2)).join('');
const hex2buf = (hex: string) => new Uint8Array(hex.match(/[\da-f]{2}/gi)!.map(h => parseInt(h, 16))).buffer;
async function getKey(secret: string): Promise<CryptoKey> {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: enc.encode('studio-salt'), iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}
export async function encrypt(secret: string, plaintext: string): Promise<{ encrypted_key_hex: string, iv_hex: string }> {
    const key = await getKey(secret); const iv = crypto.getRandomValues(new Uint8Array(12)); const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, enc.encode(plaintext));
    return { encrypted_key_hex: buf2hex(encrypted), iv_hex: buf2hex(iv) };
}
export async function decrypt(secret: string, encrypted_key_hex: string, iv_hex: string): Promise<string> {
    const key = await getKey(secret); const iv = hex2buf(iv_hex); const encryptedData = hex2buf(encrypted_key_hex);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv }, key, encryptedData);
    return new TextDecoder().decode(decrypted);
}
