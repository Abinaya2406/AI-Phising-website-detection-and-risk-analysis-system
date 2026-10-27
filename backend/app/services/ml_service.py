"""Machine Learning Feature Extractor, Trained Baseline Model, and SHAP Integration."""
import math
import re
from urllib.parse import urlparse, parse_qs
from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import shap
from app.utils.logger import logger

SUSPICIOUS_KEYWORDS = [
    "login", "verify", "account", "secure", "update", "banking", "signin",
    "confirm", "security", "wallet", "support", "service", "webapps", "auth",
    "password", "ebay", "paypal", "apple", "google", "microsoft", "chase",
    "bill", "statement", "recover", "validation", "authenticate", "portal"
]

CREDENTIAL_PARAMS = ["pass", "password", "pwd", "token", "otp", "code", "cvv", "card", "ssn"]

HIGH_RISK_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "top", "xyz", "pw", "cc", "buzz", "rest", "surf", "icu", "click", "live"
}

FEATURE_NAMES = [
    "url_length",
    "hostname_length",
    "path_length",
    "subdomain_count",
    "has_ip_in_url",
    "has_at_symbol",
    "double_slash_redirect",
    "hyphen_count",
    "digit_count",
    "entropy_score",
    "is_risky_tld",
    "keyword_count",
    "is_punycode",
    "has_port",
    "path_depth",
    "has_credential_token",
]

FEATURE_METADATA = {
    "url_length": {
        "label": "Total URL Length",
        "description": "Long URLs often conceal tracking payloads and redirected destinations."
    },
    "hostname_length": {
        "label": "Hostname / Domain Length",
        "description": "Unusually long hostnames are commonly used to mimic brand names and legitimate portals."
    },
    "path_length": {
        "label": "URI Path Length",
        "description": "Extensive path strings frequently house automated phishing kit tokens and randomized IDs."
    },
    "subdomain_count": {
        "label": "Subdomain Hierarchy Depth",
        "description": "Attackers deploy multiple subdomains (e.g. paypal.com.verify.login.cc) to deceive users."
    },
    "has_ip_in_url": {
        "label": "Direct Raw IP Hostname",
        "description": "Using an IP address instead of a domain name bypasses standard domain reputation filters."
    },
    "has_at_symbol": {
        "label": "Embedded '@' Symbol in URL",
        "description": "The '@' character instructs browsers to ignore preceding text and route to the trailing host."
    },
    "double_slash_redirect": {
        "label": "Double Slash '//' Redirection",
        "description": "Appearing after the protocol separator, '//' indicates open redirection techniques."
    },
    "hyphen_count": {
        "label": "Hyphen Count in Hostname",
        "description": "Combosquatting and deceptive brand spoofing heavily utilize hyphenated tokens (e.g. secure-login-bank)."
    },
    "digit_count": {
        "label": "Digit Count in URL",
        "description": "Phishing landing pages frequently embed numeric session hashes and hex indicators."
    },
    "entropy_score": {
        "label": "Shannon Character Entropy",
        "description": "Measures string randomness; high entropy suggests domain generation algorithms (DGAs) or encrypted tokens."
    },
    "is_risky_tld": {
        "label": "High-Risk Top-Level Domain (TLD)",
        "description": "Top-level domains frequently abused for disposable spam and spear-phishing (e.g. .xyz, .cc, .pw, .tk)."
    },
    "keyword_count": {
        "label": "Sensitive Brand & Security Keywords",
        "description": "Presence of targeted terms such as 'login', 'verify', 'account', 'signin', 'secure', 'banking'."
    },
    "is_punycode": {
        "label": "Punycode / Homoglyph Encoding",
        "description": "Prefix 'xn--' indicates internationalized characters used to spoof Latin lookalike glyphs."
    },
    "has_port": {
        "label": "Non-Standard Port Specification",
        "description": "Specifying custom ports often routes traffic to rogue or ad-hoc backdoors."
    },
    "path_depth": {
        "label": "Directory Path Depth",
        "description": "Deep directory nesting mirrors authentic platform hierarchy to project legitimacy."
    },
    "has_credential_token": {
        "label": "Sensitive Credential Tokens in Query",
        "description": "Parameters requesting 'password', 'token', 'otp', or 'code' indicate credential harvesting."
    }
}


def calculate_entropy(text: str) -> float:
    """Calculate Shannon entropy of a string."""
    if not text:
        return 0.0
    entropy = 0.0
    length = len(text)
    counts = {}
    for char in text:
        counts[char] = counts.get(char, 0) + 1
    for count in counts.values():
        p = count / length
        entropy -= p * math.log2(p)
    return round(entropy, 3)


class MLPhishingService:
    """Trained machine learning classification engine with native SHAP TreeExplainer."""

    def __init__(self):
        self.model: RandomForestClassifier = None
        self.explainer: shap.TreeExplainer = None
        self.base_value: float = 0.5
        self._initialize_and_train_baseline_model()

    @staticmethod
    def extract_features(url: str) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Extract numeric feature vector and observed physical evidence from a URL.
        
        Returns:
            Tuple: (numeric_feature_dict, observed_evidence_dict)
        """
        parsed = urlparse(url if "://" in url else "https://" + url)
        hostname = parsed.hostname or ""
        path = parsed.path or ""
        query = parsed.query or ""

        # Raw IP check
        has_ip = 1 if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", hostname) else 0

        # Subdomains
        parts = hostname.split(".")
        subdomain_count = max(0, len(parts) - 2) if len(parts) >= 2 else 0
        subdomain_names = parts[:-2] if len(parts) >= 2 else []

        # TLD
        tld = parts[-1].lower() if parts else ""
        is_risky_tld = 1 if tld in HIGH_RISK_TLDS else 0

        # Suspicious keywords
        lower_url = url.lower()
        matched_keywords = [kw for kw in SUSPICIOUS_KEYWORDS if kw in lower_url]
        keyword_count = len(matched_keywords)

        # Entropy
        entropy_score = calculate_entropy(hostname + path)

        # Special operators
        has_at_symbol = 1 if "@" in url else 0
        has_double_slash = 1 if "//" in path else 0
        hyphen_count = hostname.count("-")
        digit_count = sum(c.isdigit() for c in url)
        is_punycode = 1 if hostname.startswith("xn--") or ".xn--" in hostname else 0
        has_port = 1 if parsed.port and parsed.port not in (80, 443) else 0

        # Path depth
        path_segments = [p for p in path.strip("/").split("/") if p]
        path_depth = len(path_segments)

        # Credential tokens in query
        query_dict = parse_qs(query)
        found_cred_tokens = [p for p in CREDENTIAL_PARAMS if any(p in k.lower() for k in query_dict.keys())]
        has_cred_token = 1 if len(found_cred_tokens) > 0 else 0

        numeric_features = {
            "url_length": len(url),
            "hostname_length": len(hostname),
            "path_length": len(path),
            "subdomain_count": subdomain_count,
            "has_ip_in_url": has_ip,
            "has_at_symbol": has_at_symbol,
            "double_slash_redirect": has_double_slash,
            "hyphen_count": hyphen_count,
            "digit_count": digit_count,
            "entropy_score": entropy_score,
            "is_risky_tld": is_risky_tld,
            "keyword_count": keyword_count,
            "is_punycode": is_punycode,
            "has_port": has_port,
            "path_depth": path_depth,
            "has_credential_token": has_cred_token,
        }

        observed_evidence = {
            "hostname": hostname,
            "tld": tld,
            "matched_keywords": matched_keywords,
            "subdomain_names": subdomain_names,
            "path_segments_count": path_depth,
            "query_parameter_count": len(query_dict),
            "credential_parameters_found": found_cred_tokens,
            "raw_ip_detected": bool(has_ip),
            "at_symbol_detected": bool(has_at_symbol),
            "double_slash_detected": bool(has_double_slash),
            "is_punycode_encoded": bool(is_punycode),
            "custom_port": parsed.port if has_port else None,
            "measured_entropy": entropy_score,
        }

        return numeric_features, observed_evidence

    def _initialize_and_train_baseline_model(self):
        """Train baseline Random Forest model on curated legitimate and phishing URL patterns."""
        training_samples = [
            # Benign URLs (Label 0)
            ("https://google.com/search?q=cybersecurity", 0),
            ("https://github.com/torvalds/linux", 0),
            ("https://en.wikipedia.org/wiki/Computer_security", 0),
            ("https://docs.python.org/3/library/socket.html", 0),
            ("https://cloudflare.com/learning/ssl/what-is-ssl/", 0),
            ("https://nytimes.com/section/technology", 0),
            ("https://stackoverflow.com/questions/tagged/python", 0),
            ("https://apple.com/iphone-16-pro/", 0),
            ("https://microsoft.com/en-us/windows", 0),
            ("https://amazon.com/gp/bestsellers", 0),
            ("https://gov.uk/browse/tax", 0),
            ("https://mit.edu/research", 0),
            ("https://mozilla.org/en-US/firefox/new/", 0),
            ("https://bbc.com/news/world", 0),
            ("https://stanford.edu/academics/", 0),
            ("https://linkedin.com/feed/", 0),
            ("https://youtube.com/watch?v=dQw4w9WgXcQ", 0),
            ("https://reddit.com/r/netsec/", 0),
            ("https://cnn.com/world", 0),
            ("https://reuters.com/technology/", 0),
            ("https://gitlab.com/explore", 0),
            ("https://medium.com/topic/cybersecurity", 0),
            ("https://paypal.com/signin", 0),
            ("https://chase.com/personal/banking", 0),

            # Phishing URLs (Label 1)
            ("https://security-verify-account-paypal.com/signin/webapps", 1),
            ("https://chase-online-secure-auth.net/portal/login.htm", 1),
            ("https://storage-service-azure-sharepoint.app-verify.cc", 1),
            ("https://login-microsoftonline-recovery.top/auth/login", 1),
            ("https://appleid-apple-verify-account.pw/security/update", 1),
            ("https://netflix-billing-update-account.buzz/customer", 1),
            ("https://185.193.125.44/banking/login.php?user=temp", 1),
            ("https://104.21.32.110/webapps/account-verification", 1),
            ("https://signin.ebay.com.account-update.tk/verify.html", 1),
            ("https://secure.bankofamerica.com.account-notice.ml/login", 1),
            ("https://auth.google.com-security-alert.ga/prompt/verify", 1),
            ("https://update-wallet-metamask-seed.rest/phrase.html", 1),
            ("https://verification-passcode-sms.cc/auth?token=9482103", 1),
            ("https://xn--pple-43d.com/login/auth.php", 1),
            ("https://support-ticket-update-microsoft.surf/case/login", 1),
            ("https://identity-access-amazon-aws.icu/iam/security", 1),
            ("https://portal-account-statement-secure.info//redirect/login", 1),
            ("https://user:pass@chase-auth-portal.com/banking", 1),
            ("https://wellsfargo-security-alert.xyz/portal/verify.php", 1),
            ("https://coinbase-wallet-security-validate.pw/auth", 1),
            ("https://customer-service-paypal.com-verify-security.top/webapps", 1),
            ("https://citi-online-account-login.cc/secure/portal", 1),
            ("https://instagram-badge-verification-help.cf/login", 1),
            ("https://dhl-package-tracking-notice.buzz/delivery/verify", 1),
        ]

        X_rows = []
        y_rows = []
        for url_str, label in training_samples:
            feat_dict, _ = self.extract_features(url_str)
            row = [feat_dict[k] for k in FEATURE_NAMES]
            X_rows.append(row)
            y_rows.append(label)

        X = pd.DataFrame(X_rows, columns=FEATURE_NAMES)
        y = np.array(y_rows)

        # Train Random Forest classifier
        self.model = RandomForestClassifier(
            n_estimators=45,
            max_depth=6,
            min_samples_split=2,
            random_state=42
        )
        self.model.fit(X, y)

        # Initialize SHAP TreeExplainer
        self.explainer = shap.TreeExplainer(self.model)
        
        # Calculate baseline expected value
        try:
            expected = self.explainer.expected_value
            if isinstance(expected, (list, np.ndarray)):
                self.base_value = float(expected[1]) if len(expected) > 1 else float(expected[0])
            else:
                self.base_value = float(expected)
        except Exception as e:
            logger.warning(f"SHAP expected value resolution: {e}")
            self.base_value = 0.50

        logger.info(f"PhishGuard AI Baseline RandomForest model trained successfully with SHAP TreeExplainer.")

    def predict_risk(self, url: str) -> Dict[str, Any]:
        """
        Execute trained model inference and return probability and feature vectors.
        """
        numeric_features, observed_evidence = self.extract_features(url)
        df_sample = pd.DataFrame([[numeric_features[k] for k in FEATURE_NAMES]], columns=FEATURE_NAMES)

        probabilities = self.model.predict_proba(df_sample)[0]
        # Probability of phishing (class 1)
        phishing_prob = float(probabilities[1])

        return {
            "probability": round(phishing_prob, 4),
            "features": numeric_features,
            "observed_evidence": observed_evidence,
            "model_name": "RandomForest Classifier + SHAP TreeExplainer v2.0",
        }

    def explain_url_with_shap(self, url: str) -> Dict[str, Any]:
        """
        Compute exact Shapley feature impact values for the URL using SHAP TreeExplainer.
        """
        numeric_features, observed_evidence = self.extract_features(url)
        df_sample = pd.DataFrame([[numeric_features[k] for k in FEATURE_NAMES]], columns=FEATURE_NAMES)

        # Model prediction
        probabilities = self.model.predict_proba(df_sample)[0]
        phishing_prob = float(probabilities[1])

        # SHAP calculation
        shap_values_raw = self.explainer(df_sample)
        
        # Extract values for Class 1 (Phishing)
        if len(shap_values_raw.values.shape) == 3:
            shap_vector = shap_values_raw.values[0, :, 1]
        else:
            shap_vector = shap_values_raw.values[0, :]

        shap_features = []
        for idx, feat_name in enumerate(FEATURE_NAMES):
            val = numeric_features[feat_name]
            phi = float(shap_vector[idx])
            rounded_phi = round(phi, 3)
            if rounded_phi == 0.0:
                rounded_phi = 0.0
            sign = "positive" if rounded_phi >= 0.0 else "negative"
            meta = FEATURE_METADATA.get(feat_name, {"label": feat_name, "description": ""})

            shap_features.append({
                "feature": meta["label"],
                "human_label": meta["label"],
                "humanLabel": meta["label"],
                "feature_name": feat_name,
                "featureName": feat_name,
                "measured_value": val,
                "measuredValue": val,
                "impact": rounded_phi,
                "shap_value": rounded_phi,
                "shapValue": rounded_phi,
                "sign": sign,
                "description": meta["description"],
            })

        # Sort features by absolute impact descending
        shap_features.sort(key=lambda x: abs(x["impact"]), reverse=True)

        return {
            "probability": round(phishing_prob, 4),
            "base_value": round(self.base_value, 3),
            "shap_features": shap_features,
            "numeric_features": numeric_features,
            "observed_evidence": observed_evidence,
        }


ml_service = MLPhishingService()
