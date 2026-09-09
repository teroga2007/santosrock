import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es.json'
import en from './locales/en.json'
import contentEn from './locales/content.en.json'

let language = 'es'
try { language = localStorage.getItem('santosrock-language') === 'en' ? 'en' : 'es' } catch { /* Storage is optional. */ }
void i18n.use(initReactI18next).init({ resources: { es: { translation: es }, en: { translation: en, content: contentEn } }, lng: language, fallbackLng: 'es', interpolation: { escapeValue: false } })
export default i18n
