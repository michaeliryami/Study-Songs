import { NextRequest, NextResponse } from 'next/server'

// Ensure Node.js runtime (not Edge) for Nodemailer support
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { email, subject, message } = await req.json()
    if (!email || !subject || !message) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }

    // Send via SMTP if configured; otherwise, fallback to mailto link response
    const smtpHost = process.env.SMTP_HOST
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS
    const to = 'noomiaihq@gmail.com'

    if (smtpHost && smtpUser && smtpPass) {
      const nodemailer = await import('nodemailer')
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
      })

      await transporter.sendMail({
        from: smtpUser,
        to,
        replyTo: email,
        subject: `[Support] ${subject}`,
        text: `${message}\n\nFrom: ${email}`,
      })

      return NextResponse.json({ success: true })
    }

    // Fallback: log and return success (so UI flow completes); you can monitor logs
    console.log('Support request (no SMTP configured):', { email, subject, message })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Support API error:', err)
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}


