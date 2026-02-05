# Task: Multi-Language Support (i18n)

**Priority**: Medium
**Category**: Enhancement
**Estimated Complexity**: Medium

## Description

Implement internationalization (i18n) to support multiple languages for global events and diverse audiences.

## Requirements

1. **Language Support**
   - English (default)
   - Spanish
   - French
   - German
   - Japanese
   - Chinese (Simplified)
   - Filipino/Tagalog

2. **Translation Coverage**
   - UI labels and buttons
   - Error messages
   - Kiosk instructions
   - Settings descriptions
   - Date/time formats

3. **Configuration**
   - Language selector in settings
   - Per-event language override
   - Browser language detection
   - RTL support (for Arabic, Hebrew)

4. **Implementation**
   - Use next-intl or react-i18next
   - JSON translation files
   - Fallback to English
   - Dynamic loading of translations

## Files to Modify/Create

- `lib/i18n/` - Internationalization module
  - `config.ts`
  - `translations/en.json`
  - `translations/es.json`
  - `translations/fr.json`
  - etc.
- `components/settings/LanguageSelector.tsx`
- `app/layout.tsx` - Add i18n provider
- Update all components with translation keys

## Dependencies

```json
{
  "next-intl": "^3.x"
}
```

## Acceptance Criteria

- [ ] Language can be changed in settings
- [ ] All UI text is translatable
- [ ] Kiosk shows selected language
- [ ] Date/time formats localized
- [ ] RTL layout works (if implemented)

## Related Spec Sections

- Section 10: Styling
- Section 4: Components
