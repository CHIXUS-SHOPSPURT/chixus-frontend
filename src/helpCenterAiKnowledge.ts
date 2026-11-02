/**
 * CHIXUS Intelligent Knowledge & Diagnostics Engine for Help Center
 * Answers queries based on Global App State: Settings, Operator ID, Profile, Faults & Scans, and Help Guides.
 * Operates client-side with zero network dependency (100% resilient on Netlify and offline).
 * Explicitly recommends 'Submit a Ticket' to chixus.support@gmail.com for questions outside knowledge.
 */

export interface HelpCenterAppContext {
  userName?: string;
  operatorId?: string;
  userEmail?: string;
  userPhone?: string;
  userLocation?: string;
  userHeadline?: string;
  isIdPublic?: boolean;
  allowAiPermissions?: boolean;
  darkModeTheme?: boolean;
  selectedLanguage?: string;
  emailNotifications?: boolean;
  inAppNotifications?: boolean;
  inspectionsCount?: number;
  faultsCount?: number;
  scanAccuracy?: string;
  recentScanLogs?: Array<{
    id?: string;
    status?: string;
    timestamp?: string;
    accuracy?: string;
  }>;
}

export function getHelpCenterKnowledgeAnswer(
  rawQuery: string,
  fallbackUserName: string = 'Operator',
  context?: HelpCenterAppContext
): string {
  const q = (rawQuery || '').toLowerCase().trim();
  const userName = context?.userName || fallbackUserName || 'Operator';
  const opId = context?.operatorId || 'Pending Node Assignment';
  const opEmail = context?.userEmail || 'Not configured in profile';
  const opPhone = context?.userPhone || 'Not configured in profile';
  const opLocation = context?.userLocation || 'Sector Relay // Nigeria';
  const opHeadline = context?.userHeadline || 'Hardware Diagnostics Operator';
  const isPublic = context?.isIdPublic ?? true;
  const aiAllowed = context?.allowAiPermissions ?? true;
  const currentTheme = context?.darkModeTheme ? 'Dark Mode' : 'Light / White Mode';
  const currentLang = context?.selectedLanguage || 'English (Standard)';
  const inspections = context?.inspectionsCount ?? 0;
  const faults = context?.faultsCount ?? 0;
  const accuracy = context?.scanAccuracy || '99.4%';

  if (!q) {
    return `Hello ${userName}! I am CHIXUS AI, your integrated Technical & Settings Assistant. 

You can ask me about:
• Your Operator ID, profile credentials, and Public/Private visibility
• Optical solder inspection, fault isolation, and IPC-A-610 standards
• All Settings (Themes, Languages, Notifications, 4-digit PIN, Privacy)
• Pricing Tiers, MARIES NLP Memory, and 96-hour Anti-Tamper Locks
• How offline and Netlify static deployments operate seamlessly`;
  }

  // =========================================================================
  // 1. OPERATOR ID, CREDENTIALS, WHO AM I & SECRET ID
  // =========================================================================
  if (
    q.includes('my id') ||
    q.includes('what is my id') ||
    q.includes('my operator id') ||
    q.includes('secret id') ||
    q.includes('node id') ||
    q.includes('hardware id') ||
    q.includes('who am i') ||
    q.includes('my credentials') ||
    q.includes('my details') ||
    q.includes('show id') ||
    q.includes('inside my id') ||
    q.includes('about my id') ||
    q.includes('public id') ||
    q.includes('private id') ||
    q.includes('identification')
  ) {
    return `Hello ${userName}! Here are your official CHIXUS Operator ID & credential records parsed from your live profile:

• Operator ID: ${opId}
• Registered Name: ${userName}
• Specialization: ${opHeadline}
• Node Location: ${opLocation}
• ID Privacy Status: ${isPublic ? 'Public (Visible on Mesh Directory)' : 'Private (Cryptographically masked from public search)'}
• Contact Endpoint: ${opEmail} | ${opPhone}
• AI Permissions: ${aiAllowed ? 'Enabled' : 'Restricted'}

To change your ID visibility between Public and Private:
1. Tap the Settings icon (top menu or Settings drawer).
2. Go to "Security and account access" → "Account information".
3. Toggle "Make My Operator ID Public" on or off.`;
  }

  // =========================================================================
  // 2. FAULTS, SOLDER SCANNING, INSPECTIONS & IPC-A-610
  // =========================================================================
  if (
    q.includes('fault') ||
    q.includes('inspection') ||
    q.includes('solder') ||
    q.includes('bridge') ||
    q.includes('cold joint') ||
    q.includes('tombstone') ||
    q.includes('optical') ||
    q.includes('ipc') ||
    q.includes('accuracy') ||
    q.includes('scan log') ||
    q.includes('how many fault') ||
    q.includes('isolated') ||
    q.includes('conducted') ||
    q.includes('circuit') ||
    q.includes('pcb')
  ) {
    const recentLogsSummary =
      context?.recentScanLogs && context.recentScanLogs.length > 0
        ? `\n\nRecent On-Device Telemetry Logs:\n` +
          context.recentScanLogs
            .slice(0, 3)
            .map((l) => `• [${l.timestamp || 'Recent'}] Status: ${l.status || 'Verified'} | Confidence: ${l.accuracy || '99.2%'}`)
            .join('\n')
        : '';

    return `Hello ${userName}! Here is your real-time Hardware Fault & Optical Inspection telemetry:

• Total Inspections Conducted: ${inspections.toLocaleString()}
• Total Hardware Faults Isolated: ${faults.toLocaleString()}
• Neural Model Accuracy Rating: ${accuracy}
• Standard: IPC-A-610 Class 3 High-Reliability Electronic Assemblies

Primary Fault Categories Isolated by CHIXUS:
1. Solder Bridging: Unintended metallic conductivity shorting adjacent IC pins or SMD solder pads.
2. Cold Solder Joints: Insufficient eutectic wetting or thermal crystallization causing brittle joints and erratic resistance.
3. Tombstoning (Manhattan Effect): Surface tension imbalance lifting one terminal of passive chip components during reflow.
4. Component Lift / Pin Voids: Micro-fractures and insufficient solder fillet contact area on high-density ball grid arrays.${recentLogsSummary}

To run a new scan, navigate to the "INSPECT" tab in the top navigation bar.`;
  }

  // =========================================================================
  // 3. SETTINGS: PASSWORD, 4-DIGIT PIN, THEME, LANGUAGE, NOTIFICATIONS
  // =========================================================================
  if (
    q.includes('password') ||
    q.includes('pin') ||
    q.includes('4 digit') ||
    q.includes('change pass') ||
    q.includes('reset pass')
  ) {
    return `Hello ${userName}! Here is how to update your 4-digit security PIN / password:

1. Open the Settings Drawer from the top menu.
2. Select "Your account" → "Change your password".
3. Enter your current password/PIN, then type your new 4-digit code and confirm it.
4. Tap "Update Password". Your session and local vault will instantly update.`;
  }

  if (
    q.includes('theme') ||
    q.includes('dark mode') ||
    q.includes('light mode') ||
    q.includes('white theme') ||
    q.includes('display') ||
    q.includes('color')
  ) {
    return `Hello ${userName}! Your active display theme is currently: ${currentTheme}.

To customize your theme:
1. Open Settings → "Accessibility, display, and languages" → "Display".
2. Select from Dark Theme, Light/White Theme, or System Default.
3. Your preference is automatically persisted to local storage.`;
  }

  if (
    q.includes('language') ||
    q.includes('translate') ||
    q.includes('french') ||
    q.includes('spanish') ||
    q.includes('arabic') ||
    q.includes('hausa') ||
    q.includes('igbo') ||
    q.includes('yoruba')
  ) {
    return `Hello ${userName}! Your selected language is currently: ${currentLang}.

CHIXUS supports 21 clean international and regional languages:
• Global: English, Spanish, French, German, Portuguese, Italian, Japanese, Korean, Chinese, Russian, Arabic, Hindi
• African Regional: Hausa, Yoruba, Igbo, Swahili, Amharic, Zulu, Afrikaans
• Engineering: Dutch, Swedish

To switch language: Open Settings → "Accessibility, display, and languages" → "Languages" and choose your desired locale.`;
  }

  if (
    q.includes('notification') ||
    q.includes('alert') ||
    q.includes('email alert') ||
    q.includes('toast')
  ) {
    return `Hello ${userName}! Here is how notifications are configured in CHIXUS:

• Dispatch System Email: chixus.system@gmail.com
• Setting Location: Settings → "Notifications" → "Preferences".
• Options:
  1. In-App Security Toasts: Real-time alerts for incoming messages, scans, and node events.
  2. Email Notifications: Security verification codes and system digests sent from chixus.system@gmail.com.`;
  }

  if (
    q.includes('cache') ||
    q.includes('clear message') ||
    q.includes('storage') ||
    q.includes('indexeddb') ||
    q.includes('local memory')
  ) {
    return `Hello ${userName}! CHIXUS uses an offline-first resilient vault powered by IndexedDB and LocalStorage.

• Persistent Retention: All newly sent operator messages, inspection logs, and account credentials are permanently saved so they never disappear when switching tabs or reopening the app.
• Cache Management: If you ever want to clear local temporary buffers, open Settings → "Additional resources" → "Local Cache Maintenance".`;
  }

  // =========================================================================
  // 4. NETLIFY, OFFLINE DEPLOYMENT & VERIFICATION DISPATCH
  // =========================================================================
  if (
    q.includes('netlify') ||
    q.includes('deploy') ||
    q.includes('backend') ||
    q.includes('render') ||
    q.includes('network error') ||
    q.includes('unable to reach') ||
    q.includes('offline') ||
    q.includes('server')
  ) {
    return `Hello ${userName}! Here is how CHIXUS handles Netlify and static deployments:

1. Autonomous On-Device Failover: When deployed on Netlify (which hosts static assets without a live Node server), CHIXUS automatically detects the environment and executes all security verification, code generation, and AI knowledge parsing directly on-device.
2. No Blocking Errors: Registration and verification will never fail with a network error. If a remote backend is unavailable, the on-device verification engine generates your 6-digit verification code, issues a confirmation toast, validates the code, and transitions you smoothly to create your 4-digit password.
3. System Email Architecture:
   • Verification & Notifications: Handled via chixus.system@gmail.com.
   • Help Center & Engineering Inquiries: Handled via chixus.support@gmail.com.`;
  }

  // =========================================================================
  // 5. 96-HOUR ANTI-TAMPER RETENTION LOCK
  // =========================================================================
  if (
    q.includes('96-hour') ||
    q.includes('96 hour') ||
    q.includes('96hr') ||
    q.includes('anti-tamper') ||
    q.includes('tamper lock') ||
    q.includes('retention lock') ||
    q.includes('audit lock') ||
    q.includes('audit window') ||
    q.includes('immutable')
  ) {
    return `Hello ${userName}! Here is everything about the 96-Hour Anti-Tamper Retention Lock:

• Policy Specification: All on-device hardware telemetry, inspection hashes, and operator verification logs cached inside client-side IndexedDB are immutably locked for 96 hours (4 full days).
• Tamper Safeguard: During this active audit window, retrospective purges, overwrites, and manual modifications are strictly blocked.
• Forensics & Reliability: This guarantees tamper-proof digital forensics, ensuring proof of work, solder scan records, and operator credentials cannot be retrospectively altered or fabricated.`;
  }

  // =========================================================================
  // 6. MARIES MULTI-AGENT NLP MEMORY & SESSION SUMMARIES
  // =========================================================================
  if (
    q.includes('marie') ||
    q.includes('session summar') ||
    q.includes('memory') ||
    q.includes('multi-agent') ||
    q.includes('nlp') ||
    q.includes('brain memory') ||
    q.includes('local brain')
  ) {
    return `Hello ${userName}! Here is how Session Summaries & Memory (MARIES) work:

• Multi-Agent Parsing: Every operational session on the CHIXUS platform is automatically parsed and summarized by multi-agent Natural Language Processing (NLP) engines.
• Local Brain Storage: Summaries, circuit diagnostic vectors, and component test logs are indexed directly inside each operator's local AI brain (IndexedDB) for instant, zero-latency recall.
• Community Cross-Referencing: Community technical posts and discussion threads cross-reference these historical MARIES memory tokens to surface past solder bridge anomalies, repair steps, and solutions.`;
  }

  // =========================================================================
  // 7. THE BRAIN & ENTERPRISE CONTRACT BOOKINGS
  // =========================================================================
  if (
    q.includes('the brain') ||
    q.includes('technician booking') ||
    q.includes('contract booking') ||
    q.includes('booking fee') ||
    q.includes('multi-month') ||
    q.includes('booked technician') ||
    q.includes('enterprise booking') ||
    q.includes('booking')
  ) {
    return `Hello ${userName}! Here is how The Brain & Technician Contract Bookings work:

• The Brain: A centralized telemetry dashboard tracking real-time hardware telemetry, module interactions, and optical diagnostic logs. It systematically logs past repairs and senior-verified solutions so users never repeat identical troubleshooting cycles.
• Multi-Month Technician Bookings: Companies and manufacturing facilities booking field technicians for multi-month contracts incur minor administrative booking fees ($30 to $50 / month per technician).
• Independent Quotas: Booked engineers operate outside standard single-seat subscription limits, and total contract expenditures are tracked transparently in the Enterprise billing ledger.`;
  }

  // =========================================================================
  // 8. STAR TIER USAGE ALLOCATIONS & PRICING MATRIX
  // =========================================================================
  if (
    q.includes('pricing') ||
    q.includes('price') ||
    q.includes('cost') ||
    q.includes('tier') ||
    q.includes('quota') ||
    q.includes('how much') ||
    q.includes('rate') ||
    q.includes('scan quota') ||
    q.includes('subscription') ||
    q.includes('attendance') ||
    q.includes('star')
  ) {
    return `Hello ${userName}! Here is the complete Star Tier Usage Allocations & Pricing Matrix:

• ★ (1 Star): 200 Scans / month | 60 Mo Attendance | $5 / month ($25 / year)
• ★★ (2 Stars): 400 Scans / month | 120 Mo Attendance | $10 / month ($120 / year)
• ★★★ (3 Stars): 800 Scans / month | 240 Mo Attendance | $20 / month ($240 / year)
• ★★★★ (4 Stars): 1,600 Scans / month | 480 Mo Attendance | $40 / month ($480 / year)
• ★★★★★ (5 Stars): UNLIMITED Scans | Full Enterprise | $1,000 / year

All tiers include neural solder fault detection, local IndexedDB tamper-evident logs, and access to technical discussion threads.`;
  }

  // =========================================================================
  // 9. SUPPORT, TICKETING & CONTACT US
  // =========================================================================
  if (
    q.includes('ticket') ||
    q.includes('contact') ||
    q.includes('support') ||
    q.includes('feedback') ||
    q.includes('report a problem') ||
    q.includes('report bug') ||
    q.includes('help me') ||
    q.includes('email support')
  ) {
    return `Hello ${userName}! Here is how to contact engineering support or submit a ticket:

• Official Support Inbox: chixus.support@gmail.com
• System Notification Inbox: chixus.system@gmail.com
• Submit a Ticket: Click the "Submit a Ticket" or "Contact Us" button below to open the official ticket form.
• You can specify:
  1. Category: General Support, Hardware Diagnostic Ticket, or Platform Feedback
  2. Subject & Description: Detailed breakdown of the hardware or account symptom
  3. Attachments: Circuit schematics, telemetry logs, or optical solder pictures
Our engineering team reviews all tickets submitted to chixus.support@gmail.com promptly.`;
  }

  // =========================================================================
  // 10. GENERAL OVERVIEW & FALLBACK FOR UNRECOGNIZED TOPICS
  // =========================================================================
  if (
    q === 'hi' ||
    q === 'hello' ||
    q === 'hey' ||
    q.includes('what can you do') ||
    q.includes('who are you')
  ) {
    return `Hello ${userName}! I am CHIXUS AI, your real-time Hardware & Settings Assistant.

I am connected to your live profile (${opId}) and local diagnostic state. I can assist you with:
• Your Operator ID, profile, and security settings
• Optical solder inspection, faults isolated (${faults}), and IPC-A-610 standards
• Settings customization (Themes, Languages, 4-digit PIN, Notifications)
• Pricing matrix, MARIES memory, and Netlify deployment questions

If you need custom engineering assistance, tap "Submit a Ticket" below to message chixus.support@gmail.com.`;
  }

  // Explicit instruction to suggest "Submit a Ticket" if outside knowledge base
  return `Hello ${userName}! This specific query is outside the scope of the CHIXUS Settings, Operator ID records, Fault Diagnostics, and Platform Documentation.

If you have an unlisted technical problem or need direct engineering assistance, please tap "Submit a Ticket" below or send an email to chixus.support@gmail.com so our engineering support team can review your case directly.`;
}
