const Strings_en = {
    shapes: "Shapes",
    placement: "Placement",
    colors: "Colors",
    sizes: "Sizes",
    rotation: "Rotation",
    parseStatus: "Parse status",
    codeCompiles: "Code valid",
    codeHasErrors: "Code has errors",
    settings: "Settings",
    lang: "Language",
    dialect: "Dialect",
    showCheatSheet: "Show cheat sheet",
    showPartialInput: "Show partial input",
}

type Strings = typeof Strings_en

const Strings_fr = {
    shapes: "Formes",
    placement: "Poses",
    colors: "Couleurs",
    sizes: "Taille",
    rotation: "Rotation",
    parseStatus: "Statut de l’analyse",
    codeCompiles: "Le code est valide",
    codeHasErrors: "Le code est erronné",
    settings: "Réglages",
    lang: "Langue",
    dialect: "Dialecte",
    showCheatSheet: "Afficher l’aide-mémoire",
    showPartialInput: "Afficher éléments partiels",
} satisfies Strings

const Strings_de = {
    shapes: "Formen",
    placement: "Platzierung",
    colors: "Farben",
    sizes: "Größen",
    rotation: "Rotation",
    parseStatus: "Analyse-Status",
    codeCompiles: "Code ist gültig",
    codeHasErrors: "Code hat Fehler",
    settings: "Einstellungen",
    lang: "Sprache",
    dialect: "Dialekt",
    showCheatSheet: "Spickzettel anzeigen",
    showPartialInput: "Teilweise Eingabe anzeigen",
} satisfies Strings

const Strings_it = {
    shapes: "Forme",
    placement: "Posizionamento",
    colors: "Colori",
    sizes: "Dimensioni",
    rotation: "Rotazione",
    parseStatus: "Stato dell’analisi",
    codeCompiles: "Il codice è valido",
    codeHasErrors: "Il codice ha errori",
    settings: "Impostazioni",
    lang: "Lingua",
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

export function S(key: TranslatedString) {
    return Transations[_currentLang][key]
}
