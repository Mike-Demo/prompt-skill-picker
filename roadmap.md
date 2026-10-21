# Public abuse protection

- [x] Add shared CAPTCHA verification and public action wiring.
- [x] Harden existing durable quotas and concurrent-request counting.
- [x] Test failed verification, signed-proof success, and quota rejection; browser challenge opens without sign-in.
- [ ] Real CAPTCHA success in hosted preview: localhost is rejected by hCaptcha's configured site key.
- [x] Run available security scan; it does not rerun the five code-path checks. Previously ignored findings cannot be restored or marked fixed by the agent.