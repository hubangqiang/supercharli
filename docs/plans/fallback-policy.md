# Fallback Policy

## Trigger Conditions
- Primary model timeout or API error.
- Policy mismatch for required capability.
- Provider-level instability detected.

## Fallback Chain
- Step 1: retry primary once under bounded timeout.
- Step 2: switch to configured secondary model.
- Step 3: switch to safe minimal response mode if chain fails.

## User-visible Behavior
- Keep tone and identity stable during fallback.
- Mark uncertainty when response quality may be reduced.
- Continue with actionable guidance whenever possible.
