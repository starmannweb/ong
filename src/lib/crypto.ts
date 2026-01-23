import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''; // Must be 32 chars

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('ENCRYPTION_KEY must be set and be 32 characters long');
    }
    console.warn('ENCRYPTION_KEY not set or invalid length. Using insecure default for dev.');
}

const getCipherKey = () => {
    // Fallback for dev only
    return ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32);
}

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', getCipherKey(), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decrypt(encrypted: string): string {
    const [ivHex, tagHex, dataHex] = encrypted.split(':');
    if (!ivHex || !tagHex || !dataHex) {
        throw new Error('Invalid encrypted string format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', getCipherKey(), iv);
    decipher.setAuthTag(tag);
    return decipher.update(data) + decipher.final('utf8');
}
