import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  const { phone, code } = await req.json()
  const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'text',
      text: { body: `Votre code WeddingMood est : ${code}` }
    })
  })
  const data = await res.json()
  return NextResponse.json(data)
}
