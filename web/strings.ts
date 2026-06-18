const Strings_en = {
    langName_en: "English",
    langName_fr: "French",
    langName_de: "German",
    langName_it: "Italian",

    shapes: "Shapes",
    placement: "Placement",
    colors: "Colors",
    sizes: "Sizes",
    rotation: "Rotation",
    parseStatus: "Parse status",
    codeCompiles: "Code valid",
    codeHasErrors: "Code has errors",
    settings: "Settings",
    uiLang: "UI Language",
    dialect: "Dialect",
    showCheatSheet: "Show Cheat Sheet",
    showPartialInput: "Show Partial Input",
}

type Strings = typeof Strings_en

const Strings_fr = {
    langName_en: "Anglais",
    langName_fr: "Français",
    langName_de: "Allemand",
    langName_it: "Italien",

    shapes: "Formes",
    placement: "Poses",
    colors: "Couleurs",
    sizes: "Taille",
    rotation: "Rotation",
    parseStatus: "Statut de l’analyse",
    codeCompiles: "Le code est valide",
    codeHasErrors: "Le code est erronné",
    settings: "Réglages",
    uiLang: "Interface",
    dialect: "Dialecte",
    showCheatSheet: "Afficher l’aide-mémoire",
    showPartialInput: "Afficher éléments partiels",
} satisfies Strings

const Strings_de = {
    langName_en: "Englisch",
    langName_fr: "Französisch",
    langName_de: "Deutsch",
    langName_it: "Italienisch",

    shapes: "Formen",
    placement: "Platzierung",
    colors: "Farben",
    sizes: "Größen",
    rotation: "Rotation",
    parseStatus: "Analyse-Status",
    codeCompiles: "Code ist gültig",
    codeHasErrors: "Code hat Fehler",
    settings: "Einstellungen",
    uiLang: "Benutzeroberfläche",
    dialect: "Dialekt",
    showCheatSheet: "Spickzettel anzeigen",
    showPartialInput: "Teilweise Eingabe anzeigen",
} satisfies Strings

const Strings_it = {
    langName_en: "Inglese",
    langName_fr: "Francese",
    langName_de: "Tedesco",
    langName_it: "Italiano",

    shapes: "Forme",
    placement: "Posizionamento",
    colors: "Colori",
    sizes: "Dimensioni",
    rotation: "Rotazione",
    parseStatus: "Stato dell’analisi",
    codeCompiles: "Il codice è valido",
    codeHasErrors: "Il codice ha errori",
    settings: "Impostazioni",
    uiLang: "Interfaccia",
    dialect: "Dialetto",
    showCheatSheet: "Mostra promemoria",
    showPartialInput: "Mostra input parziale",
} satisfies Strings

export const Transations = {
    en: Strings_en,
    fr: Strings_fr,
    de: Strings_de,
    it: Strings_it,
}

export type Lang = keyof typeof Transations
export type TranslatedString = keyof typeof Strings_en

const getBrowserLang = (): Lang => {
    const browserLang = navigator.language.toLowerCase().split('-')[0]
    return browserLang in Transations ? browserLang as Lang : "en"
}

let _currentLang: Lang = getBrowserLang()

export function getCurrentLang() {
    return _currentLang
}

export function trySetCurrentLang(lang: string | null) {
    if (lang === null) return
    if (lang in Transations) {
        _currentLang = lang as Lang
    }
}

export function S(key: TranslatedString, lang? : Lang): string {
    return Transations[lang ?? _currentLang][key]
}
