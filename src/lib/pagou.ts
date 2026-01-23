import axios from 'axios';

interface PagouPixRequest {
    amount: number;
    notificationUrl?: string;
    referenceId?: string; // ID da doação
    payer?: {
        name: string;
        email: string;
        document?: string;
    };
}

interface PagouPixResponse {
    txid: string;
    qrCode: string; // Base64
    emv: string; // Copia e cola
    expiresAt: string;
}

export class PagouClient {
    private api: any;

    constructor(private apiKey: string, private secretKey: string) {
        // Em produção, isso deveria desencriptar a secretKey se ela viesse encriptada do banco
        // Mas aqui assumimos que quem chama passa a chave "raw"

        this.api = axios.create({
            baseURL: 'https://api.pagou.com/v1', // URL fictícia baseada no contexto
            headers: {
                'Authorization': `Bearer ${this.apiKey}:${this.secretKey}`, // Exemplo de auth
                'Content-Type': 'application/json',
            },
            timeout: 10000,
        });
    }

    async createPix(data: PagouPixRequest): Promise<PagouPixResponse> {
        try {
            const response = await this.api.post('/pix', {
                amount: data.amount, // Pagou espera em centavos? Assumindo float conforme PRD MVP diz "Pix real"
                notification_url: data.notificationUrl,
                reference_id: data.referenceId,
                payer: data.payer,
            });

            return {
                txid: response.data.txid,
                qrCode: response.data.qrcode, // Ajustar conforme resposta real API
                emv: response.data.emv,
                expiresAt: response.data.expires_at,
            };
        } catch (error: any) {
            console.error('Pagou createPix error:', error.response?.data || error.message);
            throw new Error('Falha ao gerar Pix no Pagou');
        }
    }

    // Método simulado para gerar Pix de teste se no ambiente de desenvolvimento e sem credenciais reais
    static mockPix(amount: number): PagouPixResponse {
        return {
            txid: `test_${Math.random().toString(36).substring(7)}`,
            qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            emv: "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540510.005802BR5913StarmannWeb6009Sao Paulo62070503***6304E2CA",
            expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        }
    }
}
