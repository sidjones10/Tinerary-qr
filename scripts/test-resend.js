#!/usr/bin/env node

/**
 * Quick Resend deliverability test.
 *
 * Sends a single test email via the Resend API to confirm the API key works
 * and that mail is actually being delivered. Uses raw fetch (no SDK install
 * required).
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx node scripts/test-resend.js [recipient] [fromOverride]
 *
 * Examples:
 *   RESEND_API_KEY=re_xxx node scripts/test-resend.js you@example.com
 *   RESEND_API_KEY=re_xxx node scripts/test-resend.js you@example.com "Tinerary <onboarding@resend.dev>"
 *
 * Notes:
 *   - Default "from" matches production: Tinerary <noreply@tinerary-app.com>.
 *     This only works if that domain is verified in your Resend account.
 *   - If the domain isn't verified yet, pass the Resend test sender as the
 *     3rd arg: "Tinerary <onboarding@resend.dev>" (delivers only to the
 *     Resend account owner's email).
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const recipient = process.argv[2] || process.env.TEST_EMAIL_TO;
const fromEmail = process.argv[3] || 'Tinerary <noreply@tinerary-app.com>';

async function main() {
  if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set.');
    console.error('   Run: RESEND_API_KEY=re_xxx node scripts/test-resend.js you@example.com');
    process.exit(1);
  }
  if (!recipient) {
    console.error('❌ No recipient. Pass one as the first argument.');
    console.error('   Run: RESEND_API_KEY=re_xxx node scripts/test-resend.js you@example.com');
    process.exit(1);
  }

  console.log('📧 Resend test send');
  console.log(`   From: ${fromEmail}`);
  console.log(`   To:   ${recipient}`);
  console.log(`   Key:  ${RESEND_API_KEY.slice(0, 6)}…${RESEND_API_KEY.slice(-2)}\n`);

  const sentAt = new Date().toISOString();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: recipient,
      subject: '🧪 Tinerary Resend test',
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="color:#D4792C;margin:0 0 12px;">Resend is working ✅</h2>
          <p>This is a test email confirming Tinerary's Resend integration can deliver mail.</p>
          <p style="color:#6b7280;font-size:13px;margin-top:20px;">
            From: ${fromEmail}<br>
            To: ${recipient}<br>
            Sent: ${sentAt}
          </p>
        </div>
      `,
    }),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    console.error(`❌ Send failed (HTTP ${res.status})`);
    console.error(JSON.stringify(body, null, 2));
    if (body?.message && /domain is not verified/i.test(body.message)) {
      console.error('\n💡 The "from" domain is not verified in Resend.');
      console.error('   Either verify tinerary-app.com at https://resend.com/domains,');
      console.error('   or re-run with the Resend test sender:');
      console.error(`   RESEND_API_KEY=… node scripts/test-resend.js ${recipient} "Tinerary <onboarding@resend.dev>"`);
    }
    process.exit(1);
  }

  console.log('✅ Accepted by Resend.');
  console.log(`   Email ID: ${body.id}`);
  console.log('\n   Check the inbox (and spam) for the test message,');
  console.log('   and the Resend dashboard → Emails for delivery status.');
}

main().catch((err) => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});
