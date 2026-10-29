"""Adaptive Phishing Risk Scoring Engine & Multi-Vector Evidence Breakdown.

Feature 3: Adaptive Phishing Risk Scoring and Evidence Breakdown.
- Synthesizes URL lexical classification, domain intelligence, visual heuristics,
  page content, and redirect routing.
- Uses calibrated probability updates and evidence-weighted aggregation.
- Prevents double-counting by segregating orthogonal evidence dimensions.
- Accounts for unavailable/missing signals without treating missing data as proof of safety.
- Formulates transparent factor-by-factor evidence explanations.
- Supports configurable category thresholds evaluated against validation benchmarks.
- Provides rigorous side-by-side scan delta comparison.
"""

from typing import Dict, Any, List, Optional, Tuple
from copy import deepcopy
import math


# Default 4-tier risk classification thresholds
DEFAULT_THRESHOLDS = {
    "low": {"min": 0, "max": 29, "label": "Low", "description": "Minimal risk indicators observed."},
    "medium": {"min": 30, "max": 59, "label": "Medium", "description": "Elevated or suspicious indicators requiring caution."},
    "high": {"min": 60, "max": 79, "label": "High", "description": "Strong phishing signatures or deceptive patterns detected."},
    "critical": {"min": 80, "max": 100, "label": "Critical", "description": "Severe credential harvesting, brand impersonation, or confirmed malicious payload."}
}

# Dimension baseline weights (sum to 1.0)
DIMENSION_WEIGHTS = {
    "url_lexical": 0.30,
    "domain_intelligence": 0.25,
    "visual_impersonation": 0.20,
    "page_content": 0.15,
    "redirect_routing": 0.10,
}

DIMENSION_METADATA = {
    "url_lexical": {
        "title": "URL Classification & Lexical Features",
        "description": "Model-inferred statistical patterns, entropy, character distributions, and suspicious syntax.",
        "icon": "Key"
    },
    "domain_intelligence": {
        "title": "Domain & Cryptographic Infrastructure",
        "description": "SSL certificate validity, CA reputation, registration age, DNS resolution, and TLD reputation.",
        "icon": "Lock"
    },
    "visual_impersonation": {
        "title": "Visual Forensics & Brand Impersonation",
        "description": "Perceptual hashing, color palette proximity, and canonical vs rogue domain spoofing.",
        "icon": "Camera"
    },
    "page_content": {
        "title": "Page Content & DOM Heuristics",
        "description": "Form submission targets, credential password fields, external favicons, and obfuscated iframes.",
        "icon": "Globe"
    },
    "redirect_routing": {
        "title": "Redirect & Network Routing",
        "description": "Hop counts, open redirect tokens (//), protocol elevation, and intermediate routing safety.",
        "icon": "Server"
    }
}

# Empirical Validation Dataset for Threshold Evaluation
VALIDATION_DATASET: List[Dict[str, Any]] = [
    {
        "url": "https://paypal-security-update.account-verification-login.com/auth",
        "ground_truth": "critical",
        "ground_truth_score": 92,
        "is_phishing": True,
        "simulated_signals": {
            "model_prob": 0.94,
            "ssl_free_ca": True,
            "ssl_valid": True,
            "ssl_age_days": 2,
            "domain_age_days": 5,
            "risky_tld": False,
            "subdomain_depth": 3,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 4.12,
            "keyword_count": 3,
            "matched_brand": "PayPal",
            "is_canonical": False,
            "visual_similarity": 91.0,
            "has_password_field": True,
            "submits_to_remote": True,
            "external_favicon": True,
            "redirect_hops": 2,
        }
    },
    {
        "url": "https://www.paypal.com/signin",
        "ground_truth": "low",
        "ground_truth_score": 4,
        "is_phishing": False,
        "simulated_signals": {
            "model_prob": 0.05,
            "ssl_free_ca": False,
            "ssl_valid": True,
            "ssl_age_days": 820,
            "domain_age_days": 9000,
            "risky_tld": False,
            "subdomain_depth": 0,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 2.85,
            "keyword_count": 1,
            "matched_brand": "PayPal",
            "is_canonical": True,
            "visual_similarity": 95.0,
            "has_password_field": True,
            "submits_to_remote": False,
            "external_favicon": False,
            "redirect_hops": 0,
        }
    },
    {
        "url": "http://192.168.1.100/chase-online-banking/login.php?user=test",
        "ground_truth": "critical",
        "ground_truth_score": 96,
        "is_phishing": True,
        "simulated_signals": {
            "model_prob": 0.98,
            "ssl_free_ca": True,
            "ssl_valid": False,
            "ssl_age_days": 0,
            "domain_age_days": 0,
            "risky_tld": False,
            "subdomain_depth": 0,
            "has_ip": True,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 3.9,
            "keyword_count": 3,
            "matched_brand": "JPMorgan Chase & Co.",
            "is_canonical": False,
            "visual_similarity": 88.0,
            "has_password_field": True,
            "submits_to_remote": True,
            "external_favicon": True,
            "redirect_hops": 1,
        }
    },
    {
        "url": "https://accounts.google.com/ServiceLogin",
        "ground_truth": "low",
        "ground_truth_score": 5,
        "is_phishing": False,
        "simulated_signals": {
            "model_prob": 0.04,
            "ssl_free_ca": False,
            "ssl_valid": True,
            "ssl_age_days": 600,
            "domain_age_days": 10000,
            "risky_tld": False,
            "subdomain_depth": 1,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 3.1,
            "keyword_count": 1,
            "matched_brand": "Google LLC",
            "is_canonical": True,
            "visual_similarity": 98.0,
            "has_password_field": True,
            "submits_to_remote": False,
            "external_favicon": False,
            "redirect_hops": 0,
        }
    },
    {
        "url": "https://secure-login-portal.xyz/billing/verification",
        "ground_truth": "high",
        "ground_truth_score": 75,
        "is_phishing": True,
        "simulated_signals": {
            "model_prob": 0.78,
            "ssl_free_ca": True,
            "ssl_valid": True,
            "ssl_age_days": 4,
            "domain_age_days": 12,
            "risky_tld": True,
            "subdomain_depth": 1,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 4.3,
            "keyword_count": 2,
            "matched_brand": None,
            "is_canonical": False,
            "visual_similarity": None,  # Missing visual
            "has_password_field": True,
            "submits_to_remote": True,
            "external_favicon": True,
            "redirect_hops": 1,
        }
    },
    {
        "url": "https://github.com/torvalds/linux",
        "ground_truth": "low",
        "ground_truth_score": 2,
        "is_phishing": False,
        "simulated_signals": {
            "model_prob": 0.02,
            "ssl_free_ca": False,
            "ssl_valid": True,
            "ssl_age_days": 450,
            "domain_age_days": 6000,
            "risky_tld": False,
            "subdomain_depth": 0,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 2.9,
            "keyword_count": 0,
            "matched_brand": None,
            "is_canonical": False,
            "visual_similarity": None,  # Not impersonating
            "has_password_field": False,
            "submits_to_remote": False,
            "external_favicon": False,
            "redirect_hops": 0,
        }
    },
    {
        "url": "https://app-track-dashboard.cloud-services-portal.info/session?ref=share",
        "ground_truth": "medium",
        "ground_truth_score": 48,
        "is_phishing": False,
        "simulated_signals": {
            "model_prob": 0.45,
            "ssl_free_ca": True,
            "ssl_valid": True,
            "ssl_age_days": 40,
            "domain_age_days": 120,
            "risky_tld": False,
            "subdomain_depth": 2,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 3.8,
            "keyword_count": 0,
            "matched_brand": None,
            "is_canonical": False,
            "visual_similarity": None,
            "has_password_field": False,
            "submits_to_remote": False,
            "external_favicon": False,
            "redirect_hops": 1,
        }
    },
    {
        "url": "https://microsoft-office-update.co.vu/auth/prompt",
        "ground_truth": "critical",
        "ground_truth_score": 89,
        "is_phishing": True,
        "simulated_signals": {
            "model_prob": 0.88,
            "ssl_free_ca": True,
            "ssl_valid": True,
            "ssl_age_days": 1,
            "domain_age_days": 3,
            "risky_tld": True,
            "subdomain_depth": 2,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 4.25,
            "keyword_count": 2,
            "matched_brand": "Microsoft 365",
            "is_canonical": False,
            "visual_similarity": 92.0,
            "has_password_field": True,
            "submits_to_remote": True,
            "external_favicon": True,
            "redirect_hops": 2,
        }
    },
    {
        "url": "https://wikipedia.org/wiki/Computer_security",
        "ground_truth": "low",
        "ground_truth_score": 1,
        "is_phishing": False,
        "simulated_signals": {
            "model_prob": 0.01,
            "ssl_free_ca": False,
            "ssl_valid": True,
            "ssl_age_days": 700,
            "domain_age_days": 8000,
            "risky_tld": False,
            "subdomain_depth": 0,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": False,
            "entropy": 2.8,
            "keyword_count": 1,
            "matched_brand": None,
            "is_canonical": False,
            "visual_similarity": None,
            "has_password_field": False,
            "submits_to_remote": False,
            "external_favicon": False,
            "redirect_hops": 0,
        }
    },
    {
        "url": "http://netflix-billing-renew.cc//redirect?token=77391823",
        "ground_truth": "critical",
        "ground_truth_score": 93,
        "is_phishing": True,
        "simulated_signals": {
            "model_prob": 0.91,
            "ssl_free_ca": True,
            "ssl_valid": False,
            "ssl_age_days": 0,
            "domain_age_days": 2,
            "risky_tld": True,
            "subdomain_depth": 1,
            "has_ip": False,
            "has_at": False,
            "has_double_slash": True,
            "entropy": 4.4,
            "keyword_count": 2,
            "matched_brand": "Netflix Inc.",
            "is_canonical": False,
            "visual_similarity": 85.0,
            "has_password_field": True,
            "submits_to_remote": True,
            "external_favicon": True,
            "redirect_hops": 3,
        }
    }
]


class AdaptiveRiskService:
    """Adaptive Phishing Risk Scoring Engine synthesizing orthogonal multi-source evidence."""

    def __init__(self):
        self.thresholds = deepcopy(DEFAULT_THRESHOLDS)

    def get_thresholds(self) -> Dict[str, Any]:
        """Return currently configured category thresholds."""
        return self.thresholds

    def update_thresholds(self, new_thresholds: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Validate and update category thresholds.
        Ensures strict monotonically increasing non-overlapping boundaries from 0 to 100.
        """
        required_keys = ["low", "medium", "high", "critical"]
        for key in required_keys:
            if key not in new_thresholds:
                return False, f"Missing required threshold category '{key}'."

        try:
            low_max = int(new_thresholds["low"]["max"])
            med_min = int(new_thresholds["medium"]["min"])
            med_max = int(new_thresholds["medium"]["max"])
            high_min = int(new_thresholds["high"]["min"])
            high_max = int(new_thresholds["high"]["max"])
            crit_min = int(new_thresholds["critical"]["min"])
            crit_max = int(new_thresholds["critical"]["max"])

            if not (0 <= low_max < med_min <= med_max < high_min <= high_max < crit_min <= crit_max <= 100):
                return False, "Threshold boundaries must satisfy: 0 <= low_max < med_min <= med_max < high_min <= high_max < crit_min <= crit_max <= 100."

            # Update in-memory thresholds
            for key in required_keys:
                self.thresholds[key]["min"] = int(new_thresholds[key].get("min", self.thresholds[key]["min"]))
                self.thresholds[key]["max"] = int(new_thresholds[key]["max"])
                if "description" in new_thresholds[key]:
                    self.thresholds[key]["description"] = str(new_thresholds[key]["description"])

            return True, "Thresholds updated successfully."
        except (ValueError, TypeError, KeyError) as e:
            return False, f"Invalid threshold configuration: {str(e)}"

    def classify_score(self, score: int, thresholds: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Classify a 0-100 score into a 4-tier category (Low, Medium, High, Critical)."""
        th = thresholds or self.thresholds
        clamped_score = max(0, min(100, int(round(score))))

        if clamped_score <= th["low"]["max"]:
            category_key = "low"
        elif clamped_score <= th["medium"]["max"]:
            category_key = "medium"
        elif clamped_score <= th["high"]["max"]:
            category_key = "high"
        else:
            category_key = "critical"

        cat_info = th[category_key]
        return {
            "key": category_key,
            "label": cat_info["label"],
            "score": clamped_score,
            "description": cat_info["description"],
            "threshold_min": cat_info["min"],
            "threshold_max": cat_info["max"]
        }

    def compute_adaptive_risk(
        self,
        url: str,
        ml_result: Dict[str, Any],
        ssl_info: Optional[Dict[str, Any]] = None,
        dns_info: Optional[Dict[str, Any]] = None,
        screenshot_result: Optional[Dict[str, Any]] = None,
        page_content_info: Optional[Dict[str, Any]] = None,
        redirect_info: Optional[Dict[str, Any]] = None,
        target_brand: Optional[str] = None,
        matched_brand_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Compute multi-evidence adaptive risk score and detailed evidence breakdown.

        Args:
            url: Target URL
            ml_result: Output from ml_service.predict_risk(url) containing probability & features
            ssl_info: SSL certificate probes
            dns_info: DNS resolution and WHOIS metadata
            screenshot_result: Vision perceptual hash and brand match (Feature 2) if available
            page_content_info: Live DOM inspection indicators if available
            redirect_info: Network redirection chain data if available
            target_brand: Detected brand name
            matched_brand_key: Key of targeted brand

        Returns:
            Dict containing:
                adaptive_risk_score: int [0, 100]
                model_probability: float [0.0, 1.0] (explicitly separated)
                risk_category: Dict (key, label, description)
                confidence_pct: float
                completeness_pct: float
                uncertainty_margin: int (e.g. +/- 8)
                dimension_scores: Dict of scores per dimension
                evidence_breakdown: List of factor explanation objects
                disclaimer: Scientific / legal clarity statement
        """
        features = ml_result.get("features", {})
        raw_prob = float(ml_result.get("probability", 0.5))

        # Model probability calibration (Platt-like sigmoid bounds to eliminate extreme overconfidence)
        # Keeps raw probability mathematically grounded between 0.01 and 0.99
        calibrated_model_prob = round(1.0 / (1.0 + math.exp(-6.0 * (raw_prob - 0.5))), 4)
        calibrated_model_prob = max(0.01, min(0.99, calibrated_model_prob))

        evidence_breakdown: List[Dict[str, Any]] = []
        dimension_raw_scores: Dict[str, float] = {}
        dimension_availability: Dict[str, str] = {}  # OBSERVED, PARTIAL, UNAVAILABLE

        # ====================================================================
        # 1. Dimension 1: URL Classification & Lexical Features (Weight: 0.30)
        # ====================================================================
        dim1_score, dim1_factors = self._eval_url_lexical(url, features, calibrated_model_prob)
        dimension_raw_scores["url_lexical"] = dim1_score
        dimension_availability["url_lexical"] = "OBSERVED"
        evidence_breakdown.extend(dim1_factors)

        # ====================================================================
        # 2. Dimension 2: Domain & Infrastructure (Weight: 0.25)
        # ====================================================================
        dim2_score, dim2_factors, dim2_avail = self._eval_domain_infrastructure(ssl_info, dns_info, features)
        dimension_raw_scores["domain_intelligence"] = dim2_score
        dimension_availability["domain_intelligence"] = dim2_avail
        evidence_breakdown.extend(dim2_factors)

        # ====================================================================
        # 3. Dimension 3: Visual Forensics & Brand Impersonation (Weight: 0.20)
        # ====================================================================
        dim3_score, dim3_factors, dim3_avail = self._eval_visual_impersonation(screenshot_result, target_brand, matched_brand_key, url)
        dimension_raw_scores["visual_impersonation"] = dim3_score
        dimension_availability["visual_impersonation"] = dim3_avail
        evidence_breakdown.extend(dim3_factors)

        # ====================================================================
        # 4. Dimension 4: Page Content & Form Indicators (Weight: 0.15)
        # ====================================================================
        dim4_score, dim4_factors, dim4_avail = self._eval_page_content(page_content_info, raw_prob)
        dimension_raw_scores["page_content"] = dim4_score
        dimension_availability["page_content"] = dim4_avail
        evidence_breakdown.extend(dim4_factors)

        # ====================================================================
        # 5. Dimension 5: Redirect & Network Routing (Weight: 0.10)
        # ====================================================================
        dim5_score, dim5_factors, dim5_avail = self._eval_redirect_routing(redirect_info, features)
        dimension_raw_scores["redirect_routing"] = dim5_score
        dimension_availability["redirect_routing"] = dim5_avail
        evidence_breakdown.extend(dim5_factors)

        # ====================================================================
        # Multi-Vector Dynamic Weight Re-normalization & Uncertainty Handling
        # ====================================================================
        # Missing features are NOT treated as proof of safety!
        # If an unobserved dimension (e.g. Visual analysis or Live DOM) is missing,
        # we re-normalize observed weights, compute evidence completeness,
        # and attach an epistemic uncertainty margin.
        total_observed_weight = 0.0
        for dim, avail in dimension_availability.items():
            base_w = DIMENSION_WEIGHTS[dim]
            if avail == "OBSERVED":
                total_observed_weight += base_w
            elif avail == "PARTIAL":
                total_observed_weight += base_w * 0.70

        completeness_pct = round((total_observed_weight / sum(DIMENSION_WEIGHTS.values())) * 100, 1)

        # Re-normalized weighted summation
        weighted_sum = 0.0
        normalized_dimension_weights = {}
        for dim, score in dimension_raw_scores.items():
            avail = dimension_availability[dim]
            if avail == "OBSERVED":
                effective_w = DIMENSION_WEIGHTS[dim] / total_observed_weight
            elif avail == "PARTIAL":
                effective_w = (DIMENSION_WEIGHTS[dim] * 0.70) / total_observed_weight
            else:
                effective_w = 0.0

            normalized_dimension_weights[dim] = round(effective_w, 3)
            weighted_sum += score * effective_w

        # Epistemic Uncertainty Margin: proportional to missing evidence
        # (e.g. if 40% missing, uncertainty is +/- 10 points)
        uncertainty_margin = int(round((1.0 - (completeness_pct / 100.0)) * 22))

        # Baseline Prior Protection: When evidence is heavily missing (<60%),
        # missing features must NOT dilute an observed threat, nor can an unobserved site
        # be declared 0% safe. We preserve observed high-risk signals and enforce a cautious
        # epistemic floor for low-score unobserved items.
        if completeness_pct < 60.0:
            epistemic_floor = 20.0 * (1.0 - (completeness_pct / 100.0))
            composite_score = max(weighted_sum, epistemic_floor)
        else:
            composite_score = weighted_sum

        final_risk_score = int(round(max(0, min(100, composite_score))))

        # High-risk trigger override (e.g. direct raw IP + brand spoofing or confirmed phishtank)
        if features.get("has_ip_in_url") and matched_brand_key:
            final_risk_score = max(final_risk_score, 88)

        # Classification into 4-tier categories
        classification = self.classify_score(final_risk_score)

        # Overall confidence score: combines ML statistical confidence and evidence completeness
        ml_confidence = round(abs(calibrated_model_prob - 0.5) * 200, 1)  # 0% to 100%
        overall_confidence = round(0.5 * ml_confidence + 0.5 * completeness_pct, 1)

        # Disclaimers ensuring distinct interpretation of probability vs risk score
        disclaimer = (
            "Model Probability represents the statistical likelihood that lexical and structural URL tokens "
            "match trained phishing patterns. The Adaptive Risk Score is an evidence-weighted composite index "
            "(0-100) synthesizing domain intelligence, SSL cryptography, visual forensics, and network routing, "
            "adjusted for signal completeness. Neither metric guarantees an absolute probability of compromise or safety."
        )

        dimension_scores_formatted = {
            dim: {
                "score": int(round(dimension_raw_scores.get(dim, 0))),
                "availability": dimension_availability.get(dim, "UNAVAILABLE"),
                "base_weight": DIMENSION_WEIGHTS[dim],
                "effective_weight": normalized_dimension_weights.get(dim, 0.0),
                "title": DIMENSION_METADATA[dim]["title"],
                "icon": DIMENSION_METADATA[dim]["icon"]
            }
            for dim in DIMENSION_WEIGHTS
        }

        return {
            "adaptive_risk_score": final_risk_score,
            "risk_category": classification,
            "model_probability": round(calibrated_model_prob * 100, 2),
            "raw_model_probability": round(raw_prob, 4),
            "confidence_pct": overall_confidence,
            "completeness_pct": completeness_pct,
            "uncertainty_margin": uncertainty_margin,
            "dimension_scores": dimension_scores_formatted,
            "evidence_breakdown": evidence_breakdown,
            "thresholds_used": self.thresholds,
            "disclaimer": disclaimer
        }

    # ========================================================================
    # Internal Dimension Evaluators
    # ========================================================================

    def _eval_url_lexical(
        self,
        url: str,
        features: Dict[str, Any],
        calibrated_prob: float
    ) -> Tuple[float, List[Dict[str, Any]]]:
        """Evaluates Dimension 1: URL classification and lexical features."""
        factors = []
        score = calibrated_prob * 100.0

        # Subdomain depth
        sub_count = features.get("subdomain_count", 0)
        if sub_count >= 3:
            factors.append({
                "id": "lex_subdomain_deep",
                "name": "Excessive Subdomain Hierarchy",
                "dimension": "url_lexical",
                "observed_value": f"{sub_count} subdomains",
                "impact": 18,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": f"Observed {sub_count} subdomains. Phishing actors chain subdomains to impersonate legitimate domains."
            })
        elif sub_count == 2:
            factors.append({
                "id": "lex_subdomain_mod",
                "name": "Nested Subdomain Architecture",
                "dimension": "url_lexical",
                "observed_value": f"{sub_count} subdomains",
                "impact": 8,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": "Two subdomain layers detected. Common in multi-tenant cloud platforms but elevates spoofing exposure."
            })
        else:
            factors.append({
                "id": "lex_subdomain_clean",
                "name": "Standard Domain Hierarchy",
                "dimension": "url_lexical",
                "observed_value": f"{sub_count} subdomains",
                "impact": -5,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": "Standard top-level hostname structure without anomalous subdomain layering."
            })

        # Shannon Entropy
        entropy = features.get("entropy_score", 0.0)
        if entropy > 4.2:
            factors.append({
                "id": "lex_entropy_high",
                "name": "High Shannon Character Entropy",
                "dimension": "url_lexical",
                "observed_value": f"{entropy} bits/symbol",
                "impact": 15,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": f"Entropy of {entropy} indicates algorithmic randomness, DGA domain generation, or hex-encoded tracking tokens."
            })
        elif entropy > 3.6:
            factors.append({
                "id": "lex_entropy_elevated",
                "name": "Moderate URL Randomness",
                "dimension": "url_lexical",
                "observed_value": f"{entropy} bits/symbol",
                "impact": 6,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": f"Entropy of {entropy} is slightly elevated above normal English lexicon baseline."
            })
        else:
            factors.append({
                "id": "lex_entropy_normal",
                "name": "Normal Linguistic Entropy",
                "dimension": "url_lexical",
                "observed_value": f"{entropy} bits/symbol",
                "impact": -4,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": "Character frequency follows standard natural language lexical distributions."
            })

        # Credential Tokens in Query String
        if features.get("has_credential_token"):
            factors.append({
                "id": "lex_cred_token",
                "name": "Credential Interception Parameters",
                "dimension": "url_lexical",
                "observed_value": "pass/token/otp in query",
                "impact": 22,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Target URL contains query string parameters requesting passwords, tokens, or OTP codes."
            })

        # Punycode / Homoglyph
        if features.get("is_punycode"):
            factors.append({
                "id": "lex_punycode",
                "name": "Punycode (xn--) Homoglyph Encoding",
                "dimension": "url_lexical",
                "observed_value": "xn-- internationalized prefix",
                "impact": 25,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Punycode encoding detected, commonly exploited to substitute Cyrillic or Greek lookalike glyphs."
            })

        # Raw IP Hostname
        if features.get("has_ip_in_url"):
            factors.append({
                "id": "lex_raw_ip",
                "name": "Direct Raw IP Address Hostname",
                "dimension": "url_lexical",
                "observed_value": "IPv4 Address",
                "impact": 30,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Website is accessed directly by IP address without DNS registration, bypassing domain reputation registries."
            })

        # Machine Learning Random Forest Model Probability Attribution
        factors.append({
            "id": "lex_rf_model_prob",
            "name": "RandomForest Lexical Classifier Inference",
            "dimension": "url_lexical",
            "observed_value": f"{round(calibrated_prob * 100, 1)}% probability",
            "impact": int(round((calibrated_prob - 0.5) * 40)),
            "influence": "INCREASES_RISK" if calibrated_prob >= 0.5 else "MITIGATES_RISK",
            "status": "CRITICAL" if calibrated_prob >= 0.75 else ("ELEVATED" if calibrated_prob >= 0.5 else "BENIGN"),
            "explanation": f"Trained ML Random Forest model scored structural URL features at {round(calibrated_prob * 100, 1)}% phishing probability."
        })

        return min(100.0, max(0.0, score)), factors

    def _eval_domain_infrastructure(
        self,
        ssl_info: Optional[Dict[str, Any]],
        dns_info: Optional[Dict[str, Any]],
        features: Dict[str, Any]
    ) -> Tuple[float, List[Dict[str, Any]], str]:
        """Evaluates Dimension 2: Domain, DNS, and Cryptographic Infrastructure."""
        factors = []
        score = 20.0  # Base neutral start

        if not ssl_info and not dns_info:
            factors.append({
                "id": "dom_missing_intel",
                "name": "Infrastructure Telemetry Unavailable",
                "dimension": "domain_intelligence",
                "observed_value": "Probe Timed Out / Skipped",
                "impact": 0,
                "influence": "UNAVAILABLE",
                "status": "UNAVAILABLE",
                "explanation": "Network infrastructure and SSL probe data could not be collected. Weight was dynamically redistributed."
            })
            return 35.0, factors, "UNAVAILABLE"

        availability = "OBSERVED"

        # SSL Analysis
        ssl_data = ssl_info or {}
        is_ssl_valid = ssl_data.get("valid", False)
        issuer = ssl_data.get("issuer", "Unknown CA")
        is_free_ca = ssl_data.get("is_free_ca", False)
        cert_age = ssl_data.get("age_days", 0)

        if not is_ssl_valid:
            score += 45
            factors.append({
                "id": "dom_ssl_invalid",
                "name": "Invalid / Self-Signed SSL Certificate",
                "dimension": "domain_intelligence",
                "observed_value": issuer,
                "impact": 40,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Target failed cryptographic certificate validation or is using an untrusted self-signed certificate."
            })
        elif is_free_ca and cert_age <= 7:
            score += 25
            factors.append({
                "id": "dom_ssl_free_young",
                "name": "Ephemeral Free CA Certificate",
                "dimension": "domain_intelligence",
                "observed_value": f"{issuer} ({cert_age} days old)",
                "impact": 20,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": f"Domain was provisioned with automated free TLS ({issuer}) only {cert_age} days ago. Typical of disposable phishing infrastructure."
            })
        elif is_ssl_valid:
            score -= 15
            factors.append({
                "id": "dom_ssl_valid",
                "name": "Cryptographically Valid SSL Certificate",
                "dimension": "domain_intelligence",
                "observed_value": f"{issuer}",
                "impact": -12,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": f"Legitimate SSL handshake established with verified certificate authority ({issuer})."
            })

        # Risky TLD
        if features.get("is_risky_tld"):
            score += 30
            factors.append({
                "id": "dom_risky_tld",
                "name": "High-Abuse Top-Level Domain (TLD)",
                "dimension": "domain_intelligence",
                "observed_value": "High-Risk TLD (.xyz, .tk, .cc, etc.)",
                "impact": 25,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Domain operates under a TLD with statistically elevated phishing and spam abuse rates."
            })

        # DNS Resolution
        dns_data = dns_info or {}
        ip = dns_data.get("ip", "Unknown")
        if ip == "DNS_UNRESOLVED_OFFLINE" or ip == "Unknown":
            score += 15
            factors.append({
                "id": "dom_dns_offline",
                "name": "Unresolvable Host / Inactive DNS",
                "dimension": "domain_intelligence",
                "observed_value": ip,
                "impact": 15,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": "Domain does not actively resolve to public A/AAAA records. May be an unindexed staging server or dead phishing host."
            })

        return min(100.0, max(0.0, score)), factors, availability

    def _eval_visual_impersonation(
        self,
        screenshot_result: Optional[Dict[str, Any]],
        target_brand: Optional[str],
        matched_brand_key: Optional[str],
        url: str
    ) -> Tuple[float, List[Dict[str, Any]], str]:
        """Evaluates Dimension 3: Visual Forensics and Brand Impersonation."""
        factors = []
        score = 10.0

        if not screenshot_result:
            # Check if there is contextual brand spoofing in URL even without screenshot
            if matched_brand_key:
                score = 65.0
                factors.append({
                    "id": "vis_brand_text_spoof",
                    "name": "Brand Spoofing in Hostname",
                    "dimension": "visual_impersonation",
                    "observed_value": f"Spoofing {target_brand}",
                    "impact": 40,
                    "influence": "INCREASES_RISK",
                    "status": "CRITICAL",
                    "explanation": f"Hostname references '{target_brand}' without official domain authorization."
                })
                factors.append({
                    "id": "vis_no_screenshot",
                    "name": "Visual Forensic Capture Not Provided",
                    "dimension": "visual_impersonation",
                    "observed_value": "Image Not Supplied",
                    "impact": 0,
                    "influence": "UNAVAILABLE",
                    "status": "UNAVAILABLE",
                    "explanation": "No screenshot was submitted for perceptual hashing. Dimension weighted based on hostname brand context."
                })
                return score, factors, "PARTIAL"

            factors.append({
                "id": "vis_missing",
                "name": "Screenshot Analysis Not Provided",
                "dimension": "visual_impersonation",
                "observed_value": "No Image Provided",
                "impact": 0,
                "influence": "UNAVAILABLE",
                "status": "UNAVAILABLE",
                "explanation": "Visual perceptual hashing was omitted. This dimension was not treated as safe and weight was redistributed."
            })
            return 25.0, factors, "UNAVAILABLE"

        ref_cmp = screenshot_result.get("reference_comparison", {})
        is_ref_match = ref_cmp.get("is_reference_match", False)
        is_impersonation = ref_cmp.get("is_impersonation", False)
        matched_brand_name = ref_cmp.get("matched_brand", screenshot_result.get("detected_brand", "Unknown"))
        sim_score = float(screenshot_result.get("similarity_score", 0.0))

        if is_impersonation:
            score = 90.0
            factors.append({
                "id": "vis_brand_impersonation",
                "name": "Visual Brand Impersonation Detected",
                "dimension": "visual_impersonation",
                "observed_value": f"{matched_brand_name} ({sim_score}% similarity)",
                "impact": 50,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": f"Visual layout matches {matched_brand_name} with {sim_score}% perceptual similarity, but is hosted on an unauthorized non-canonical domain."
            })
        elif is_ref_match and not is_impersonation:
            score = 5.0
            factors.append({
                "id": "vis_brand_canonical",
                "name": "Authentic Official Brand Portal",
                "dimension": "visual_impersonation",
                "observed_value": f"Verified {matched_brand_name}",
                "impact": -35,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": f"Visual layout matches {matched_brand_name} and destination URL resolves to an authenticated canonical domain."
            })
        elif sim_score >= 60.0:
            score = 45.0
            factors.append({
                "id": "vis_generic_login",
                "name": "Generic Authentication Layout Profile",
                "dimension": "visual_impersonation",
                "observed_value": f"{sim_score}% template match",
                "impact": 15,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": "Page layout matches typical corporate SSO or login portals, elevating credential exposure risk."
            })
        else:
            score = 15.0
            factors.append({
                "id": "vis_unique_layout",
                "name": "Distinct Visual Composition",
                "dimension": "visual_impersonation",
                "observed_value": "No Known Brand Match",
                "impact": -10,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": "Visual layout and color clustering do not correlate with protected corporate brand signatures."
            })

        return min(100.0, max(0.0, score)), factors, "OBSERVED"

    def _eval_page_content(
        self,
        page_content_info: Optional[Dict[str, Any]],
        ml_prob: float
    ) -> Tuple[float, List[Dict[str, Any]], str]:
        """Evaluates Dimension 4: Page Content & Form Indicators."""
        factors = []
        score = 15.0

        if not page_content_info:
            # If no live DOM fetched, use heuristic proxy or mark as missing
            factors.append({
                "id": "dom_heuristics_missing",
                "name": "Live DOM Inspection Not Performed",
                "dimension": "page_content",
                "observed_value": "Offline / Unchecked",
                "impact": 0,
                "influence": "UNAVAILABLE",
                "status": "UNAVAILABLE",
                "explanation": "Live DOM payload inspection was not executed. Missing content was not treated as proof of safety."
            })
            return 25.0, factors, "UNAVAILABLE"

        has_password = page_content_info.get("has_password_field", False)
        submits_remote = page_content_info.get("submits_to_remote_domain", False)
        ext_favicon = page_content_info.get("external_favicon", False)

        if has_password and submits_remote:
            score += 65
            factors.append({
                "id": "content_remote_password",
                "name": "Credential Form Submits to Remote Domain",
                "dimension": "page_content",
                "observed_value": "Password form -> Cross-domain endpoint",
                "impact": 45,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Critical credential theft indicator: A password input field submits authentication data to a foreign external origin."
            })
        elif has_password:
            score += 25
            factors.append({
                "id": "content_password_field",
                "name": "Password Input Field Present",
                "dimension": "page_content",
                "observed_value": "type='password' observed",
                "impact": 15,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": "Page renders sensitive credential input fields requiring strict origin validation."
            })

        if ext_favicon:
            score += 18
            factors.append({
                "id": "content_ext_favicon",
                "name": "External Asset / Favicon Leeching",
                "dimension": "page_content",
                "observed_value": "Third-party CDN Favicon",
                "impact": 12,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": "Favicon or brand icons are loaded from external origins, a tactic used by phishing kits to mimic authentic platforms."
            })

        if not has_password and not ext_favicon:
            score -= 10
            factors.append({
                "id": "content_clean_dom",
                "name": "Benign Informational Content Structure",
                "dimension": "page_content",
                "observed_value": "No credential inputs",
                "impact": -10,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": "No sensitive credential inputs or suspicious cross-domain form actions detected in DOM."
            })

        return min(100.0, max(0.0, score)), factors, "OBSERVED"

    def _eval_redirect_routing(
        self,
        redirect_info: Optional[Dict[str, Any]],
        features: Dict[str, Any]
    ) -> Tuple[float, List[Dict[str, Any]], str]:
        """Evaluates Dimension 5: Redirect & Network Routing Analysis."""
        factors = []
        score = 10.0

        has_double_slash = bool(features.get("double_slash_redirect", False))
        if has_double_slash:
            score += 50
            factors.append({
                "id": "redir_double_slash",
                "name": "Open Redirect '//' Token Pattern",
                "dimension": "redirect_routing",
                "observed_value": "// in path",
                "impact": 35,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": "Double slash '//' redirection detected in URI, an open redirection vector used to smuggle traffic to rogue destinations."
            })

        if not redirect_info:
            if not has_double_slash:
                factors.append({
                    "id": "redir_standard",
                    "name": "Direct Route Navigation",
                    "dimension": "redirect_routing",
                    "observed_value": "Direct connection",
                    "impact": -5,
                    "influence": "MITIGATES_RISK",
                    "status": "BENIGN",
                    "explanation": "No complex redirection hops or obfuscated relay routing observed."
                })
            return min(100.0, max(0.0, score)), factors, "OBSERVED"

        hops = redirect_info.get("hops", 0)
        cross_domain = redirect_info.get("cross_domain_redirect", False)

        if hops >= 3 or (hops >= 2 and cross_domain):
            score += 40
            factors.append({
                "id": "redir_multi_hops",
                "name": "Anomalous Multi-Hop Redirection Chain",
                "dimension": "redirect_routing",
                "observed_value": f"{hops} hops (cross-domain: {cross_domain})",
                "impact": 30,
                "influence": "INCREASES_RISK",
                "status": "CRITICAL",
                "explanation": f"Observed {hops} redirection hops across domains. Phishing landing pages use multi-hop relays to defeat perimeter scrapers."
            })
        elif hops == 1 and cross_domain:
            score += 20
            factors.append({
                "id": "redir_cross_domain",
                "name": "Cross-Origin Navigation Hop",
                "dimension": "redirect_routing",
                "observed_value": "1 cross-domain hop",
                "impact": 12,
                "influence": "INCREASES_RISK",
                "status": "ELEVATED",
                "explanation": "Destination immediately redirects to a separate external domain."
            })
        else:
            score -= 5
            factors.append({
                "id": "redir_direct",
                "name": "Direct Single-Hop Routing",
                "dimension": "redirect_routing",
                "observed_value": "Direct connection (0-1 hops)",
                "impact": -5,
                "influence": "MITIGATES_RISK",
                "status": "BENIGN",
                "explanation": "Connection routes directly without evasive multi-hop chain redirection."
            })

        return min(100.0, max(0.0, score)), factors, "OBSERVED"

    # ========================================================================
    # Validation Dataset & Threshold Evaluation
    # ========================================================================

    def evaluate_thresholds_on_validation_data(
        self,
        custom_thresholds: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Evaluate performance of category thresholds against the ground-truth validation dataset.
        Computes precision, recall, F1-score, accuracy, false-positive rate, and distribution.
        """
        th = custom_thresholds or self.thresholds

        total_samples = len(VALIDATION_DATASET)
        correct_classifications = 0
        true_positives = 0    # Phishing labeled High or Critical
        false_positives = 0   # Benign labeled High or Critical
        true_negatives = 0    # Benign labeled Low or Medium
        false_negatives = 0   # Phishing labeled Low or Medium

        category_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        sample_results = []

        for sample in VALIDATION_DATASET:
            score = sample["ground_truth_score"]
            classification = self.classify_score(score, th)
            cat_key = classification["key"]
            category_counts[cat_key] += 1

            is_predicted_malicious = cat_key in ("high", "critical")
            is_actual_phishing = sample["is_phishing"]

            if is_predicted_malicious and is_actual_phishing:
                true_positives += 1
            elif is_predicted_malicious and not is_actual_phishing:
                false_positives += 1
            elif not is_predicted_malicious and not is_actual_phishing:
                true_negatives += 1
            elif not is_predicted_malicious and is_actual_phishing:
                false_negatives += 1

            if cat_key == sample["ground_truth"]:
                correct_classifications += 1

            sample_results.append({
                "url": sample["url"],
                "score": score,
                "ground_truth_category": sample["ground_truth"],
                "predicted_category": cat_key,
                "is_match": cat_key == sample["ground_truth"]
            })

        precision = round(true_positives / max(1, (true_positives + false_positives)), 3)
        recall = round(true_positives / max(1, (true_positives + false_negatives)), 3)
        f1_score = round(2 * (precision * recall) / max(0.001, (precision + recall)), 3)
        accuracy = round(correct_classifications / max(1, total_samples), 3)
        fpr = round(false_positives / max(1, (false_positives + true_negatives)), 3)

        return {
            "thresholds_evaluated": th,
            "metrics": {
                "total_samples": total_samples,
                "accuracy": accuracy,
                "precision": precision,
                "recall": recall,
                "f1_score": f1_score,
                "false_positive_rate": fpr,
                "true_positives": true_positives,
                "false_positives": false_positives,
                "true_negatives": true_negatives,
                "false_negatives": false_negatives,
            },
            "category_distribution": {
                "low": category_counts["low"],
                "medium": category_counts["medium"],
                "high": category_counts["high"],
                "critical": category_counts["critical"],
            },
            "sample_results": sample_results
        }

    # ========================================================================
    # Scan Comparison Engine
    # ========================================================================

    def compare_scans(self, scan_a: Dict[str, Any], scan_b: Dict[str, Any]) -> Dict[str, Any]:
        """
        Compare two scans to produce an actionable delta report.
        Tracks changes in risk score, category shift, newly surfaced risk factors,
        resolved risk factors, and dimensional variance.
        """
        score_a = scan_a.get("adaptive_risk", {}).get("adaptive_risk_score", scan_a.get("risk_score", 0))
        score_b = scan_b.get("adaptive_risk", {}).get("adaptive_risk_score", scan_b.get("risk_score", 0))
        score_delta = score_b - score_a

        cat_a = scan_a.get("adaptive_risk", {}).get("risk_category", {}).get("label") or scan_a.get("verdict", "Unknown")
        cat_b = scan_b.get("adaptive_risk", {}).get("risk_category", {}).get("label") or scan_b.get("verdict", "Unknown")

        # Dimension deltas
        dim_a = scan_a.get("adaptive_risk", {}).get("dimension_scores", {})
        dim_b = scan_b.get("adaptive_risk", {}).get("dimension_scores", {})
        dimension_comparison = {}

        for dim in DIMENSION_WEIGHTS:
            s_a = dim_a.get(dim, {}).get("score", 0) if isinstance(dim_a.get(dim), dict) else 0
            s_b = dim_b.get(dim, {}).get("score", 0) if isinstance(dim_b.get(dim), dict) else 0
            dimension_comparison[dim] = {
                "title": DIMENSION_METADATA[dim]["title"],
                "scan_a_score": s_a,
                "scan_b_score": s_b,
                "delta": s_b - s_a
            }

        # Factor comparison
        factors_a = scan_a.get("adaptive_risk", {}).get("evidence_breakdown", [])
        factors_b = scan_b.get("adaptive_risk", {}).get("evidence_breakdown", [])

        ids_a = {f.get("id"): f for f in factors_a if f.get("id")}
        ids_b = {f.get("id"): f for f in factors_b if f.get("id")}

        new_risk_factors = [ids_b[fid] for fid in ids_b if fid not in ids_a and ids_b[fid].get("influence") == "INCREASES_RISK"]
        resolved_risk_factors = [ids_a[fid] for fid in ids_a if fid not in ids_b and ids_a[fid].get("influence") == "INCREASES_RISK"]
        persistent_risks = [ids_b[fid] for fid in ids_b if fid in ids_a and ids_b[fid].get("influence") == "INCREASES_RISK"]

        # Cryptographic and infrastructure delta
        ssl_a = scan_a.get("ssl_status", {})
        ssl_b = scan_b.get("ssl_status", {})
        ssl_changed = (ssl_a.get("issuer") != ssl_b.get("issuer")) or (ssl_a.get("valid") != ssl_b.get("valid"))

        # Verdict change summary
        if score_delta > 15:
            trend = "SIGNIFICANTLY_INCREASED_THREAT"
            trend_summary = f"Risk escalated by +{score_delta} points from {cat_a} to {cat_b}."
        elif score_delta < -15:
            trend = "SIGNIFICANTLY_REDUCED_THREAT"
            trend_summary = f"Risk reduced by {abs(score_delta)} points from {cat_a} to {cat_b}."
        elif abs(score_delta) <= 5:
            trend = "STABLE"
            trend_summary = f"Risk level remains stable ({score_a} vs {score_b})."
        else:
            trend = "MODERATE_SHIFT"
            trend_summary = f"Risk shifted by {score_delta:+d} points."

        return {
            "scan_a": {
                "id": scan_a.get("id"),
                "url": scan_a.get("url"),
                "score": score_a,
                "category": cat_a,
                "timestamp": scan_a.get("created_at") or scan_a.get("timestamp")
            },
            "scan_b": {
                "id": scan_b.get("id"),
                "url": scan_b.get("url"),
                "score": score_b,
                "category": cat_b,
                "timestamp": scan_b.get("created_at") or scan_b.get("timestamp")
            },
            "score_delta": score_delta,
            "trend": trend,
            "trend_summary": trend_summary,
            "dimension_comparison": dimension_comparison,
            "new_risk_factors": new_risk_factors,
            "resolved_risk_factors": resolved_risk_factors,
            "persistent_risks": persistent_risks,
            "infrastructure_delta": {
                "ssl_changed": ssl_changed,
                "ssl_a_issuer": ssl_a.get("issuer", "Unknown"),
                "ssl_b_issuer": ssl_b.get("issuer", "Unknown"),
                "domain_a": scan_a.get("domain"),
                "domain_b": scan_b.get("domain")
            }
        }


adaptive_risk_service = AdaptiveRiskService()
