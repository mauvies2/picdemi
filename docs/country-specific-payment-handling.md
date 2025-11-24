# Country-Specific Payment Handling

This document outlines how payment account handling differs by country and what considerations should be made for each region.

## Overview

Different countries have different banking systems, regulations, and preferred payment methods. This guide helps understand these differences and how to handle them appropriately.

## Country-Specific Considerations

### United States (US)
- **Bank Format**: Routing Number (9 digits) + Account Number
- **Payment Methods**: ACH transfers, Wire transfers, PayPal
- **Tax Requirements**: EIN (Employer Identification Number) for businesses
- **Regulations**: 
  - 1099-K reporting for payments over $600/year
  - Bank account verification via micro-deposits
- **Currency**: USD
- **Processing Time**: 1-3 business days for ACH

### United Kingdom (GB)
- **Bank Format**: Sort Code (6 digits, XX-XX-XX) + Account Number (8 digits)
- **Payment Methods**: Faster Payments, BACS, CHAPS, PayPal
- **Tax Requirements**: VAT number for businesses, National Insurance for individuals
- **Regulations**:
  - HMRC reporting requirements
  - Strong Customer Authentication (SCA) required
- **Currency**: GBP
- **Processing Time**: Same-day for Faster Payments, 3 days for BACS

### European Union (EU) - IBAN Countries
- **Bank Format**: IBAN (International Bank Account Number)
- **Payment Methods**: SEPA (Single Euro Payments Area), PayPal
- **Tax Requirements**: VAT number (varies by country threshold)
- **Regulations**:
  - GDPR compliance
  - PSD2 (Payment Services Directive 2)
  - SEPA regulations
- **Currency**: EUR (most countries)
- **Processing Time**: 1-2 business days for SEPA

### Canada (CA)
- **Bank Format**: Transit Number (5 digits) + Institution Number (3 digits) + Account Number
- **Payment Methods**: EFT, Wire transfers, PayPal
- **Tax Requirements**: SIN (Social Insurance Number) or Business Number
- **Regulations**:
  - CRA reporting requirements
  - Bank account verification
- **Currency**: CAD
- **Processing Time**: 1-2 business days

### Australia (AU)
- **Bank Format**: BSB (6 digits, XXX-XXX) + Account Number
- **Payment Methods**: Osko (real-time), Direct Entry, PayPal
- **Tax Requirements**: ABN (Australian Business Number) or TFN (Tax File Number)
- **Regulations**:
  - ATO reporting requirements
  - Real-time payments via Osko
- **Currency**: AUD
- **Processing Time**: Real-time (Osko) or 1-2 business days

## Payment Method Preferences by Region

### North America
- **Preferred**: Bank transfers (ACH/EFT), PayPal
- **Less Common**: Wire transfers (higher fees)

### Europe
- **Preferred**: SEPA transfers, PayPal
- **Less Common**: Wire transfers (expensive)

### Asia-Pacific
- **Preferred**: Bank transfers, PayPal, Local payment methods (Alipay, etc.)
- **Currency Considerations**: Multi-currency support often needed

## Tax and Compliance Considerations

### Tax ID Collection
- **When Required**: 
  - US: For payments over $600/year (1099-K)
  - EU: For VAT-registered businesses
  - UK: For self-employed individuals
- **Storage**: Encrypted, secure storage required
- **Display**: Never show full tax ID in UI (mask last 4 digits)

### Verification Requirements
- **US**: Micro-deposits (2 small deposits to verify account)
- **EU**: SEPA mandate may be required
- **UK**: Faster Payments verification
- **General**: Account holder name verification

## Recommended Implementation Strategy

### Phase 1: Basic Support (Current)
- ✅ Country selection
- ✅ Country-specific field formats
- ✅ Basic validation
- ✅ Address collection during onboarding

### Phase 2: Enhanced Validation
- [ ] IBAN validation (checksum verification)
- [ ] Routing number validation (US)
- [ ] Sort code validation (UK)
- [ ] BSB validation (Australia)

### Phase 3: Tax Compliance
- [ ] Tax ID collection and validation
- [ ] Tax form generation (1099-K, etc.)
- [ ] Tax reporting dashboard

### Phase 4: Payment Processing Integration
- [ ] Stripe Connect integration (if needed)
- [ ] Direct bank transfer support
- [ ] Multi-currency support
- [ ] Real-time payment status

### Phase 5: Advanced Features
- [ ] Account verification workflows
- [ ] Micro-deposit verification (US)
- [ ] SEPA mandate handling (EU)
- [ ] Payment method preferences by country

## Security Considerations

1. **Data Storage**: 
   - Never store full account numbers
   - Store only last 4 digits for display
   - Encrypt sensitive data at rest

2. **Transmission**:
   - Use HTTPS for all data transmission
   - Never log sensitive account information

3. **Access Control**:
   - Only photographers can view their own accounts
   - Admins need explicit permission to view account details

## Future Enhancements

### Stripe Connect
If moving to automated payouts:
- **US**: Stripe Connect with ACH
- **EU**: Stripe Connect with SEPA
- **UK**: Stripe Connect with Faster Payments
- **Multi-country**: Stripe Connect handles country-specific requirements

### Alternative Payment Methods
- **Wise (formerly TransferWise)**: Good for international transfers
- **PayPal**: Universal but higher fees
- **Revolut**: Good for EU/UK
- **Local Payment Methods**: Consider region-specific options

## References

- [Stripe Connect Documentation](https://stripe.com/docs/connect)
- [SEPA Payment Information](https://www.ecb.europa.eu/paym/sepa/html/index.en.html)
- [ACH Network Information](https://www.nacha.org/)
- [UK Faster Payments](https://www.fasterpayments.org.uk/)

