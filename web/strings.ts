const Strings_en = {
    shapes: "Shapes",
    operators: "Operators",
    colors: "Colors",
    sizes: "Sizes",
    rotation: "Rotation",
    parseStatus: "Parse status",
    codeCompiles: "Code valid",
    codeHasErrors: "Code has errors",
    settings: "Settings",
    lang: "Language",
    dialect: "Dialect",
}

const Strings_fr = {
    shapes: "Formes",
    operators: "Poses",
    colors: "Couleurs",
    sizes: "Taille",
    rotation: "Rotation",
    parseStatus: "Statut de l’analyse",
    codeCompiles: "Le code est valide",
    codeHasErrors: "Le code est erronné",
    settings: "Réglages",
    lang: "Langue",
    dialect: "Dialecte",
} satisfies typeof Strings_en

export const Transations = {
    en: Strings_en,
    fr: Strings_fr,
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
