import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Configuração
const MAX_TIMESTAMP_DIFF = 300; // 5 minutos (300 segundos)

interface PagouWebhookPayload {
    event: 'qrcode.completed' | 'qrcode.refunded' | 'qrcode.expired';
    data: {
        txid: string;
        amount: number;
        paidAt?: string;
        refundedAt?: string;
    };
}

export async function POST(req: NextRequest) {
    try {
        const signature = req.headers.get('x-pagou-signature');
        const timestamp = req.headers.get('x-pagou-timestamp');

        if (!signature || !timestamp) {
            return NextResponse.json({ error: 'Missing headers' }, { status: 401 });
        }

        // 1. Anti-replay (Timestamp verification)
        const webhookTime = parseInt(timestamp, 10);
        const currentTime = Math.floor(Date.now() / 1000);

        if (isNaN(webhookTime) || Math.abs(currentTime - webhookTime) > MAX_TIMESTAMP_DIFF) {
            return NextResponse.json({ error: 'Timestamp expired or invalid' }, { status: 401 });
        }

        const payloadText = await req.text();
        let body: PagouWebhookPayload;

        try {
            body = JSON.parse(payloadText);
        } catch {
            return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
        }

        // Buscar a organização correta para validar a assinatura
        // O Webhook do Pagou deve enviar algum identificador da conta ou a gente busca pela txid da doação
        // Assumindo que o txid está vinculado a uma doação e a doação tem uma campanha que tem uma organização.
        // Estratégia: Buscar Donation pelo pagouTxId

        const donation = await prisma.donation.findUnique({
            where: { pagouTxId: body.data.txid },
            include: {
                campaign: {
                    include: {
                        organization: true
                    }
                }
            }
        });

        if (!donation) {
            // Doação não encontrada, pode ser evento atrasado ou erro.
            // Retornar 200 para não travar o webhook do Pagou, mas logar erro.
            console.warn(`Webhook received for unknown txid: ${body.data.txid}`);
            return NextResponse.json({ status: 'ignored_unknown_txid' });
        }

        const organization = donation.campaign.organization;
        const webhookSecret = organization.pagouWebhookSecret;

        if (!webhookSecret) {
            console.error(`Organization ${organization.id} has no webhook secret`);
            return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
        }

        // 2. Validação da Assinatura HMAC-SHA256
        const expectedSig = crypto
            .createHmac('sha256', webhookSecret)
            .update(`${timestamp}.${payloadText}`)
            .digest('hex');

        // Timing-safe comparison
        const sigBuffer = Buffer.from(signature.replace('sha256=', ''));
        const expectedBuffer = Buffer.from(expectedSig);

        if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 3. Idempotência
        const idempotencyKey = `webhook:${body.event}:${body.data.txid}`;

        const existingLog = await prisma.webhookLog.findUnique({
            where: { idempotencyKey }
        });

        if (existingLog && existingLog.processed) {
            return NextResponse.json({ status: 'already_processed' });
        }

        // 4. Processamento
        // Salvar log e atualizar doação em transação
        await prisma.$transaction(async (tx) => {
            // Registrar/Atualizar Log
            await tx.webhookLog.upsert({
                where: { idempotencyKey },
                create: {
                    organizationId: organization.id,
                    event: body.event,
                    payload: body as any, // json
                    headers: { signature, timestamp } as any,
                    signatureValid: true,
                    processed: true,
                    processedAt: new Date(),
                    idempotencyKey
                },
                update: {
                    processed: true,
                    processedAt: new Date()
                }
            });

            // Atualizar Doação
            if (body.event === 'qrcode.completed') {
                if (donation.status !== 'COMPLETED') {
                    await tx.donation.update({
                        where: { id: donation.id },
                        data: {
                            status: 'COMPLETED',
                            paidAt: new Date(body.data.paidAt || Date.now()),
                        }
                        // TODO: Disparar criação de recibo aqui ou via evento
                    });
                }
            } else if (body.event === 'qrcode.refunded') {
                await tx.donation.update({
                    where: { id: donation.id },
                    data: {
                        status: 'REFUNDED',
                        refundedAt: new Date(body.data.refundedAt || Date.now()),
                    }
                });
                // Invalidar recibo se existir
            }
        });

        return NextResponse.json({ status: 'processed' });

    } catch (error: any) {
        console.error('Webhook error:', error);
        // Em caso de erro interno, retornar 500 faz o Pagou tentar de novo later
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
