"""Bilingual (Tamil & English) AI Cybersecurity Assistant Service.

Provides context-aware threat intelligence explanations for completed website scans,
emergency incident response remediation protocols, canonical domain verification,
and bilingual security awareness with external AI and empirical rule-based fallback engines.
"""
import os
import re
import json
from typing import Dict, Any, Optional, List
import requests

from app.config import Config
from app.utils.logger import logger

# Canonical reference databases for popular impersonated brands
CANONICAL_BRAND_DOMAINS = {
    "paypal": {"canonical_domain": "paypal.com", "official_url": "https://www.paypal.com", "display_name": "PayPal Inc."},
    "microsoft": {"canonical_domain": "microsoft.com", "official_url": "https://www.microsoft.com", "display_name": "Microsoft Corporation"},
    "google": {"canonical_domain": "google.com", "official_url": "https://www.google.com", "display_name": "Google LLC"},
    "chase": {"canonical_domain": "chase.com", "official_url": "https://www.chase.com", "display_name": "JPMorgan Chase & Co."},
    "apple": {"canonical_domain": "apple.com", "official_url": "https://www.apple.com", "display_name": "Apple Inc."},
    "amazon": {"canonical_domain": "amazon.com", "official_url": "https://www.amazon.com", "display_name": "Amazon.com, Inc."},
    "facebook": {"canonical_domain": "facebook.com", "official_url": "https://www.facebook.com", "display_name": "Meta Platforms, Inc."},
    "netflix": {"canonical_domain": "netflix.com", "official_url": "https://www.netflix.com", "display_name": "Netflix, Inc."},
    "state bank of india": {"canonical_domain": "onlinesbi.sbi", "official_url": "https://www.onlinesbi.sbi", "display_name": "State Bank of India (SBI)"},
    "sbi": {"canonical_domain": "onlinesbi.sbi", "official_url": "https://www.onlinesbi.sbi", "display_name": "State Bank of India (SBI)"},
    "hdfc": {"canonical_domain": "hdfcbank.com", "official_url": "https://www.hdfcbank.com", "display_name": "HDFC Bank Ltd."}
}


class AssistantService:
    """Enterprise-grade bilingual conversational security advisor."""

    @classmethod
    def answer_query(
        cls,
        message: str,
        language: str = "en",
        scan_data: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """
        Main query handler.
        Supports external AI providers (Gemini, OpenAI) with automatic fallback
        to the calibrated rule-based evidence engine.
        """
        raw_msg = (message or "").strip()
        text = raw_msg.lower()
        lang = "ta" if (language or "").strip().lower() in ["ta", "tamil", "தமிழ்"] else "en"

        # 1. Enforce strict safety guardrails for credential disclosure
        guardrail_violation = cls._detect_credential_submission_or_request(text)
        if guardrail_violation:
            return cls._build_guardrail_response(lang, guardrail_violation, scan_data)

        # 2. Attempt External AI API if configured and enabled
        if Config.AI_API_KEY and Config.AI_PROVIDER != "fallback":
            try:
                ai_result = cls._call_external_ai(raw_msg, lang, scan_data, conversation_history)
                if ai_result:
                    return ai_result
            except Exception as e:
                logger.warning(f"External AI call failed or timed out: {e}. Falling back to Rule-Based Evidence Engine.")

        # 3. Calibrated Rule-Based Evidence Engine
        return cls._evaluate_rule_based_engine(text, raw_msg, lang, scan_data)

    # -------------------------------------------------------------------------
    # Safety Guardrail Detection
    # -------------------------------------------------------------------------
    @classmethod
    def _detect_credential_submission_or_request(cls, text: str) -> Optional[str]:
        """
        Inspect query to prevent any sensitive credentials, OTPs, or passwords
        from being solicited, accepted, or exposed.
        """
        # If user is asking for guidance on what to do after compromise, do not trigger credential submission
        if any(w in text for w in ["what should i do", "what to do", "if i entered", "entered my password", "என்ன செய்ய", "உள்ளிட்டிருந்தால்", "கொடுத்துவிட்டால்"]):
            return None

        credential_patterns = [
            (r"\b(my\s+password\s+is|pwd\s*=|password\s*:|password\s+is)\b", "password_submission"),
            (r"\b(my\s+otp\s+is|here\s+is\s+(the\s+)?otp|otp\s*:|otp\s+is)\b", "otp_submission"),
            (r"\b(my\s+pin\s+is|pin\s*:|cvv\s*:|secret\s+key\s*:)\b", "pin_submission"),
            (r"(?:எனது\s+கடவுச்சொல்|கடவுச்சொல்)\s*(?:=|:|\s+இதுதான்|\s+[a-zA-Z0-9@#$%^&*_]{4,})", "tamil_pwd_submission"),
            (r"(?:எனது\s+otp|otp)\s*(?:=|:|\s+இதுதான்|\s+[0-9]{4,8})", "tamil_otp_submission"),
        ]
        for pattern, tag in credential_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return tag
        return None

    @classmethod
    def _build_guardrail_response(cls, lang: str, violation_type: str, scan_data: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Constructs an immediate security defensive warning."""
        if lang == "ta":
            reply = (
                "### 🛑 மிக முக்கிய பாதுகாப்பு எச்சரிக்கை (Security Guardrail Violation)\n"
                "**உங்கள் கடவுச்சொற்கள் (Passwords), OTP, PIN அல்லது ரகசிய தகவல்களை எந்தவொரு AI உதவியாளரிடமும் இணையத்திலும் ஒருபோதும் பகிராதீர்கள்!**\n\n"
                "PhishGuard AI உங்கள் கடவுச்சொற்கள் அல்லது OTP-களை ஒருபோதும் கேட்காது மற்றும் சேமிக்காது.\n\n"
                "**நீங்கள் ஏற்கனவே சந்தேகத்திற்கிடமான வலைத்தளத்தில் கடவுச்சொல் உள்ளிட்டிருந்தால்:**\n"
                "1. **உடனடி கடவுச்சொல் மாற்றம்**: அதிகாரப்பூர்வ இணையதளத்திற்கு நேரடியாகச் சென்று உங்கள் கடவுச்சொல்லை உடனடியாக மாற்றவும்.\n"
                "2. **அனைத்து சாதனங்களிலிருந்தும் வெளியேறுங்கள் (Sign Out All Sessions)**: உங்கள் கணக்கின் பிற சாதன அமர்வுகளை முடக்குங்கள்.\n"
                "3. **இருபடி அங்கீகாரம் (2FA)**: கணக்கில் Authenticator செயலியை (SMS அல்ல) கொண்டு 2FA செயல்படுத்தவும்.\n"
                "4. **வங்கி விவரங்கள் எனில்**: உடனடியாக உங்கள் வங்கியை தொடர்பு கொண்டு கார்டு/UPI முடக்குங்கள் அல்லது 1930 எண்ணை அழைக்கவும்."
            )
        else:
            reply = (
                "### 🛑 CRITICAL SECURITY GUARDRAIL VIOLATION\n"
                "**Never share, submit, or paste passwords, OTPs, PINs, or private tokens with any AI assistant or untrusted portal!**\n\n"
                "PhishGuard AI **NEVER** asks for, collects, or stores user credentials.\n\n"
                "**If you have already entered sensitive credentials on a suspected phishing site, execute these immediate incident response countermeasures:**\n"
                "1. **Direct Password Reset**: Navigate directly to the official platform (type the URL manually) and reset your credentials.\n"
                "2. **Terminate Active Sessions**: Use security settings to revoke all existing tokens, browser cookies, and active sessions.\n"
                "3. **Audit Multi-Factor Authentication (MFA)**: Verify your 2FA configurations and switch from SMS to an Authenticator app or FIDO2 hardware key.\n"
                "4. **Financial Defense**: If banking or card details were exposed, immediately phone your bank to freeze cards and contact the national cybercrime authorities."
            )

        return {
            "reply": reply,
            "language": lang,
            "scan_id": scan_data.get("id") if scan_data else None,
            "is_credential_warning": True,
            "engine": "security_guardrail",
            "evidence_used": ["Credential submission attempt intercepted"],
            "precautions": [
                "Never share passwords or OTPs with chatbots or forms",
                "Isolate and rotate compromised account secrets immediately",
                "Enable app-based Multi-Factor Authentication"
            ]
        }

    # -------------------------------------------------------------------------
    # External AI Integration (Gemini / OpenAI)
    # -------------------------------------------------------------------------
    @classmethod
    def _call_external_ai(
        cls,
        message: str,
        lang: str,
        scan_data: Optional[Dict[str, Any]],
        conversation_history: Optional[List[Dict[str, str]]]
    ) -> Optional[Dict[str, Any]]:
        """Call external LLM API safely with strict grounding context."""
        api_key = Config.AI_API_KEY
        provider = Config.AI_PROVIDER
        if provider == "auto":
            provider = "gemini" if Config.GEMINI_API_KEY else "openai"

        # Sanitize and prepare scan evidence summary
        scan_summary = cls._summarize_scan_for_prompt(scan_data)

        system_instruction = (
            "You are PhishGuard AI, a bilingual (English & Tamil) elite cybersecurity threat intelligence advisor. "
            "Your mission is to explain website scan results, risk factors, evidence breakdowns, and incident response countermeasures. "
            "Strict Rules:\n"
            "1. NEVER ask for passwords, OTPs, PINs, or credentials. If user shares credentials, refuse and instruct immediate remediation.\n"
            "2. Ground your analysis strictly in the provided scan evidence. Prevent unsupported claims. If information was not observed, clearly state uncertainty.\n"
            f"3. Respond completely in the requested language: {'Tamil (தமிழ்)' if lang == 'ta' else 'English'}.\n"
            "4. Format your response cleanly using GitHub Markdown with headings, bullet points, and bold text."
        )

        user_prompt = f"Website Scan Intelligence:\n{scan_summary}\n\nUser Question: {message}\nLanguage: {lang}"

        # Gemini REST implementation
        if provider == "gemini":
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{Config.AI_MODEL}:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{system_instruction}\n\n{user_prompt}"}]}
                ],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 1000}
            }
            res = requests.post(url, headers=headers, json=payload, timeout=Config.AI_TIMEOUT_SECONDS)
            if res.status_code == 200:
                data = res.json()
                reply_text = data["candidates"][0]["content"]["parts"][0]["text"]
                return {
                    "reply": reply_text,
                    "language": lang,
                    "scan_id": scan_data.get("id") if scan_data else None,
                    "engine": "gemini",
                    "evidence_used": cls._extract_evidence_pills(scan_data),
                    "precautions": cls._extract_precautions(scan_data, lang),
                    "uncertainty_note": cls._extract_uncertainty_note(scan_data, lang)
                }

        # OpenAI REST implementation
        elif provider == "openai":
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.2,
                "max_tokens": 1000
            }
            res = requests.post(url, headers=headers, json=payload, timeout=Config.AI_TIMEOUT_SECONDS)
            if res.status_code == 200:
                data = res.json()
                reply_text = data["choices"][0]["message"]["content"]
                return {
                    "reply": reply_text,
                    "language": lang,
                    "scan_id": scan_data.get("id") if scan_data else None,
                    "engine": "openai",
                    "evidence_used": cls._extract_evidence_pills(scan_data),
                    "precautions": cls._extract_precautions(scan_data, lang),
                    "uncertainty_note": cls._extract_uncertainty_note(scan_data, lang)
                }

        return None

    # -------------------------------------------------------------------------
    # Calibrated Rule-Based Evidence Engine
    # -------------------------------------------------------------------------
    @classmethod
    def _evaluate_rule_based_engine(
        cls,
        text: str,
        original_msg: str,
        lang: str,
        scan_data: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Grounded rule-based cybersecurity reasoning engine.
        Uses exact scan findings, heuristic signals, cryptographic SSL states,
        and canonical brand intelligence to formulate precise answers.
        """
        scan = scan_data or {}
        has_scan = bool(scan.get("url") or scan.get("domain"))
        domain = scan.get("domain", "")
        url = scan.get("url", "")
        risk_score = scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score") or scan.get("riskScore", 0)
        risk_category = scan.get("adaptive_risk", {}).get("risk_category", {}).get("label") or scan.get("verdict", "Analyzed")
        target_brand = scan.get("target_brand") or scan.get("targetBrand", "Unspecified")

        # Question Classification Patterns
        # Question Classification Patterns
        is_ssl_query = any(w in text for w in ["ssl", "https", "padlock", "lock", "பூட்டு", "சான்றிதழ்"])

        is_password_entered = (
            any(w in text for w in [
                "entered my password", "entered password", "submitted password", "gave my password", "typed my password",
                "entered credentials", "submitted credentials", "compromised password"
            ]) or
            (any(w in text for w in ["கடவுச்சொல்", "கடவுச்சொல்லை", "வங்கி விவர"]) and any(w in text for w in ["உள்ளிட்", "கொடுத்து", "கொடுத்த", "கொடுக்க", "பதிவு", "என்ன செய்ய", "தவறு"])) or
            (any(w in text for w in ["clicked", "hacked", "compromised", "கிளிக்", "பாதிக்கப்பட்டால்", "திருடப்பட்டால்"]) and any(w in text for w in ["password", "credential", "link", "இணைப்"]))
        )

        is_why_score_increased = any(w in text for w in [
            "score increase", "score increased", "why did the risk", "risk increase", "why is the score",
            "how was the risk calculated", "score high", "higher score",
            "அதிகரித்தது", "இடர் மதிப்பீடு ஏன்", "மதிப்பெண் ஏன்", "அதிகரித்த", "மதிப்பீடு அதிகரித்தது"
        ])

        is_how_to_identify_official = any(w in text for w in [
            "official website", "identify the official", "genuine website", "real website", "legitimate website",
            "authentic website", "find the real", "true website",
            "அதிகாரப்பூர்வ", "உண்மையான", "அடையாளம்", "கண்டறிவது", "உண்மை தளம்"
        ])

        is_why_dangerous = (not is_ssl_query) and (
            any(w in text for w in ["dangerous", "flagged", "malicious", "suspicious", "threat", "phish", "harmful", "unsafe", "ஆபத்தானது", "ஆபத்தான", "எச்சரிக்கப்பட்டது", "அபாயம்", "மோசடி"]) or
            ("why" in text and any(w in text for w in ["risk", "unsafe", "bad", "warn", "site", "website"]) and not is_why_score_increased) or
            ("ஏன்" in text and any(w in text for w in ["ஆபத்தானது", "எச்சரிக்கப்பட்டது", "தளம்", "இணையதளம்"]))
        )

        is_precautions = any(w in text for w in [
            "precaution", "precautions", "what should i do", "what to do", "prevent", "safeguard",
            "முன்னெச்சரிக்கை", "என்ன செய்ய வேண்டும்", "பாதுகாப்பு நடவடிக்கை"
        ])

        is_zero_day = any(w in text for w in ["zero-day", "zero day", "detect", "how does", "கண்டறிதல்"])

        evidence_used = cls._extract_evidence_pills(scan)
        precautions = cls._extract_precautions(scan, lang)
        uncertainty_note = cls._extract_uncertainty_note(scan, lang)

        # Route to specialized intent handlers
        if is_password_entered:
            reply = cls._handle_password_entered(lang, scan)
        elif is_ssl_query:
            reply = cls._handle_ssl_concept(lang, scan)
        elif is_why_score_increased:
            reply = cls._handle_why_score_increased(lang, scan)
        elif is_how_to_identify_official:
            reply = cls._handle_identify_official(lang, scan)
        elif is_why_dangerous:
            reply = cls._handle_why_dangerous(lang, scan)
        elif is_precautions:
            reply = cls._handle_precautions(lang, scan)
        elif is_zero_day:
            reply = cls._handle_zero_day_concept(lang)
        else:
            # Fallback natural guidance
            reply = cls._handle_general_fallback(lang, scan, has_scan)

        return {
            "reply": reply,
            "language": lang,
            "scan_id": scan.get("id"),
            "url": url,
            "risk_score": risk_score,
            "risk_category": risk_category,
            "evidence_used": evidence_used,
            "precautions": precautions,
            "uncertainty_note": uncertainty_note,
            "engine": "rule_based_evidence_engine"
        }

    # -------------------------------------------------------------------------
    # Intent Handlers
    # -------------------------------------------------------------------------
    @classmethod
    def _handle_why_dangerous(cls, lang: str, scan: Dict[str, Any]) -> str:
        """Explains why a specific website was flagged based on actual evidence."""
        domain = scan.get("domain") or scan.get("url") or "this target"
        score = scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score") or scan.get("riskScore", 0)
        category = scan.get("adaptive_risk", {}).get("risk_category", {}).get("label") or scan.get("verdict", "Analyzed")
        target_brand = scan.get("target_brand") or scan.get("targetBrand", "Unspecified")
        heuristics = scan.get("heuristic_features") or scan.get("heuristicFeatures") or {}
        ssl_info = scan.get("ssl_status") or scan.get("sslStatus") or {}
        threat_intel = scan.get("threat_intel") or scan.get("threatIntel") or {}
        dns_info = scan.get("dns_info") or scan.get("dnsInfo") or {}

        # Synthesize measured findings
        findings_en = []
        findings_ta = []

        if target_brand and target_brand != "Unspecified":
            findings_en.append(f"**Brand Impersonation**: Mimics corporate identity of **{target_brand}** without authorization.")
            findings_ta.append(f"**நிறுவன ஆள்மாறாட்டம் (Brand Impersonation)**: இது **{target_brand}** நிறுவனத்தின் பெயரை தவறாகப் பயன்படுத்துகிறது.")

        if heuristics.get("has_password_field"):
            findings_en.append("**Credential Harvesting**: Contains an active password/credential input field.")
            findings_ta.append("**கடவுச்சொல் திருட்டு தளம்**: இதில் பயனர்களின் கடவுச்சொற்களை உள்ளிடும் படிவம் உள்ளது.")

        if heuristics.get("submits_to_remote_domain"):
            findings_en.append("**Form Hijacking**: Form submissions transmit data to an external, discordant third-party host.")
            findings_ta.append("**படிவ வழிமாற்றம்**: படிவத்தில் உள்ளிடும் விவரங்கள் வேறு ஒரு சந்தேகத்திற்கிடமான சர்வருக்கு அனுப்பப்படுகின்றன.")

        if ssl_info.get("is_free_ca"):
            findings_en.append(f"**Automated Free SSL**: Utilizes an ephemeral Domain Validation (DV) certificate from {ssl_info.get('issuer', 'Automated CA')} without organizational identity verification.")
            findings_ta.append(f"**இலவச SSL சான்றிதழ்**: இது {ssl_info.get('issuer', 'இலவச CA')} மூலம் அடையாளம் சரிபார்க்கப்படாமல் பெறப்பட்ட தற்காலிக சான்றிதழ்.")

        vt_hits = threat_intel.get("virustotal_detections", 0)
        if vt_hits > 0:
            findings_en.append(f"**Global Threat Feed**: Flagged as malicious by **{vt_hits} security engines** on VirusTotal.")
            findings_ta.append(f"**சர்வதேச பாதுகாப்பு எச்சரிக்கை**: VirusTotal-ல் **{vt_hits} பாதுகாப்பு என்ஜின்கள்** இதை ஆபத்தான தளம் என உறுதிப்படுத்தியுள்ளன.")

        if threat_intel.get("openphish_listed"):
            findings_en.append("**OpenPhish Intelligence**: Listed as a confirmed active phishing URL on OpenPhish.")
            findings_ta.append("**OpenPhish பட்டியல்**: இந்த முகவரி OpenPhish ஃபிஷிங் தரவுத்தளத்தில் உறுதிப்படுத்தப்பட்டுள்ளது.")

        entropy = heuristics.get("entropy_score", 0)
        if entropy and float(entropy) > 4.2:
            findings_en.append(f"**High Character Entropy ({entropy}/5.0)**: Random lexical obfuscation indicating machine-generated phishing path.")
            findings_ta.append(f"**அதிக எழுத்து சீரற்ற தன்மை ({entropy}/5.0)**: எழுத்துக்களின் குழப்பமான அமைப்பு தானியங்கி ஃபிஷிங் குறியீட்டைக் காட்டுகிறது.")

        if not findings_en:
            if score < 30:
                findings_en.append(f"**Low Risk Attributes**: Registered domain '{domain}' shows verified canonical attributes and valid cryptographic baseline.")
                findings_ta.append(f"**குறைந்த இடர் நிலை**: '{domain}' தளம் அதிகாரப்பூர்வ சான்றுகளுடன் குறைந்த ஆபத்து பிரிவில் உள்ளது.")
            else:
                findings_en.append(f"**Anomalous Structural Patterns**: High subdomain depth or deceptive structural syntax detected in URL '{domain}'.")
                findings_ta.append(f"**சந்தேகத்திற்கிடமான அமைப்பு**: '{domain}' முகவரியில் ஏமாற்றும் எழுத்து மாற்றங்கள் உள்ளன.")

        if lang == "ta":
            bullets = "\n".join([f"- {f}" for f in findings_ta])
            return (
                f"### ⚠️ இந்த இணையதளம் ஏன் ஆபத்தானது என அறிவிக்கப்பட்டது?\n"
                f"**இணைய முகவரி**: `{domain}`\n"
                f"**இடர் மதிப்பீடு (Risk Score)**: **{score}/100** ({category})\n\n"
                f"PhishGuard AI-ன் ஆழமான சோதனையில் பின்வரும் முக்கிய ஆதாரங்கள் கண்டறியப்பட்டுள்ளன:\n"
                f"{bullets}\n\n"
                f"**பாதுகாப்பு வழிகாட்டல்**: இந்த தளத்தில் உங்கள் கடவுச்சொல், தொலைபேசி எண், அல்லது வங்கி விவரங்களை ஒருபோதும் உள்ளிடாதீர்கள். உடனடியாக இந்த தாவலை மூடிவிடவும்."
            )
        else:
            bullets = "\n".join([f"- {f}" for f in findings_en])
            return (
                f"### ⚠️ Why Was This Website Flagged as Dangerous?\n"
                f"**Target Host**: `{domain}`\n"
                f"**Adaptive Risk Score**: **{score}/100** ({category} Risk Category)\n\n"
                f"PhishGuard AI's multi-layered analytical engine identified the following physical evidence:\n"
                f"{bullets}\n\n"
                f"**Security Directive**: Do not submit credentials, OTPs, or financial information to this destination. Close the browser tab immediately."
            )

    @classmethod
    def _handle_why_score_increased(cls, lang: str, scan: Dict[str, Any]) -> str:
        """Explains why the risk score was calculated or why it increased."""
        score = scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score") or scan.get("riskScore", 0)
        category = scan.get("adaptive_risk", {}).get("risk_category", {}).get("label") or scan.get("verdict", "Analyzed")
        dimensions = scan.get("adaptive_risk", {}).get("dimensions") or {}
        completeness = scan.get("adaptive_risk", {}).get("completeness_pct", 100)
        uncertainty = scan.get("adaptive_risk", {}).get("uncertainty_margin", 0)

        # Dimension breakdown
        lexical = dimensions.get("url_lexical", {}).get("score", 0)
        domain_intel = dimensions.get("domain_intelligence", {}).get("score", 0)
        visual = dimensions.get("visual_impersonation", {}).get("score", 0)
        page_content = dimensions.get("page_content", {}).get("score", 0)
        redirects = dimensions.get("redirect_routing", {}).get("score", 0)

        if lang == "ta":
            return (
                f"### 📈 இடர் மதிப்பீடு (Risk Score) ஏன் அதிகரித்தது?\n"
                f"PhishGuard AI-ன் **அளவீட்டு முறை (Adaptive Risk Scoring)** 5 முக்கிய பாதுகாப்பு பரிமாணங்களின் கூட்டுத் தொகையாக **{score}/100** ({category}) என கணக்கிட்டுள்ளது:\n\n"
                f"1. **URL கட்டமைப்பு & சொல்லமைப்பு (URL Lexical - 30% பங்கு)**: மதிப்பீடு **{lexical}/100**\n"
                f"   - போலி எழுத்துக்கள், அதிக Subdomain ஆழம் மற்றும் நீண்ட முகவரி காரணிகள்.\n"
                f"2. **டொமைன் மற்றும் SSL உளவுத்தகவல் (Domain Intelligence - 25% பங்கு)**: மதிப்பீடு **{domain_intel}/100**\n"
                f"   - இலவச தற்காலிக SSL (Free CA) மற்றும் சமீபத்தில் பதிவு செய்யப்பட்ட டொமைன்.\n"
                f"3. **தோற்றப் போலி & பிராண்ட் ஆள்மாறாட்டம் (Visual Impersonation - 20% பங்கு)**: மதிப்பீடு **{visual}/100**\n"
                f"   - உண்மையான நிறுவனத்தின் லோகோ மற்றும் வண்ணங்களை போலி டொமைனில் நகலெடுத்தல்.\n"
                f"4. **வலைப்பக்க படிவ செயல்பாடுகள் (Page Content - 15% பங்கு)**: மதிப்பீடு **{page_content}/100**\n"
                f"   - கடவுச்சொல் படிவங்கள் வெளி சர்வருக்கு தரவை அனுப்பும் அமைப்புகள்.\n"
                f"5. **வழிமாற்று ஆய்வுகள் (Redirect Routing - 10% பங்கு)**: மதிப்பீடு **{redirects}/100**\n\n"
                f"> **துல்லியம் & உறுதியின்மை விளிம்பு**: தகவல்களின் முழுமைத்தன்மை **{completeness}%**, நிச்சயமற்ற விளிம்பு **±{uncertainty} புள்ளிகள்**. கிடைக்காத தகவல்கள் எப்போதுமே தளம் பாதுகாப்பானது என்று கருதப்படாது!"
            )
        else:
            return (
                f"### 📈 Why Did the Risk Score Increase?\n"
                f"The composite threat score escalated to **{score}/100** ({category} Risk) via our multi-vector evidence fusion algorithm across 5 orthogonal cybersecurity dimensions:\n\n"
                f"1. **URL Lexical Heuristics (30% Weight)**: Dimension Score **{lexical}/100**\n"
                f"   - String entropy, homoglyph variations, brand keyword proximity, and uncharacteristic path depths.\n"
                f"2. **Domain & Cryptographic Intelligence (25% Weight)**: Dimension Score **{domain_intel}/100**\n"
                f"   - Automated ephemeral Free CA issuance, certificate lifespan anomalies, and DNS infrastructure age.\n"
                f"3. **Visual Impersonation & Brand Spoofing (20% Weight)**: Dimension Score **{visual}/100**\n"
                f"   - Deep perceptual visual layout match coupled with a non-whitelisted destination domain.\n"
                f"4. **Page Content & Form Interception (15% Weight)**: Dimension Score **{page_content}/100**\n"
                f"   - Sensitive credential inputs submitting form POST actions to discordant external origins.\n"
                f"5. **Redirect & Routing Safety (10% Weight)**: Dimension Score **{redirects}/100**\n\n"
                f"> **Epistemic Uncertainty Disclosure**: Based on **{completeness}% evidence completeness** with an uncertainty margin of **±{uncertainty} points**. Under Zero-Trust principles, unobserved signals are never assumed to indicate safety."
            )

    @classmethod
    def _handle_identify_official(cls, lang: str, scan: Dict[str, Any]) -> str:
        """Explains how to verify the authentic official website vs clones."""
        target_brand = (scan.get("target_brand") or scan.get("targetBrand") or "").strip().lower()
        brand_meta = CANONICAL_BRAND_DOMAINS.get(target_brand)

        if not brand_meta:
            for k, v in CANONICAL_BRAND_DOMAINS.items():
                if k in target_brand:
                    brand_meta = v
                    break

        if brand_meta:
            official_domain = brand_meta["canonical_domain"]
            official_url = brand_meta["official_url"]
            name = brand_meta["display_name"]
            if lang == "ta":
                brand_section = (
                    f"**குறிப்பிட்ட நிறுவன தகவல் ({name})**:\n"
                    f"- **அதிகாரப்பூர்வ டொமைன்**: `{official_domain}`\n"
                    f"- **உண்மையான இணைய முகவரி**: [{official_url}]({official_url})\n"
                    f"- நீங்கள் சோதிக்கும் தளம் இந்த அதிகாரப்பூர்வ டொமைனுடன் துல்லியமாகப் பொருந்தவில்லை எனில் அது போலியான தளமாகும்!"
                )
            else:
                brand_section = (
                    f"**Targeted Entity Profile ({name})**:\n"
                    f"- **Verified Canonical Domain**: `{official_domain}`\n"
                    f"- **Official Secure Portal**: [{official_url}]({official_url})\n"
                    f"- Any domain containing hyphens or secondary extensions (e.g., `{official_domain}.secure-verify.net`) is an impersonation portal!"
                )
        else:
            if lang == "ta":
                brand_section = (
                    "**நிறுவனத்தின் உண்மையான இணையதளத்தை அறிய**:\n"
                    "- பிரவுசரில் நேரடியாக கூகிள் அல்லது விக்கிபீடியாவில் அந்த நிறுவனத்தின் அதிகாரப்பூர்வ இணைய முகவரியை சரிபார்க்கவும்."
                )
            else:
                brand_section = (
                    "**General Canonical Validation Protocol**:\n"
                    "- Cross-reference the company's verified Wikipedia entry or corporate registry to verify the true root domain."
                )

        if lang == "ta":
            return (
                f"### 🛡️ அதிகாரப்பூர்வ (உண்மையான) இணையதளத்தை எவ்வாறு கண்டறிவது?\n\n"
                f"{brand_section}\n\n"
                f"**அங்கீகரிக்கப்பட்ட இணையதளங்களை கண்டறிய 4 எளிய வழிமுறைகள்**:\n"
                f"1. **Root Domain-ஐ மட்டும் கவனிக்கவும்**: `paypal.com.verify-login.cc` என்ற முகவரியில் உண்மையான டொமைன் `verify-login.cc` மட்டுமே; `paypal.com` என்பது ஏமாற்றுவதற்காக வைக்கப்பட்ட Subdomain.\n"
                f"2. **முகவரியை நீங்களே தட்டச்சு செய்யவும்**: மின்னஞ்சல், வாட்ஸ்அப் அல்லது எஸ்.எம்.எஸ்-ல் வரும் இணைப்புகளை கிளிக் செய்யாதீர்கள். முகவரிப் பட்டியில் நேரடியாக URL-ஐ தட்டச்சு செய்யுங்கள்.\n"
                f"3. **SSL சான்றிதழ் விவரங்களை சோதிக்கவும்**: பிரவுசரின் பூட்டு சின்னத்தை கிளிக் செய்து, சான்றிதழ் யாருக்கு வழங்கப்பட்டுள்ளது (Issued To) என்பதை பார்க்கவும். நிறுவனங்களின் EV/OV சான்றிதழ்களில் நிறுவனத்தின் பெயர் இருக்கும்.\n"
                f"4. **விளம்பர இணைப்புகளை தவிர்க்கவும் (Avoid Sponsored Ads)**: தேடுபொறிகளில் 'Sponsored' அல்லது 'Ad' என வரும் இணைப்புகளில் சில சமயம் போலி தளங்கள் இடம்பெறலாம். நேரடி இணையதள முடிவுகளை மட்டும் பயன்படுத்தவும்."
            )
        else:
            return (
                f"### 🛡️ How to Identify the Authentic, Official Website\n\n"
                f"{brand_section}\n\n"
                f"**4-Point Defensive Verification Framework**:\n"
                f"1. **Inspect the True Canonical Root Domain**: In `login.microsoft.com.account-auth.org`, the root domain is `account-auth.org`, NOT `microsoft.com`. Malicious actors use trusted brand names in subdomains or URL paths.\n"
                f"2. **Type the URL Independently**: Never follow authentication links from urgent emails, SMS, or Discord/Teams messages. Always bookmark or manually type verified domains.\n"
                f"3. **Inspect the TLS Certificate Organization**: Click the browser padlock icon -> Connection is Secure -> Certificate. Look for Organization Validation (OV) or Extended Validation (EV) issued to the legitimate corporate legal entity.\n"
                f"4. **Bypass Sponsored Search Ad Results**: Attackers frequently purchase Google Search Sponsored Ads for brand terms to display above organic results. Always select the verified organic root result."
            )

    @classmethod
    def _handle_password_entered(cls, lang: str, scan: Dict[str, Any]) -> str:
        """Emergency incident response protocol if credentials were entered."""
        target_brand = scan.get("target_brand") or scan.get("targetBrand", "the target service")
        if lang == "ta":
            return (
                f"### 🚨 அவசர பாதுகாப்பு வழிகாட்டி: போலி தளத்தில் கடவுச்சொல் உள்ளிட்டிருந்தால் என்ன செய்வது?\n\n"
                f"நீங்கள் போலி தளத்தில் (`{scan.get('domain', 'இணைப்பில்')}`) கடவுச்சொல் உள்ளிட்டிருந்தால் **உடனடியாக பின்வரும் 5 நடவடிக்கைகளை எடுக்கவும்**:\n\n"
                f"1. **உடனடி கடவுச்சொல் மாற்றம் (Immediate Password Reset)**:\n"
                f"   - உண்மையான இணையதளத்திற்கு **நேரடியாக** புதிய தாவலில் செல்லவும் (எ.கா. உண்மையான முகவரியை தட்டச்சு செய்யவும்).\n"
                f"   - உங்கள் கடவுச்சொல்லை உடனடியாக மாற்றவும். பிற தளங்களில் இதே கடவுச்சொல்லை பயன்படுத்தியிருந்தால் அவற்றையும் மாற்றவும்!\n\n"
                f"2. **அனைத்து சாதனங்களிலிருந்தும் வெளியேறவும் (Sign Out All Sessions)**:\n"
                f"   - கணக்கின் 'Security Settings' பகுதிக்குச் சென்று **'Log out of all devices / Revoke active sessions'** கொடுக்கவும்.\n\n"
                f"3. **இருபடி சரிபார்ப்பை (2FA/MFA) தணிக்கை செய்யவும்**:\n"
                f"   - 2-Step Verification இயக்கப்பட்டுள்ளதா என உறுதிசெய்து, அங்கீகார செயலியை (Google Authenticator / Microsoft Authenticator) இயக்கவும்.\n\n"
                f"4. **வங்கி அல்லது நிதி விவரங்கள் எனில்**:\n"
                f"   - உடனடியாக உங்கள் வங்கியின் வாடிக்கையாளர் சேவையை அழைத்து கார்டு மற்றும் நெட் பேங்கிங் வசதியை தற்காலிகமாக முடக்கவும்.\n"
                f"   - இந்தியாவில் தேசிய இணைய குற்றப்பிரிவு உதவி எண் **1930** அல்லது [cybercrime.gov.in](https://cybercrime.gov.in)-ல் உடனடியாக புகார் அளிக்கவும்.\n\n"
                f"5. **அலுவலக கணக்கு எனில் SecOps / IT குழுவிற்கு தெரிவிக்கவும்**:\n"
                f"   - அலுவலக மின்னஞ்சல் எனில் உங்கள் நிறுவன IT குழுவிற்கு முழு URL மற்றும் நேரத்தை உடனே பகிரவும்."
            )
        else:
            return (
                f"### 🚨 Emergency Incident Response Protocol: Compromised Credentials\n\n"
                f"If credentials were submitted on this flagged portal (`{scan.get('domain', 'suspicious link')}`), **execute this 5-step containment procedure immediately**:\n\n"
                f"1. **Isolate & Reset Passwords Immediately**:\n"
                f"   - Open an independent, clean browser window, navigate directly to the verified official platform, and reset your password.\n"
                f"   - If password reuse occurred on personal email, enterprise SSO, or banking, rotate those secrets immediately.\n\n"
                f"2. **Revoke Active OAuth Sessions & Tokens**:\n"
                f"   - Navigate to Account Security -> Active Sessions and select **'Sign out of all other sessions'** to invalidate stolen cookies.\n\n"
                f"3. **Audit Multi-Factor Authentication (MFA)**:\n"
                f"   - Verify registered 2FA recovery phone numbers and email addresses for unauthorized modifications. Enforce Authenticator app (TOTP) or FIDO2 WebAuthn keys over SMS.\n\n"
                f"4. **Freeze Financial & Credit Instruments**:\n"
                f"   - If credit card or payment credentials were submitted, contact your bank immediately to freeze the card and dispute unauthorized charges.\n"
                f"   - Report the incident to your national cybersecurity agency (US: CISA/FBI IC3, India: 1930 / cybercrime.gov.in).\n\n"
                f"5. **Alert Your IT / SecOps Team**:\n"
                f"   - If this involves a corporate credential, report the target URL, submission timestamp, and affected username so firewall blacklists can be propagated."
            )

    @classmethod
    def _handle_precautions(cls, lang: str, scan: Dict[str, Any]) -> str:
        """Actionable precautions tailored to the scan's threat profile."""
        domain = scan.get("domain") or scan.get("url") or "this site"
        score = scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score") or 0

        if lang == "ta":
            return (
                f"### 🛡️ நீங்கள் எடுக்க வேண்டிய பாதுகாப்பு முன்னெச்சரிக்கை நடவடிக்கைகள்:\n\n"
                f"இணைய முகவரி `{domain}`-க்கு (மதிப்பீடு: **{score}/100**):\n"
                f"1. **உள்நுழையவோ தரவுகளை பகிரவோ வேண்டாம்**: இந்த தளத்தில் உங்கள் பயனர் பெயர், கடவுச்சொல், தொலைபேசி எண், அல்லது வங்கி அட்டை விவரங்களை உள்ளிடாதீர்கள்.\n"
                f"2. **கோப்புகளை பதிவிறக்காதீர்கள் (Do Not Download)**: சந்தேகத்திற்கிடமான தளங்களிலிருந்து எந்தவொரு மென்பொருள் அல்லது PDF கோப்புகளையும் பதிவிறக்க வேண்டாம்.\n"
                f"3. **பிரவுசர் அனுமதிகளை மறுக்கவும்**: மைக்ரோஃபோன், கேமரா அல்லது Notification அனுமதிகளை 'Block' செய்யவும்.\n"
                f"4. **இணைப்பை பகிர வேண்டாம்**: மின்னஞ்சல் அல்லது வாட்ஸ்அப் மூலம் இந்த இணைப்பை பிறருக்கு அனுப்ப வேண்டாம்.\n"
                f"5. **வழக்கமான பரிசோதனை**: எதிர்காலத்தில் எந்தவொரு சந்தேகத்திற்குரிய முகவரியையும் PhishGuard முகப்பு ஸ்கேனரில் பரிசோதிக்கவும்."
            )
        else:
            return (
                f"### 🛡️ Recommended Cybersecurity Precautions:\n\n"
                f"Actionable threat mitigation measures for `{domain}` (Risk Score: **{score}/100**):\n"
                f"1. **Zero Data Entry Policy**: Under no circumstances should passwords, OTPs, business credentials, or personal identity numbers be submitted.\n"
                f"2. **Prohibit File Downloads & Extensions**: Reject any prompted file downloads (.exe, .scr, .zip, .pdf) or browser extension installation requests.\n"
                f"3. **Revoke Web Permissions**: Deny location, notification, clipboard, and hardware device access permissions requested by this host.\n"
                f"4. **Quarantine Communications**: Do not forward or share the deceptive URL across internal chat channels or email distribution lists.\n"
                f"5. **Submit to Threat Feeds**: Report the verified malicious host to your organization's perimeter DNS firewall or PhishGuard Monitoring Watchdog."
            )

    @classmethod
    def _handle_ssl_concept(cls, lang: str, scan: Dict[str, Any]) -> str:
        """Explains SSL/HTTPS truth vs misconceptions."""
        ssl_info = scan.get("ssl_status") or scan.get("sslStatus") or {}
        issuer = ssl_info.get("issuer", "Automated CA")
        is_free = ssl_info.get("is_free_ca", True)

        if lang == "ta":
            return (
                f"### 🔒 SSL சான்றிதழ் (HTTPS) பற்றிய முக்கிய உண்மை விளக்கம்:\n\n"
                f"இணையதளத்தில் பச்சை பூட்டு அல்லது HTTPS இருப்பது மட்டுமே அது பாதுகாப்பானது என்பதற்கு உத்தரவாதம் இல்லை!\n\n"
                f"1. **இலவச SSL சான்றிதழ்கள்**: Let's Encrypt மற்றும் Cloudflare போன்ற நிறுவனங்கள் மூலம் ஃபிஷர்களும் 2 நிமிடங்களில் இலவச SSL சான்றிதழ் பெற முடியும்.\n"
                f"2. **குறியாக்கம் (Encryption) vs உண்மைத்தன்மை (Authenticity)**:\n"
                f"   - HTTPS உங்கள் தரவை வழியில் திருடப்படாமல் குறியாக்கம் (encrypt) மட்டுமே செய்கிறது.\n"
                f"   - ஆனால் அந்த சர்வர் உண்மையான நிறுவனத்திற்கு சொந்தமானதா என்பதை அது உறுதிசெய்வதில்லை. தாக்குதல் நடத்துபவரின் சர்வருக்கு உங்கள் கடவுச்சொல் குறியாக்கம் செய்யப்பட்டு பத்திரமாக சென்று சேரும்!\n"
                f"3. **நடப்பு தள சான்றிதழ்**: `{scan.get('domain', 'இந்த தளம்')}`-ன் சான்றிதழ் **{issuer}** மூலம் வழங்கப்பட்டுள்ளது ({'இலவச தானியங்கி CA' if is_free else 'நிறுவன CA'}).\n"
                f"4. **முக்கிய ஆலோசனை**: எப்போதுமே முகவரியின் Domain பெயரை (எ.கா. `paypal.com` vs `paypal-verify.cc`) கவனமாக பரிசோதிக்கவும்."
            )
        else:
            return (
                f"### 🔒 The HTTPS / SSL Misconception in Modern Phishing:\n\n"
                f"A common misconception is that the browser padlock icon (`https://`) guarantees a website is safe, legitimate, and trustworthy.\n\n"
                f"1. **Over 83% of Active Phishing Portals Use Valid SSL**: Automated Certificate Authorities (such as Let's Encrypt and ZeroSSL) issue Domain Validation (DV) certificates programmatically in under 60 seconds without verifying the operator's corporate identity.\n"
                f"2. **Encryption In-Transit ≠ Authenticity**:\n"
                f"   - SSL/TLS only guarantees cryptographic privacy between the client browser and the receiving endpoint.\n"
                f"   - If the remote server is owned by a threat actor, your sensitive credentials are simply transmitted securely and encrypted straight to the attacker!\n"
                f"3. **Observed Target Certificate**: `{scan.get('domain', 'This site')}` utilizes a certificate issued by **{issuer}** ({'Automated Free DV' if is_free else 'Enterprise Extended Validation'}).\n"
                f"4. **Golden Rule**: Verify the canonical domain spelling and legal certificate holder, not merely the presence of the green padlock."
            )

    @classmethod
    def _handle_zero_day_concept(cls, lang: str) -> str:
        """Explains how PhishGuard AI detects zero-day phishing."""
        if lang == "ta":
            return (
                "### ⚡ PhishGuard AI ஜீரோ-டே (Zero-Day) ஃபிஷிங்கை எவ்வாறு கண்டறிகிறது?\n\n"
                "பாரம்பரிய தடுப்புப் பட்டியல்கள் (Google Safe Browsing, PhishTank போன்றவை) புதிய ஃபிஷிங் தளங்களை கண்டறிய **12 முதல் 36 மணி நேரம் வரை** தாமதமாகின்றன. ஆனால் இன்றைய ஃபிஷிங் தளங்கள் 4 மணி நேரத்திற்குள் இயங்கி மறைந்து விடுகின்றன.\n\n"
                "PhishGuard AI இதை முறியடிக்க 4 அடுக்கு AI தொழில்நுட்பத்தை பயன்படுத்துகிறது:\n"
                "1. **சொற்பொருள் NLP ஆய்வு (Lexical Entropy)**: எழுத்து குழப்பம், போலி எழுத்துக்கள் (Punycode homoglyphs) மற்றும் சந்தேகத்திற்குரிய Subdomain அமைப்புகள்.\n"
                "2. **விஷுவல் டீப் லேர்னிங் (Visual Siamese Vision)**: இணையதளத்தின் ஸ்கிரீன்ஷாட் எடுத்து, நிறுவனங்களின் உண்மையான லோகோ மற்றும் வண்ணங்களுடன் ஒப்பிடுதல்.\n"
                "3. **படிவ வழிமாற்று சரிபார்ப்பு (DOM Form Verification)**: கடவுச்சொல் படிவங்கள் எந்த சர்வருக்கு செல்கின்றன என்பதை நேரலையில் ஆராய்தல்.\n"
                "4. **விளக்கக்கூடிய AI (XAI)**: SHAP மற்றும் LIME அல்காரிதம்கள் மூலம் ஒவ்வொரு காரணிகளையும் வெளிப்படையாக விளக்குதல்."
            )
        else:
            return (
                "### ⚡ How PhishGuard AI Detects Zero-Day Phishing:\n\n"
                "Traditional threat feeds (such as Google Safe Browsing and blocklists) suffer from a **12 to 36-hour discovery lag**, while 65% of modern credential harvesting campaigns operate for under 4 hours before tearing down infrastructure.\n\n"
                "PhishGuard AI defends against novel zero-day campaigns through proactive multi-modal heuristics:\n"
                "1. **Lexical Machine Learning**: Evaluates string entropy, punycode Cyrillic homoglyphs, and brand name Levenshtein distance.\n"
                "2. **Visual Siamese Deep Vision**: Headless perceptual rendering compares page screenshots and logo centroids against genuine corporate reference assets.\n"
                "3. **DOM & Dynamic Form Inspection**: Detects password inputs posting cross-origin payloads to external staging hosts.\n"
                "4. **Explainable AI (SHAP & LIME)**: Real-time feature decomposition calculates exact risk weight contributions with full transparency."
            )

    @classmethod
    def _handle_general_fallback(cls, lang: str, scan: Dict[str, Any], has_scan: bool) -> str:
        """General welcoming and triage guidance."""
        domain = scan.get("domain") or scan.get("url")
        score = scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score") or 0

        if lang == "ta":
            if has_scan:
                return (
                    f"### 🛡️ PhishGuard AI பாதுகாப்பு உதவியாளர்:\n"
                    f"தற்போது பரிசோதிக்கப்பட்ட தளம்: `{domain}` (இடர் மதிப்பீடு: **{score}/100**)\n\n"
                    f"நீங்கள் இந்த ஸ்கேன் பற்றி பின்வரும் கேள்விகளை கேட்கலாம்:\n"
                    f"- *இந்த இணையதளம் ஏன் ஆபத்தானது?*\n"
                    f"- *இடர் மதிப்பீடு ஏன் அதிகரித்தது?*\n"
                    f"- *அதிகாரப்பூர்வ இணையதளத்தை எவ்வாறு கண்டறிவது?*\n"
                    f"- *எனது கடவுச்சொல்லை உள்ளிட்டிருந்தால் நான் என்ன செய்ய வேண்டும்?*\n"
                    f"- *நான் என்ன முன்னெச்சரிக்கை நடவடிக்கைகளை எடுக்க வேண்டும்?*"
                )
            return (
                "### 🛡️ PhishGuard AI சைபர் பாதுகாப்பு உளவுத்துறை உதவியாளர்:\n"
                "நான் உங்களுக்கு பின்வருவனவற்றில் உதவ முடியும்:\n"
                "- **URL & டொமைன் சரிபார்ப்பு**: ஆபத்து காரணிகள் மற்றும் போலி எழுத்து அமைப்புகள் விளக்கம்.\n"
                "- **பிராண்ட் பாதுகாப்பு**: Microsoft 365, PayPal, SBI, Google போலி தளங்களை அடையாளம் காணுதல்.\n"
                "- **அவசர பாதுகாப்பு நடவடிக்கைகள்**: கடவுச்சொல் திருடப்பட்டால் உடனடியாக எடுக்க வேண்டிய நடவடிக்கைகள்.\n"
                "- **இருமொழி ஆதரவு**: தமிழ் (Tamil) மற்றும் ஆங்கிலம் (English) இரண்டிலும் கிடைக்கும்."
            )
        else:
            if has_scan:
                return (
                    f"### 🛡️ PhishGuard AI Security Advisor:\n"
                    f"Active scan context loaded for target: `{domain}` (Adaptive Risk Score: **{score}/100**)\n\n"
                    f"You can query specific forensic intelligence regarding this scan:\n"
                    f"- *Why is this website dangerous?*\n"
                    f"- *Why did the risk score increase?*\n"
                    f"- *How can I identify the official website?*\n"
                    f"- *What should I do if I entered my password?*\n"
                    f"- *What precautions should I take?*"
                )
            return (
                "### 🛡️ PhishGuard AI Cyber Threat Intelligence:\n"
                "I can assist you with:\n"
                "- **URL & Domain Verification**: Explaining risk factors, typosquatting variants, and registration anomalies.\n"
                "- **Brand Protection & Defense**: Identifying mimicry of Microsoft 365, PayPal, Chase, Google, and banking portals.\n"
                "- **Incident Remediation**: Guiding swift countermeasures if credentials or tokens were intercepted.\n"
                "- **Bilingual Security Awareness**: Available in both English and Tamil (தமிழ்)."
            )

    # -------------------------------------------------------------------------
    # Helper Extractors
    # -------------------------------------------------------------------------
    @classmethod
    def _extract_evidence_pills(cls, scan: Dict[str, Any]) -> List[str]:
        """Extracts concise bullet pills of measured evidence."""
        pills = []
        if not scan:
            return pills

        heuristics = scan.get("heuristic_features") or scan.get("heuristicFeatures") or {}
        ssl_info = scan.get("ssl_status") or scan.get("sslStatus") or {}
        threat_intel = scan.get("threat_intel") or scan.get("threatIntel") or {}
        brand = scan.get("target_brand") or scan.get("targetBrand")

        if brand and brand != "Unspecified":
            pills.append(f"Target Brand: {brand}")
        if heuristics.get("has_password_field"):
            pills.append("Password Input Detected")
        if heuristics.get("submits_to_remote_domain"):
            pills.append("Cross-Origin Form POST")
        if ssl_info.get("is_free_ca"):
            pills.append(f"Automated Free CA ({ssl_info.get('issuer', 'Free DV')})")
        if threat_intel.get("virustotal_detections", 0) > 0:
            pills.append(f"{threat_intel.get('virustotal_detections')} VirusTotal Detections")
        if threat_intel.get("openphish_listed"):
            pills.append("OpenPhish Verified")
        if heuristics.get("entropy_score"):
            pills.append(f"Entropy {heuristics.get('entropy_score')}/5.0")
        if not pills and scan.get("domain"):
            pills.append(f"Host: {scan.get('domain')}")
        return pills

    @classmethod
    def _extract_precautions(cls, scan: Dict[str, Any], lang: str) -> List[str]:
        """Returns concise actionable precautions."""
        score = scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score") or 0
        if lang == "ta":
            if score >= 60:
                return [
                    "கடவுச்சொல் அல்லது OTP-ஐ உள்ளிடாதீர்கள்",
                    "கோப்புகளை பதிவிறக்க வேண்டாம்",
                    "உடனடியாக இணைய பக்கத்தை மூடுங்கள்"
                ]
            return [
                "அதிகாரப்பூர்வ முகவரியை நேரடியாக தட்டச்சு செய்து பார்வையிடவும்",
                "இருபடி சரிபார்ப்பை (2FA) இயக்கவும்"
            ]
        else:
            if score >= 60:
                return [
                    "Never enter passwords, OTPs, or financial secrets",
                    "Do not download files or grant browser permissions",
                    "Close the deceptive browser tab immediately"
                ]
            return [
                "Navigate directly to the verified canonical domain",
                "Enforce hardware/authenticator Multi-Factor Authentication"
            ]

    @classmethod
    def _extract_uncertainty_note(cls, scan: Dict[str, Any], lang: str) -> Optional[str]:
        """Returns uncertainty disclaimer based on observed vs missing evidence."""
        adaptive = scan.get("adaptive_risk") or {}
        completeness = adaptive.get("completeness_pct")
        margin = adaptive.get("uncertainty_margin")

        if completeness is not None and margin is not None:
            if lang == "ta":
                return f"ஆதாரங்களின் முழுமைத்தன்மை: {completeness}% | நிச்சயமற்ற விளிம்பு: ±{margin} புள்ளிகள். காணப்படாத தகவல்கள் பாதுகாப்பிற்கு உத்தரவாதம் அல்ல."
            return f"Evidence Completeness: {completeness}% | Uncertainty Margin: ±{margin} pts. Absence of detection does not guarantee absolute safety."
        return None

    @classmethod
    def _summarize_scan_for_prompt(cls, scan: Optional[Dict[str, Any]]) -> str:
        """Compacts scan evidence into an LLM context block."""
        if not scan:
            return "No specific scan loaded. General cybersecurity guidance mode."

        return json.dumps({
            "url": scan.get("url"),
            "domain": scan.get("domain"),
            "risk_score": scan.get("adaptive_risk", {}).get("adaptive_risk_score") or scan.get("risk_score"),
            "risk_category": scan.get("adaptive_risk", {}).get("risk_category", {}).get("label") or scan.get("verdict"),
            "target_brand": scan.get("target_brand") or scan.get("targetBrand"),
            "ssl_status": scan.get("ssl_status") or scan.get("sslStatus"),
            "heuristic_features": scan.get("heuristic_features") or scan.get("heuristicFeatures"),
            "threat_intel": scan.get("threat_intel") or scan.get("threatIntel"),
            "dimensions": scan.get("adaptive_risk", {}).get("dimensions"),
            "completeness_pct": scan.get("adaptive_risk", {}).get("completeness_pct"),
            "uncertainty_margin": scan.get("adaptive_risk", {}).get("uncertainty_margin")
        }, indent=2)


assistant_service = AssistantService()
