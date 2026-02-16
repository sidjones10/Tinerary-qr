#!/usr/bin/env node

/**
 * Bulk Email Script: Send "What's New" emails to all users
 *
 * Usage:
 *   node scripts/send-bulk-email.js             # Send to all users
 *   node scripts/send-bulk-email.js --dry-run   # Preview without sending
 *   node scripts/send-bulk-email.js --limit 5   # Send to first 5 users
 */

const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=');
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnv();

const { Resend } = require('resend');

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://tinerary-app.com';
const FROM_EMAIL = 'Tinerary <noreply@tinerary-app.com>';

async function sendWhatsNewEmail(email, name) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "See what's new on Tinerary!",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #F97316 0%, #EC4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px; color: white; }
          .content { padding: 30px 20px; background: #f9fafb; border-radius: 12px; margin-top: 20px; }
          .feature-box { background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #F97316; }
          .button { display: inline-block; background: #F97316; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; margin-top: 20px; font-weight: 600; }
          .footer { text-align: center; color: #6b7280; margin-top: 30px; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>What's New on Tinerary</h1>
          </div>
          <div class="content">
            <p>Hi ${name || 'there'}!</p>

            <p>We've been busy making Tinerary even better for you. Here's what's new:</p>

            <div class="feature-box">
              <h3 style="margin-top: 0;">Enhanced Event Planning</h3>
              <p style="margin-bottom: 0;">Create beautiful itineraries with interactive maps, photo galleries, and detailed schedules.</p>
            </div>

            <div class="feature-box">
              <h3 style="margin-top: 0;">Smart Reminders</h3>
              <p style="margin-bottom: 0;">Never miss an event with countdown reminders at 5 days, 2 days, 1 day, and 2 hours before your events.</p>
            </div>

            <div class="feature-box">
              <h3 style="margin-top: 0;">Social Features</h3>
              <p style="margin-bottom: 0;">Follow friends, share events, and collaborate on trip planning together.</p>
            </div>

            <div class="feature-box">
              <h3 style="margin-top: 0;">Expense Tracking</h3>
              <p style="margin-bottom: 0;">Keep track of trip costs and split expenses easily with your travel companions.</p>
            </div>

            <p style="margin-top: 25px;">We'd love to see what you're planning next!</p>

            <center>
              <a href="${APP_URL}/" class="button">Explore Tinerary</a>
            </center>
          </div>
          <div class="footer">
            <p>Happy planning!<br>The Tinerary Team</p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  return result;
}

async function main() {
  console.log('📧 Tinerary Bulk Email Script\n');

  // Parse arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitIndex = args.indexOf('--limit');
  const limit = limitIndex !== -1 ? parseInt(args[limitIndex + 1], 10) : null;

  // Check for required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Please ensure the following environment variables are set:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!resendApiKey) {
    console.error('❌ Error: Missing RESEND_API_KEY');
    console.error('Please set the RESEND_API_KEY environment variable');
    process.exit(1);
  }

  console.log('✅ Environment variables loaded');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (no emails will be sent)' : 'LIVE'}`);
  if (limit) {
    console.log(`   Limit: ${limit} users`);
  }
  console.log('');

  try {
    // Import Supabase client
    const { createClient } = require('@supabase/supabase-js');

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Connected to Supabase\n');

    // Fetch all users with email notifications enabled
    let query = supabase
      .from('profiles')
      .select('id, email, name, username, email_notifications')
      .eq('email_notifications', true)
      .not('email', 'is', null);

    if (limit) {
      query = query.limit(limit);
    }

    const { data: users, error: fetchError } = await query;

    if (fetchError) {
      console.error('❌ Failed to fetch users:', fetchError.message);
      process.exit(1);
    }

    if (!users || users.length === 0) {
      console.log('ℹ️  No users to send emails to (no users with email_notifications enabled)');
      process.exit(0);
    }

    console.log(`📋 Found ${users.length} users with email notifications enabled\n`);

    if (dryRun) {
      console.log('🔍 DRY RUN - Users who would receive emails:\n');
      users.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.email} (${user.name || user.username || 'no name'})`);
      });
      console.log('\nRun without --dry-run to send emails.');
      process.exit(0);
    }

    // Send emails
    const results = {
      sent: 0,
      failed: 0,
      errors: []
    };

    console.log('📤 Sending emails...\n');

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (!user.email) continue;

      const name = user.name || user.username || undefined;

      try {
        const result = await sendWhatsNewEmail(user.email, name);

        if (result.error) {
          results.failed++;
          results.errors.push({ email: user.email, error: result.error.message });
          console.log(`   ❌ ${i + 1}/${users.length}: ${user.email} - ${result.error.message}`);
        } else {
          results.sent++;
          console.log(`   ✅ ${i + 1}/${users.length}: ${user.email}`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push({ email: user.email, error: err.message });
        console.log(`   ❌ ${i + 1}/${users.length}: ${user.email} - ${err.message}`);
      }

      // Small delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total users: ${users.length}`);
    console.log(`   Sent: ${results.sent}`);
    console.log(`   Failed: ${results.failed}`);
    console.log('='.repeat(50));

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      results.errors.forEach(err => {
        console.log(`   - ${err.email}: ${err.error}`);
      });
    }

    console.log('\n✨ Done!\n');

  } catch (error) {
    console.error('\n❌ Script failed with error:', error.message);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
