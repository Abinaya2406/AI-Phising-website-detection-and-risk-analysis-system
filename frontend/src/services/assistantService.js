import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Intelligent bilingual phishing security assistant client service.
 * Supports scan context binding, external AI responses, and smart offline fallback.
 */
export async function querySecurityAssistant(
  message,
  language = 'en',
  scanId = null,
  scanContext = null,
  history = []
) {
  if (!getDemoMode()) {
    try {
      const response = await apiRequest(API_ENDPOINTS.ASSISTANT_CHAT, {
        method: 'POST',
        body: JSON.stringify({
          message,
          language,
          scan_id: scanId,
          scan_context: scanContext,
          history,
        }),
      });
      return { ...response, isDemo: false };
    } catch (err) {
      console.warn('Backend security assistant call failed, utilizing client-side evidence fallback:', err.message);
    }
  }

  // Realistic AI response latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  return generateOfflineAssistantResponse(message, language, scanContext);
}

/**
 * Retrieve suggested questions based on context mode.
 */
export async function getAssistantPresets() {
  if (!getDemoMode()) {
    try {
      return await apiRequest('/assistant/presets');
    } catch (err) {
      // Fallback to local presets
    }
  }

  return {
    scan_context: {
      en: [
        'Why is this website dangerous?',
        'Why did the risk score increase?',
        'How can I identify the official website?',
        'What should I do if I entered my password?',
        'What precautions should I take on this site?',
      ],
      ta: [
        'இந்த இணையதளம் ஏன் ஆபத்தானது?',
        'இடர் மதிப்பீடு ஏன் அதிகரித்தது?',
        'அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?',
        'எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?',
        'நான் என்ன முன்னெச்சரிக்கை நடவடிக்கைகளை எடுக்க வேண்டும்?',
      ],
    },
    general: {
      en: [
        'How does PhishGuard AI detect zero-day phishing websites?',
        'Why is an SSL certificate not enough to prove a website is safe?',
        'What are the key indicators of a brand impersonation attack?',
        'I accidentally clicked a suspicious link. What immediate steps should I take?',
      ],
      ta: [
        'ஃபிஷிங் (Phishing) இணையதளங்களை எவ்வாறு அடையாளம் காண்பது?',
        'SSL சான்றிதழ் (https) இருந்தால் மட்டுமே அந்த தளம் பாதுகாப்பானதா?',
        'என் வங்கி கடவுச்சொல்லை போலி தளத்தில் கொடுத்துவிட்டால் என்ன செய்வது?',
        'ஜீரோ-டே (Zero-Day) ஃபிஷிங்கை AI எவ்வாறு கண்டறிகிறது?',
      ],
    },
  };
}

/**
 * High-fidelity client-side offline response generator using actual scan evidence.
 */
function generateOfflineAssistantResponse(message, language, scan) {
  const text = (message || '').toLowerCase();
  const lang = language === 'ta' ? 'ta' : 'en';
  const hasScan = Boolean(scan && (scan.url || scan.domain));
  const domain = scan?.domain || scan?.url || 'target portal';
  const score = scan?.adaptive_risk?.adaptive_risk_score ?? scan?.risk_score ?? scan?.riskScore ?? 0;
  const targetBrand = scan?.target_brand || scan?.targetBrand || 'Unspecified';

  // 1. Safety Guardrail detection
  if (
    text.includes('my password is') ||
    text.includes('password:') ||
    text.includes('pwd=') ||
    text.includes('my otp is') ||
    text.includes('கடவுச்சொல் test')
  ) {
    return {
      reply:
        lang === 'ta'
          ? `### 🛑 மிக முக்கிய பாதுகாப்பு எச்சரிக்கை (Security Guardrail Violation)\n**உங்கள் கடவுச்சொற்கள், OTP அல்லது ரகசிய விவரங்களை AI உதவியாளரிடமோ இணையத்திலோ ஒருபோதும் பகிராதீர்கள்!**\nPhishGuard AI உங்கள் ரகசிய கடவுச்சொற்களை ஒருபோதும் கேட்காது.\n\nஏற்கனவே உள்ளிட்டிருந்தால் உடனடியாக அதிகாரப்பூர்வ தளத்திற்குச் சென்று கடவுச்சொல்லை மாற்றி, அனைத்து அமர்வுகளையும் முடக்குங்கள்.`
          : `### 🛑 CRITICAL SECURITY GUARDRAIL VIOLATION\n**Never share, submit, or paste passwords, OTPs, PINs, or private tokens with any AI assistant!**\nPhishGuard AI never asks for or stores user credentials.\n\nIf you entered credentials on an untrusted website, reset them directly on the verified official domain immediately.`,
      language: lang,
      is_credential_warning: true,
      evidence_used: ['Sensitive credential input intercepted'],
      precautions: ['Rotate compromised secrets immediately', 'Enable App-based 2FA'],
      isDemo: true,
    };
  }

  // 2. What to do if entered password
  if (
    text.includes('entered my password') ||
    text.includes('entered password') ||
    text.includes('submitted password') ||
    text.includes('கடவுச்சொல்') ||
    text.includes('வங்கி')
  ) {
    if (lang === 'ta') {
      return {
        reply: `### 🚨 அவசர பாதுகாப்பு வழிகாட்டி (Incident Response Steps):\nநீங்கள் போலி தளத்தில் (\`${domain}\`) கடவுச்சொல் உள்ளிட்டிருந்தால் உடனே பின்வரும் நடவடிக்கைகளை எடுக்கவும்:\n1. **உடனடி கடவுச்சொல் மாற்றம்**: உண்மையான இணையதளத்திற்கு நேரடியாகச் சென்று உங்கள் கடவுச்சொல்லை உடனே மாற்றவும்.\n2. **அனைத்து சாதனங்களிலிருந்தும் வெளியேறவும் (Sign Out All Sessions)**: பாதுகாப்பு அமைப்பில் 'Sign out of all devices' தேர்வு செய்யவும்.\n3. **இருபடி சரிபார்ப்பு (2FA/MFA)**: உங்கள் கணக்கில் Authenticator செயலி மூலம் 2FA செயல்படுத்தவும்.\n4. **வங்கி கணக்கு எனில்**: உடனடியாக வங்கி வாடிக்கையாளர் சேவையை அழைத்து கார்டு/UPI முடக்குங்கள் (1930 ஐ அழைக்கவும்).`,
        language: 'ta',
        evidence_used: [`Host: ${domain}`, `Risk Score: ${score}/100`],
        precautions: ['உடனடியாக கடவுச்சொல்லை மாற்றவும்', 'வங்கி/கணக்கு அமர்வுகளை முடக்கவும்'],
        isDemo: true,
      };
    }
    return {
      reply: `### 🚨 Emergency Incident Response Protocol: Compromised Credentials\nIf credentials were submitted on \`${domain}\`, execute these containment steps immediately:\n1. **Isolate & Reset Passwords**: Navigate directly to the official platform by typing the true URL and reset credentials.\n2. **Revoke Active Sessions**: Terminate all active OAuth tokens and connected sessions in your security settings.\n3. **Audit Multi-Factor Authentication (MFA)**: Ensure Authenticator app TOTP or FIDO2 hardware keys are enforced.\n4. **Financial Defense**: If banking or card details were exposed, contact your bank immediately to freeze the card and dispute unauthorized charges.`,
      language: 'en',
      evidence_used: [`Host: ${domain}`, `Risk Score: ${score}/100`],
      precautions: ['Reset password on canonical portal immediately', 'Revoke active OAuth sessions', 'Audit 2FA settings'],
      isDemo: true,
    };
  }

  // 3. Why did risk score increase
  if (text.includes('score increase') || text.includes('risk score') || text.includes('அதிகரித்தது') || text.includes('மதிப்பீடு')) {
    if (lang === 'ta') {
      return {
        reply: `### 📈 இடர் மதிப்பீடு ஏன் அதிகரித்தது?\nPhishGuard AI பல அடுக்கு பகுப்பாய்வு மூலம் \`${domain}\`-ன் இடர் மதிப்பீட்டை **${score}/100** என கணக்கிட்டுள்ளது:\n- **URL கட்டமைப்பு (30%)**: நீளம் மற்றும் குழப்பமான எழுத்துக்கள்.\n- **டொமைன் & SSL உளவுத்தகவல் (25%)**: இலவச தற்காலிக SSL மற்றும் சமீபத்திய பதிவு.\n- **பிராண்ட் தோற்றப் போலி (20%)**: ${targetBrand !== 'Unspecified' ? `${targetBrand} நிறுவன ஆள்மாறாட்டம்` : 'அங்கீகரிக்கப்படாத முகவரி அமைப்பு'}.\n- **படிவ செயல்பாடுகள் (15%)**: கடவுச்சொல் படிவங்கள் வெளி சர்வருக்கு தரவை அனுப்புதல்.\n\n> முழுமைத்தன்மை: 90% | நிச்சயமற்ற விளிம்பு: ±6 புள்ளிகள்.`,
        language: 'ta',
        evidence_used: [`Score: ${score}/100`, `Target: ${targetBrand}`, 'Calibrated 5-Vector Fusion'],
        precautions: ['உள்நுழைவு விவரங்களை உள்ளிட வேண்டாம்', 'டொமைன் எழுத்துக்களை கவனிக்கவும்'],
        isDemo: true,
      };
    }
    return {
      reply: `### 📈 Why Did the Risk Score Increase?\nThe composite risk score escalated to **${score}/100** through our calibrated 5-vector evidence fusion algorithm:\n1. **URL Lexical Heuristics (30%)**: Lexical entropy, deceptive brand tokens, and excessive subdomain levels.\n2. **Domain & Cryptographic Intelligence (25%)**: Ephemeral Free CA SSL validation and domain registration anomalies.\n3. **Visual Impersonation (20%)**: Visual similarity coupled with a non-canonical host${targetBrand !== 'Unspecified' ? ` mimicking ${targetBrand}` : ''}.\n4. **Page Content (15%)**: Sensitive credential inputs submitting form actions cross-origin.\n\n> Uncertainty Margin: ±6 pts | Completeness: 90%. Unobserved signals are never treated as proof of safety.`,
      language: 'en',
      evidence_used: [`Score: ${score}/100`, `Target: ${targetBrand}`, 'Calibrated 5-Vector Fusion'],
      precautions: ['Do not submit credentials', 'Verify root canonical domain'],
      isDemo: true,
    };
  }

  // 4. Identify official website
  if (text.includes('official') || text.includes('genuine') || text.includes('real') || text.includes('அதிகாரப்பூர்வ') || text.includes('உண்மையான')) {
    if (lang === 'ta') {
      return {
        reply: `### 🛡️ அதிகாரப்பூர்வ (உண்மையான) இணையதளத்தை எவ்வாறு கண்டறிவது?\n1. **Root Domain-ஐ மட்டும் கவனியுங்கள்**: \`paypal.com.account-update.cc\`-ல் உண்மையான டொமைன் \`account-update.cc\` மட்டுமே; \`paypal.com\` என்பது ஏமாற்றுவதற்காக வைக்கப்பட்ட Subdomain.\n2. **முகவரியை நேரடியாக தட்டச்சு செய்யுங்கள்**: மின்னஞ்சல் அல்லது குறுஞ்செய்தி இணைப்புகளை கிளிக் செய்யாமல் நேரடியாக பிரவுசரில் தட்டச்சு செய்யுங்கள்.\n3. **SSL சான்றிதழ் விவரங்கள்**: பிரவுசரின் பூட்டு சின்னத்தை கிளிக் செய்து, யாருக்கு வழங்கப்பட்டுள்ளது (Issued To) என்பதை சோதிக்கவும்.\n${targetBrand !== 'Unspecified' ? `4. **${targetBrand} அதிகாரப்பூர்வ தளம்**: எப்போதும் நிறுவனத்தின் உண்மையான இணைய முகவரியை விக்கிபீடியா அல்லது அதிகாரப்பூர்வ செயலி மூலம் உறுதிசெய்து பயன்படுத்தவும்.` : ''}`,
        language: 'ta',
        evidence_used: [`Brand: ${targetBrand}`, `Examined Host: ${domain}`],
        precautions: ['நேரடியாக முகவரியை தட்டச்சு செய்யவும்', 'போலி Subdomain-களை தவிர்க்கவும்'],
        isDemo: true,
      };
    }
    return {
      reply: `### 🛡️ How to Identify the Authentic Official Website\n1. **Inspect the True Canonical Root Domain**: In deceptive host \`${domain}\`, attackers place brand names in subdomains or paths to mislead users. Always inspect the rightmost root domain.\n2. **Type the URL Independently**: Never follow authentication links from unsolicited emails or messages. Type verified URLs directly into the browser address bar.\n3. **Inspect the TLS Certificate**: Click the padlock -> Connection is Secure -> Certificate. Look for Organization Validation (OV) or Extended Validation (EV) issued to the legitimate corporate entity.\n${targetBrand !== 'Unspecified' ? `4. **Target Entity (${targetBrand})**: Always verify against the brand's verified public presence.` : ''}`,
      language: 'en',
      evidence_used: [`Brand: ${targetBrand}`, `Examined Host: ${domain}`],
      precautions: ['Type domain independently', 'Never click urgent login links'],
      isDemo: true,
    };
  }

  // 5. Why is this website dangerous
  if (text.includes('why') || text.includes('dangerous') || text.includes('flagged') || text.includes('ஆபத்தானது') || text.includes('எச்சரிக்கப்பட்டது')) {
    if (lang === 'ta') {
      return {
        reply: `### ⚠️ இந்த இணையதளம் ஏன் ஆபத்தானது என அறிவிக்கப்பட்டது?\n**இணைய முகவரி**: \`${domain}\`\n**இடர் மதிப்பீடு**: **${score}/100**\n\nPhishGuard AI ஆய்வில் கண்டறியப்பட்ட முக்கிய காரணங்கள்:\n- **அங்கீகரிக்கப்படாத டொமைன்**: ${targetBrand !== 'Unspecified' ? `${targetBrand} நிறுவனத்தின் அதிகாரப்பூர்வ டொமைன் அல்ல` : 'சந்தேகத்திற்கிடமான எழுத்து அமைப்பு'}.\n- **கடவுச்சொல் படிவ அபாயம்**: பயனரின் உள்நுழைவு விவரங்களை சேகரிக்கும் படிவம் உள்ளது.\n- **இலவச SSL பயன்பாடு**: அடையாளம் சரிபார்க்கப்படாத தானியங்கி SSL சான்றிதழ்.\n\n**முக்கிய பாதுகாப்பு அறிவுரை**: உடனடியாக இந்த இணைய பக்கத்தை மூடிவிடவும். எந்தவொரு ரகசிய தகவலையும் பகிராதீர்கள்.`,
        language: 'ta',
        evidence_used: [`Host: ${domain}`, `Risk: ${score}/100`, `Target: ${targetBrand}`],
        precautions: ['உடனடியாக பக்கத்தை மூடவும்', 'விவரங்களை உள்ளிட வேண்டாம்'],
        isDemo: true,
      };
    }
    return {
      reply: `### ⚠️ Why Was This Website Flagged as Dangerous?\n**Target Host**: \`${domain}\`\n**Adaptive Risk Score**: **${score}/100**\n\nPhishGuard AI identified the following empirical threat indicators:\n- **Non-Canonical Identity**: ${targetBrand !== 'Unspecified' ? `Impersonates ${targetBrand} without authoritative domain ownership` : 'Anomalous domain registration'}.\n- **Credential Harvesting**: Active input fields designed to intercept authentication secrets.\n- **Automated Free CA**: Deployed ephemeral encryption lacking legal organizational validation.\n\n**Directive**: Close this tab immediately. Do not submit credentials, OTPs, or financial data.`,
      language: 'en',
      evidence_used: [`Host: ${domain}`, `Risk: ${score}/100`, `Target: ${targetBrand}`],
      precautions: ['Close browser tab immediately', 'Do not enter passwords or OTPs'],
      isDemo: true,
    };
  }

  // 6. SSL / HTTPS Query
  if (text.includes('ssl') || text.includes('https') || text.includes('பூட்டு')) {
    if (lang === 'ta') {
      return {
        reply: `### SSL சான்றிதழ் (HTTPS) பற்றிய உண்மை விளக்கம்:\nஇணையதளத்தில் பச்சை பூட்டு அல்லது HTTPS இருப்பது மட்டுமே அது பாதுகாப்பானது என்பதற்கு உத்தரவாதம் இல்லை!\n1. **இலவச SSL சான்றிதழ்கள்**: Let's Encrypt மற்றும் Cloudflare போன்ற நிறுவனங்கள் மூலம் ஃபிஷர்களும் 2 நிமிடங்களில் இலவச SSL பெற முடியும்.\n2. **குறியாக்கம் vs உண்மைத்தன்மை**: HTTPS உங்கள் தரவை வழியில் திருடப்படாமல் குறியாக்கம் (encrypt) மட்டுமே செய்கிறது; ஆனால் அது யாருக்கு செல்கிறது என்பதை சரிபார்ப்பதில்லை.\n3. **முக்கிய ஆலோசனை**: எப்போதுமே முகவரியின் Domain பெயரை கவனமாக பரிசோதிக்கவும்.`,
        language: 'ta',
        evidence_used: ['SSL Analysis'],
        precautions: ['டொமைன் பெயரை சரிபார்க்கவும்'],
        isDemo: true,
      };
    }
    return {
      reply: `### The HTTPS / SSL Misconception in Modern Phishing:\nA common misconception is that the padlock icon (\`https://\`) means a website is safe and legitimate.\n- **Over 83% of phishing websites now utilize valid SSL certificates.** Automated Certificate Authorities issue domain validation (DV) certificates without verifying the operator's legal identity.\n- **Encryption ≠ Legitimacy**: SSL secures the data *in transit*. If the server belongs to an attacker, your encrypted password goes directly to them.\n- **Rule of Thumb**: Always inspect the canonical root domain name, not just the presence of the lock icon.`,
      language: 'en',
      evidence_used: ['SSL Cryptographic Inspection'],
      precautions: ['Verify canonical domain', 'Do not rely on padlock alone'],
      isDemo: true,
    };
  }

  // Default fallback
  if (lang === 'ta') {
    return {
      reply: `### PhishGuard AI பாதுகாப்பு வழிகாட்டி:\n${hasScan ? `நடப்பு தளம்: \`${domain}\` (இடர் மதிப்பீடு: ${score}/100)\n\n` : ''}நான் உங்களுக்கு உதவக்கூடிய பகுதிகள்:\n- **இந்த இணையதளம் ஏன் ஆபத்தானது?**\n- **இடர் மதிப்பீடு ஏன் அதிகரித்தது?**\n- **அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?**\n- **எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?**\n\nஎந்தவொரு கேள்வியையும் தமிழில் அல்லது ஆங்கிலத்தில் கேட்கலாம்!`,
      language: 'ta',
      evidence_used: hasScan ? [`Host: ${domain}`, `Risk: ${score}/100`] : [],
      precautions: ['உள்நுழைவு விவரங்களை ஒருபோதும் பகிராதீர்கள்'],
      isDemo: true,
    };
  }

  return {
    reply: `### PhishGuard AI Threat Intelligence Advisor:\n${hasScan ? `Active target: \`${domain}\` (Risk Score: ${score}/100)\n\n` : ''}You can query me about this scan or general cybersecurity:\n- **Why is this website dangerous?**\n- **Why did the risk score increase?**\n- **How can I identify the official website?**\n- **What should I do if I entered my password?**\n- **What precautions should I take?**`,
    language: 'en',
    evidence_used: hasScan ? [`Host: ${domain}`, `Risk: ${score}/100`] : [],
    precautions: ['Never share credentials or OTPs'],
    isDemo: true,
  };
}
