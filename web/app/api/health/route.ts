import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'eholidayer-web',
    aiProvider: process.env.AI_PROVIDER ?? 'unset',
    allowMock: process.env.ALLOW_MOCK_PROVIDER === 'true'
  });
}
