import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PagouClient } from '@/lib/pagou';
import { decrypt } from '@/lib/crypto';
import { v4 as uuidv4 } from 'uuid'; // Precisaria instalar, mas vou usar randomUUID do node

interface CreateDonationRequest {
    campaignId: string;
    donorName: string;
    donorEmail: string;
    donorDocument?: string;
    donorPhone?: string;
    amount: number;
    isAnonymous?: boolean;
}

export async function POST(req: NextRequest) {
    try {
        const body: CreateDonationRequest = await req.json();

        // Validação básica
        if (!body.campaignId || !body.amount || !body.donorEmail || !body.donorName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Buscar Campanha e Organização
        const campaign = await prisma.campaign.findUnique({
            where: { id: body.campaignId },
            include: { organization: true }
        });

        if (!campaign) {
            return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        }

        if (campaign.status !== 'ACTIVE' && process.env.NODE_ENV === 'production') {
            // Em dev permite testar
            return NextResponse.json({ error: 'Campaign is not active' }, { status: 400 });
        }

        const org = campaign.organization;

        // 2. Preparar Cliente Pagou
        let pagouResponse;

        // Verificar chaves
        if (org.pagouApiKey && org.pagouSecretKey) {
            try {
                const secretKey = decrypt(org.pagouSecretKey);
                const pagou = new PagouClient(org.pagouApiKey, secretKey);

                // 3. Criar Pix no Pagou
                // Precisamos criar a doação antes para ter o ID? 
                // Pagou pede reference_id. Sim, melhor criar primeiro como PENDING.

                // Gerar idempotency key
                const idempotencyKey = crypto.randomUUID();

                const donation = await prisma.donation.create({
                    data: {
                        campaignId: campaign.id,
                        donorName: body.donorName,
                        donorEmail: body.donorEmail,
                        donorDocument: body.donorDocument,
                        donorPhone: body.donorPhone,
                        amount: body.amount,
                        isAnonymous: body.isAnonymous || false,
                        status: 'PENDING',
                        idempotencyKey,
                    }
                });

                const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

                pagouResponse = await pagou.createPix({
                    amount: body.amount,
                    referenceId: donation.id,
                    notificationUrl: `${baseUrl}/api/webhooks/pagou`,
                    payer: {
                        name: body.donorName,
                        email: body.donorEmail,
                        document: body.donorDocument
                    }
                });

                // 4. Atualizar Doação com dados do Pix
                const updatedDonation = await prisma.donation.update({
                    where: { id: donation.id },
                    data: {
                        pagouTxId: pagouResponse.txid,
                        pagouQrCode: pagouResponse.qrCode,
                        pagouEmv: pagouResponse.emv,
                        pagouExpiresAt: new Date(pagouResponse.expiresAt),
                    }
                });

                return NextResponse.json({
                    id: updatedDonation.id,
                    status: updatedDonation.status,
                    amount: updatedDonation.amount,
                    pix: {
                        qrCode: updatedDonation.pagouQrCode,
                        emv: updatedDonation.pagouEmv,
                        expiresAt: updatedDonation.pagouExpiresAt,
                    }
                }, { status: 201 });

            } catch (error: any) {
                console.error('Error creating Pix:', error);
                // Se falhou no Pagou, a doação fica PENDING (ou podemos marcar FAILED)
                return NextResponse.json({ error: 'Payment gateway error' }, { status: 502 });
            }
        } else {
            // Modo Sandbox/Mock se não tiver chaves
            // Apenas cria a doação mockada
            const idempotencyKey = crypto.randomUUID();
            const mockPix = PagouClient.mockPix(body.amount);

            const donation = await prisma.donation.create({
                data: {
                    campaignId: campaign.id,
                    donorName: body.donorName,
                    donorEmail: body.donorEmail,
                    amount: body.amount,
                    status: 'PENDING',
                    idempotencyKey,
                    pagouTxId: mockPix.txid,
                    pagouQrCode: mockPix.qrCode,
                    pagouEmv: mockPix.emv,
                    pagouExpiresAt: new Date(mockPix.expiresAt),
                }
            });

            return NextResponse.json({
                id: donation.id,
                status: donation.status,
                amount: donation.amount,
                pix: {
                    qrCode: mockPix.qrCode,
                    emv: mockPix.emv,
                    expiresAt: mockPix.expiresAt,
                },
                warning: 'MOCK MODE - Configure keys in Organization'
            }, { status: 201 });
        }

    } catch (error: any) {
        console.error('Donation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
