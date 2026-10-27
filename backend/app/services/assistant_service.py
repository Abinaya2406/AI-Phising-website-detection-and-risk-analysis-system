"""Bilingual (Tamil & English) AI Cybersecurity Assistant Service."""
from typing import Dict, Any

class AssistantService:
    """Provides natural language cyber security explanations in English and Tamil."""

    @classmethod
    def answer_query(cls, message: str, language: str = "en") -> Dict[str, Any]:
        text = (message or "").strip().lower()
        lang = language.lower() if language else "en"

        if lang == "ta":
            return cls._handle_tamil_response(text)
        return cls._handle_english_response(text)

    @staticmethod
    def _handle_tamil_response(text: str) -> Dict[str, Any]:
        if any(w in text for w in ["ssl", "https", "பூட்டு"]):
            reply = (
                "### SSL சான்றிதழ் (HTTPS) பற்றிய முக்கிய எச்சரிக்கை:\n"
                "இணையதளத்தில் பச்சை பூட்டு அல்லது HTTPS இருப்பது மட்டுமே அது பாதுகாப்பானது என்பதற்கு உத்தரவாதம் இல்லை!\n"
                "1. **இலவச SSL சான்றிதழ்கள்**: Let's Encrypt மற்றும் Cloudflare போன்ற நிறுவனங்கள் மூலம் ஃபிஷர்களும் 2 நிமிடங்களில் இலவச SSL பெற முடியும்.\n"
                "2. **குறியாக்கம் vs உண்மைத்தன்மை**: HTTPS உங்கள் தரவை வழியில் திருடப்படாமல் குறியாக்கம் (encrypt) மட்டுமே செய்கிறது; ஆனால் அது யாருக்கு செல்கிறது என்பதை சரிபார்ப்பதில்லை.\n"
                "3. **முக்கிய ஆலோசனை**: எப்போதுமே முகவரியின் Domain பெயரை (எ.கா. `paypal.com` vs `paypal-verify-login.cc`) கவனமாக பரிசோதிக்கவும்."
            )
        elif any(w in text for w in ["வங்கி", "கடவுச்சொல்", "தவறு", "click", "கிளிக்"]):
            reply = (
                "### அவசர பாதுகாப்பு நடவடிக்கைகள் (Incident Response Steps):\n"
                "நீங்கள் போலி அல்லது சந்தேகத்திற்குரிய இணைப்பில் கடவுச்சொல் உள்ளிட்டிருந்தால்:\n"
                "1. **உடனடி கடவுச்சொல் மாற்றம்**: உண்மையான இணையதளத்திற்கு நேரடியாகச் சென்று உங்கள் கடவுச்சொல்லை உடனே மாற்றவும்.\n"
                "2. **இருபடி சரிபார்ப்பு (2FA/MFA)**: உங்கள் கணக்கில் 2-Step Verification இயக்கவும் (Authenticator App சிறந்தது).\n"
                "3. **வங்கி கணக்கு முடக்கம்**: வங்கி விவரங்களை உள்ளிட்டிருந்தால், உடனடியாக வங்கி வாடிக்கையாளர் சேவையை அழைத்து கார்டு/UPI ஐ தற்காலிகமாக முடக்கவும்.\n"
                "4. **அமர்வு வெளியேற்றம்**: மற்ற எல்லா சாதனங்களிலிருந்தும் 'Sign out all active sessions' தேர்வு செய்யவும்."
            )
        else:
            reply = (
                "### ஃபிஷிங் வலைத்தள எச்சரிக்கை வழிகாட்டி:\n"
                "- **அவசர எச்சரிக்கைகள்**: 'உங்கள் கணக்கு 24 மணி நேரத்தில் முடக்கப்படும்' போன்ற அவசரப்படுத்தும் வாசகங்களை நம்ப வேண்டாம்.\n"
                "- **போலி முகவரிகள்**: `chase-bank-verify.com` போன்ற உப-டொமைன் அல்லது எழுத்து மாற்றங்களை கவனிக்கவும்.\n"
                "- **உள்நுழைவு படிவங்கள்**: அங்கீகரிக்கப்படாத டொமைனில் உங்கள் கடவுச்சொல் அல்லது OTP-ஐ ஒருபோதும் உள்ளிடாதீர்கள்.\n"
                "- நீங்கள் சந்தேகப்படும் URL முகவரியை PhishGuard முகப்பு ஸ்கேனரில் பரிசோதிக்கவும்!"
            )
        return {"reply": reply, "language": "ta"}

    @staticmethod
    def _handle_english_response(text: str) -> Dict[str, Any]:
        if any(w in text for w in ["ssl", "https", "padlock", "lock"]):
            reply = (
                "### The HTTPS / SSL Misconception in Modern Phishing:\n"
                "A common misconception is that the padlock icon (`https://`) means a website is safe and legitimate.\n"
                "- **Over 83% of phishing websites now utilize valid SSL certificates.** Automated Certificate Authorities (CAs) issue domain validation (DV) certificates without verifying the operator's legal identity.\n"
                "- **Encryption ≠ Legitimacy**: SSL secures the data *in transit* between your browser and the server. If the server belongs to an attacker, your encrypted password goes directly to them.\n"
                "- **Rule of Thumb**: Always inspect the canonical root domain name, not just the presence of the lock icon."
            )
        elif any(w in text for w in ["clicked", "entered", "compromised", "password", "hack"]):
            reply = (
                "### Emergency Incident Response Checklist:\n"
                "If you or an employee entered credentials on a suspected phishing portal:\n"
                "1. **Isolate & Reset Credentials immediately**: Navigate directly to the official platform by typing the true URL and reset your password.\n"
                "2. **Revoke Active Sessions**: Terminate all active OAuth tokens, browser sessions, and connected devices in your security settings.\n"
                "3. **Audit Multi-Factor Authentication**: Verify your 2FA methods haven't been altered or forwarded. Prefer FIDO2/WebAuthn hardware keys over SMS.\n"
                "4. **Notify Your SecOps Team**: Share the full URL, timestamp, and whether credentials or MFA tokens were submitted so firewalls can block the host."
            )
        else:
            reply = (
                "### PhishGuard AI Cyber Threat Intelligence:\n"
                "I can assist you with:\n"
                "- **URL & Domain Verification**: Explaining risk factors, typosquatting variants, and registration anomalies.\n"
                "- **Brand Protection & Defense**: Identifying mimicry of Microsoft 365, PayPal, Chase, Google, and banking portals.\n"
                "- **Incident Remediation**: Guiding swift countermeasures if credentials or tokens were intercepted.\n"
                "- **Bilingual Security Awareness**: Available in both English and Tamil (தமிழ்)."
            )
        return {"reply": reply, "language": "en"}


assistant_service = AssistantService()

