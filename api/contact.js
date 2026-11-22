/**
 * Vercel Serverless Function: /api/contact
 *
 * Implements the contact form endpoint with:
 * - In-memory IP rate limiting (spam protection)
 * - Honeypot detection (spambot protection)
 * - Server-side validation of name, email, subject, and message
 * - Multi-provider email dispatch (Resend, SendGrid, Webhook)
 * - Honest configuration failures when no delivery provider is available
 * - Strict privacy: no logging of message contents or credentials
 */

// Rate limiting state: Map<ip, Array<timestamp>>
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_MESSAGES_PER_WINDOW = parseInt(process.env.CONTACT_RATE_LIMIT || '5', 10);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const activeTimestamps = timestamps.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);

  if (activeTimestamps.length >= MAX_MESSAGES_PER_WINDOW) {
    rateLimitMap.set(ip, activeTimestamps);
    return true;
  }

  activeTimestamps.push(now);
  rateLimitMap.set(ip, activeTimestamps);

  // Periodically clean stale entries
  if (rateLimitMap.size > 1000) {
    for (const [key, tsList] of rateLimitMap.entries()) {
      if (tsList.every(t => now - t >= RATE_LIMIT_WINDOW_MS)) {
        rateLimitMap.delete(key);
      }
    }
  }

  return false;
}

export default async function handler(req, res) {
  // CORS & Methods
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed',
      message: 'Only POST requests are supported.'
    });
  }

  // Client IP extraction
  const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1')
    .toString()
    .split(',')[0]
    .trim();

  // 1. Rate Limiting Check
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'You have sent several messages recently. Please wait a few minutes before sending another.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

    // 2. Honeypot check (hidden field to trap spambots)
    if (body._gotcha || body.website_hp) {
      // Return 200 without sending to silently drop bot submissions
      return res.status(200).json({
        success: true,
        message: 'Your message has been received.'
      });
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.message === 'string' ? body.message.trim() : '';

    // 3. Server-side Validation
    const errors = {};

    if (!name || name.length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (name.length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    if (!email) {
      errors.email = 'Email address is required.';
    } else if (!EMAIL_REGEX.test(email)) {
      errors.email = 'Please provide a valid email address.';
    } else if (email.length > 150) {
      errors.email = 'Email address cannot exceed 150 characters.';
    }

    if (!subject || subject.length < 2) {
      errors.subject = 'Subject must be at least 2 characters.';
    } else if (subject.length > 150) {
      errors.subject = 'Subject cannot exceed 150 characters.';
    }

    if (!message || message.length < 10) {
      errors.message = 'Message must be at least 10 characters.';
    } else if (message.length > 3000) {
      errors.message = 'Message cannot exceed 3,000 characters.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Please correct the highlighted fields.',
        errors
      });
    }

    // Never deliver to the unconfirmed placeholder recipient.
    const recipientEmail = (process.env.CONTACT_RECIPIENT_EMAIL || '').trim();
    if (!recipientEmail || recipientEmail.toLowerCase() === 'abc@gmail.com' || !EMAIL_REGEX.test(recipientEmail)) {
      return res.status(503).json({
        error: 'Contact Not Configured',
        message: 'The contact form is temporarily unavailable because its recipient has not been configured.'
      });
    }

    const hasProvider = Boolean(
      process.env.RESEND_API_KEY?.trim() ||
      process.env.SENDGRID_API_KEY?.trim() ||
      process.env.CONTACT_WEBHOOK_URL?.trim()
    );
    if (!hasProvider) {
      return res.status(503).json({
        error: 'Contact Not Configured',
        message: 'The contact form is temporarily unavailable because email delivery has not been configured.'
      });
    }

    const emailDomain = email.split('@')[1] || 'unknown';

    // 4. Send Message via Configured Provider
    let deliverySuccess = false;
    let providerUsed = 'none';

    // Option A: Resend API
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== '') {
      try {
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'Portfolio Contact <onboarding@resend.dev>';
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipientEmail],
            reply_to: email,
            subject: `[Portfolio Contact] ${subject} - from ${name}`,
            text: `New contact submission from Rafia Gull's portfolio:\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
          })
        });

        if (response.ok) {
          deliverySuccess = true;
          providerUsed = 'Resend';
        } else {
          console.error('[Contact Error] Resend API failed status:', response.status);
        }
      } catch (err) {
        console.error('[Contact Error] Resend request error');
      }
    }

    // Option B: SendGrid API
    if (!deliverySuccess && process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.trim() !== '') {
      try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL || recipientEmail;
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: recipientEmail }] }],
            from: { email: fromEmail, name: 'Portfolio Contact' },
            reply_to: { email, name },
            subject: `[Portfolio Contact] ${subject} - from ${name}`,
            content: [{
              type: 'text/plain',
              value: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`
            }]
          })
        });

        if (response.ok) {
          deliverySuccess = true;
          providerUsed = 'SendGrid';
        } else {
          console.error('[Contact Error] SendGrid API failed status:', response.status);
        }
      } catch (err) {
        console.error('[Contact Error] SendGrid request error');
      }
    }

    // Option C: Generic Webhook Dispatch
    if (!deliverySuccess && process.env.CONTACT_WEBHOOK_URL && process.env.CONTACT_WEBHOOK_URL.trim() !== '') {
      try {
        const response = await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            subject,
            message,
            timestamp: new Date().toISOString()
          })
        });

        if (response.ok) {
          deliverySuccess = true;
          providerUsed = 'Webhook';
        }
      } catch (err) {
        console.error('[Contact Error] Webhook request error');
      }
    }

    // 5. Result Dispatch
    // If a live provider succeeded:
    if (deliverySuccess) {
      console.log(`[Contact Success] Email delivered via ${providerUsed} for sender @${emailDomain}`);
      return res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. Thank you for reaching out!'
      });
    }

    console.error(`[Contact Error] Configured delivery providers failed for sender @${emailDomain}.`);
    return res.status(502).json({
      error: 'Delivery Failed',
      message: 'Your message could not be delivered right now. Your entries are still here; please try again later.'
    });

  } catch (err) {
    console.error('[Contact Error] Unexpected error processing contact form');
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing your message. Please try again later.'
    });
  }
}
