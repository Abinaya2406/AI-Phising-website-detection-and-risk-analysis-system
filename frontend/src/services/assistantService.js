import { apiRequest, getDemoMode } from './api';
import { API_ENDPOINTS } from '../utils/constants';

/**
 * Intelligent bilingual phishing security assistant logic
 */
export async function querySecurityAssistant(message, language = 'en') {
  if (!getDemoMode()) {
    try {
      const response = await apiRequest(API_ENDPOINTS.ASSISTANT_CHAT, {
        method: 'POST',
        body: JSON.stringify({ message, language }),
      });
      return { ...response, isDemo: false };
    } catch (err) {
      console.warn('Backend security assistant failed, using smart offline response:', err.message);
    }
  }

  // Realistic AI response latency
  await new Promise((resolve) => setTimeout(resolve, 900));

  const text = message.toLowerCase();

  if (language === 'ta') {
    // Tamil responses
    if (text.includes('ssl') || text.includes('பூட்டு') || text.includes('https')) {
      return {
        reply: `### SSL சான்றிதழ் (HTTPS) பற்றிய உண்மை விளக்கம்:
இணையதளத்தில் பச்சை பூட்டு அல்லது HTTPS இருப்பது மட்டுமே அது பாதுகாப்பானது என்பதற்கு உத்தரவாதம் இல்லை!
1. **இலவச SSL சான்றிதழ்கள்**: Let's Encrypt மற்றும் Cloudflare போன்ற நிறுவனங்கள் மூலம் ஃபிஷர்களும் 2 நிமிடங்களில் இலவச SSL பெற முடியும்.
2. **குறியாக்கம் vs உண்மைத்தன்மை**: HTTPS உங்கள் தரவை வழியில் திருடப்படாமல் குறியாக்கம் (encrypt) மட்டுமே செய்கிறது; ஆனால் அது யாருக்கு செல்கிறது என்பதை சரிபார்ப்பதில்லை.
3. **முக்கிய ஆலோசனை**: எப்போதுமே முகவரியின் Domain பெயரை (எ.கா. \`paypal.com\` vs \`paypal-verify-login.cc\`) கவனமாக பரிசோதிக்கவும்.`,
        isDemo: true,
      };
    }

    if (text.includes('வங்கி') || text.includes('கடவுச்சொல்') || text.includes('தவறு') || text.includes('click') || text.includes('கிளிக்')) {
      return {
        reply: `### அவசர பாதுகாப்பு நடவடிக்கைகள் (Incident Response Steps):
நீங்கள் போலி அல்லது சந்தேகத்திற்குரிய இணைப்பில் கடவுச்சொல் உள்ளிட்டிருந்தால்:
1. **உடனடி கடவுச்சொல் மாற்றம்**: உண்மையான இணையதளத்திற்கு நேரடியாகச் சென்று உங்கள் கடவுச்சொல்லை உடனே மாற்றவும்.
2. **இருபடி சரிபார்ப்பு (2FA/MFA)**: உங்கள் கணக்கில் 2-Step Verification இயக்கவும் (SMS அல்லாமல் Authenticator App சிறந்தது).
3. **வங்கி கணக்கு முடக்கம்**: வங்கி விவரங்களை உள்ளிட்டிருந்தால், உடனடியாக வங்கி வாடிக்கையாளர் சேவையை அழைத்து கார்டு/UPI ஐ தற்காலிகமாக முடக்கவும்.
4. **அமர்வு வெளியேற்றம்**: மற்ற எல்லா சாதனங்களிலிருந்தும் "Sign out all active sessions" தேர்வு செய்யவும்.`,
        isDemo: true,
      };
    }

    return {
      reply: `### ஃபிஷிங் வலைத்தள எச்சரிக்கை வழிகாட்டி:
- **அவசர எச்சரிக்கைகள்**: "உங்கள் கணக்கு 24 மணி நேரத்தில் முடக்கப்படும்" போன்ற அவசரப்படுத்தும் வாசகங்களை நம்ப வேண்டாம்.
- **போலி முகவரிகள்**: \`chase-bank-verify.com\` போன்ற உப-டொமைன் அல்லது எழுத்து மாற்றங்களை கவனிக்கவும்.
- **உள்நுழைவு படிவங்கள்**: அங்கீகரிக்கப்படாத டொமைனில் உங்கள் கடவுச்சொல் அல்லது OTP-ஐ ஒருபோதும் உள்ளிடாதீர்கள்.
- நீங்கள் சந்தேகப்படும் URL முகவரியை PhishGuard முகப்பு ஸ்கேனரில் பரிசோதிக்கவும்!`,
      isDemo: true,
    };
  }

  // English responses
  if (text.includes('ssl') || text.includes('https') || text.includes('padlock')) {
    return {
      reply: `### The HTTPS / SSL Misconception in Modern Phishing:
A common misconception is that the padlock icon (\`https://\`) means a website is safe and legitimate.
- **Over 83% of phishing websites now utilize valid SSL certificates.** Automated Certificate Authorities (CAs) like Let's Encrypt and ZeroSSL issue domain validation (DV) certificates without verifying the operator's legal identity.
- **Encryption ≠ Legitimacy**: SSL secures the data *in transit* between your browser and the server. If the server belongs to an attacker, your encrypted password goes directly to them.
- **Rule of Thumb**: Always inspect the canonical root domain name, not just the presence of the lock icon.`,
      isDemo: true,
    };
  }

  if (text.includes('clicked') || text.includes('entered') || text.includes('compromised') || text.includes('password') || text.includes('hack')) {
    return {
      reply: `### Emergency Incident Response Checklist:
If you or an employee entered credentials on a suspected phishing portal:
1. **Isolate & Reset Credentials immediately**: Navigate directly to the official platform by typing the true URL and reset your password.
2. **Revoke Active Sessions**: Terminate all active OAuth tokens, browser sessions, and connected devices in your security settings.
3. **Audit Multi-Factor Authentication**: Verify your 2FA methods haven't been altered or forwarded. Prefer FIDO2/WebAuthn hardware keys over SMS.
4. **Notify Your SecOps Team**: Share the full URL, timestamp, and whether credentials or MFA tokens were submitted so firewalls can block the host.`,
      isDemo: true,
    };
  }

  if (text.includes('zero-day') || text.includes('ai') || text.includes('detect') || text.includes('how')) {
    return {
      reply: `### How PhishGuard AI Detects Zero-Day Phishing:
Traditional blocklists (like Google Safe Browsing or PhishTank) suffer from a **12-to-36 hour detection lag**, while phishing sites often operate for under 4 hours.
PhishGuard AI overcomes this via:
- **Heuristic Lexical NLP**: Analyzing string entropy, homoglyph variations, brand keyword proximity, and uncharacteristic path depths.
- **Visual Siamese Deep Learning**: Headless browser screenshot comparison matching visual layouts and logos against genuine enterprise assets.
- **DOM & Form Action Verification**: Examining whether credential fields POST sensitive data to discordant external hosts.
- **Explainable AI (XAI)**: Breaking down the exact SHAP and LIME risk weights in real time.`,
      isDemo: true,
    };
  }

  return {
    reply: `### PhishGuard AI Cyber Threat Intelligence:
I can assist you with:
- **URL & Domain Verification**: Explaining risk factors, typosquatting variants, and registration anomalies.
- **Brand Protection & Defense**: Identifying mimicry of Microsoft 365, PayPal, Chase, Google, and banking portals.
- **Incident Remediation**: Guiding swift countermeasures if credentials or tokens were intercepted.
- **Bilingual Security Awareness**: Available in both English and Tamil (தமிழ்).

Try asking about SSL validity, what to do if you clicked a link, or how zero-day phishing is detected!`,
    isDemo: true,
  };
}

