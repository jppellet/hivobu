import * as LZString from "lz-string"

// 'ts-ignore' works on the next line, so this does it for the first line
// @ts-ignore

import imgGab from '../img/gab.svg'; // @ts-ignore
import imgGlo from '../img/glo.svg'; // @ts-ignore
import imgJpp from '../img/jpp.svg'; // @ts-ignore
import imgMel from '../img/mel.svg'; // @ts-ignore

void 0 // dummy line to consume the last 'ts-ignore'



type Point = { x: number, y: number }
type SizeAndCenter = { w: number, h: number, relativeCenter: Point }
type ObjDef = SizeAndCenter & { makeSvg: (this: SizeAndCenter) => SVGElement, hidden?: boolean }

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

const Transations = {
    en: Strings_en,
    fr: Strings_fr,
}

type Lang = keyof typeof Transations
type TranslatedString = keyof typeof Strings_en

const getBrowserLang = (): Lang => {
    const browserLang = navigator.language.toLowerCase().split('-')[0]
    return browserLang in Transations ? browserLang as Lang : "en"
}

const DefaultLang: Lang = getBrowserLang()
let currentLang: Lang = DefaultLang

function S(key: TranslatedString) {
    return Transations[currentLang][key]
}


const PoseCodes = [
    "stack",
    "bottom-align-left", "bottom-align-right", /*"bottom-align-center",*/ "bottom-align-junction",
    "right-align-top", "right-align-bottom", /*"right-align-center", */ "right-align-junction"
] as const

type PoseCode = typeof PoseCodes[number]

type Angle = "0" | "3" | "6" | "9"

const AllDialects: Record<string, Dialect> = {}

class Dialect {
    constructor(
        public readonly name: string,
        public readonly ObjsDict: Record<string, SizeAndCenter & ObjDef>,
        public readonly precolored: boolean,
        public readonly mkPreviewString: (obj: string) => string,
        public readonly PoseDict: Record<string, { poseCode: PoseCode, primary?: boolean, invertArgs?: boolean }>,
        public readonly ColorDict: Record<string, string>,
        public readonly Angles: Angle[],
        public readonly SizeDict: Record<string, number>,
    ) {
        this.Objs = Object.keys(ObjsDict)
        this.Poses = Object.keys(PoseDict)
        this.Colors = Object.keys(ColorDict)
        this.Sizes = Object.keys(SizeDict)
        AllDialects[name] = this
    }

    public readonly Objs: string[]
    public readonly Poses: string[]
    public readonly Colors: string[]
    public readonly Sizes: string[]
}


const DialectDefault = new Dialect(
    "default",
    {
        "car": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgElem("rect", { width: this.w, height: this.h })
            }
        },
        "rec": {
            w: 3, h: 10, relativeCenter: { x: 1.5, y: 5 },
            makeSvg() {
                return makeSvgElem("rect", { width: this.w, height: this.h })
            }
        },
        "tri": {
            w: 10, h: 8.7, relativeCenter: { x: 5, y: 5.8 },
            makeSvg() {
                return makeSvgPolygon([{ x: 0, y: this.h }, { x: this.w, y: this.h }, { x: this.w / 2, y: 0 }])
            }
        },
        "ron": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgElem("ellipse", { cx: this.w / 2, cy: this.h / 2, rx: this.w / 2, ry: this.h / 2, })
            }
        },
        "ova": {
            w: 5, h: 10, relativeCenter: { x: 2.5, y: 5 },
            makeSvg() {
                return makeSvgElem("ellipse", { cx: this.w / 2, cy: this.h / 2, rx: this.w / 2, ry: this.h / 2, })
            }
        },
        "cro": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                const thickness = 1 / 3.15
                const x1 = this.w * thickness
                const x2 = this.w * (1 - thickness)
                const y1 = this.h * thickness
                const y2 = this.h * (1 - thickness)
                return makeSvgPolygon([{ x: x1, y: 0 }, { x: x1, y: y1 }, { x: 0, y: y1 }, { x: 0, y: y2 }, { x: x1, y: y2 }, { x: x1, y: this.h }, { x: x2, y: this.h }, { x: x2, y: y2 }, { x: this.w, y: y2 }, { x: this.w, y: y1 }, { x: x2, y: y1 }, { x: x2, y: 0 }])
            }
        },
        "dem": {
            w: 10, h: 5, relativeCenter: { x: 5, y: 2.5 },
            makeSvg() {
                return makeSvgElem("path", { d: `M 0 ${this.h} A ${this.w / 2} ${this.h} 0 0 1 ${this.w} ${this.h} L ${this.w} ${this.h} L 0 ${this.h} Z` })
            }
        },
        "fer": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgPolygon([
                    { x: this.w / 2, y: 0 },
                    { x: this.w, y: this.h },
                    { x: this.w / 2, y: this.h / 2 },
                    { x: 0, y: this.h }])
            }
        },
        "eto": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                const outerR = this.w / 2
                const innerR = outerR * 0.382
                const points: Point[] = []
                for (let i = 0; i < 10; i++) {
                    const angle = -Math.PI / 2 + i * Math.PI / 5
                    const radius = i % 2 === 0 ? outerR : innerR
                    points.push({
                        x: this.relativeCenter.x + radius * Math.cos(angle),
                        y: this.relativeCenter.y + radius * Math.sin(angle),
                    })
                }
                return makeSvgPolygon(points)
            }
        },
        "vid": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgEmpty()
            },
            hidden: true,
        },
        "glo": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgWith(imgGlo, this.w, this.h)
            },
            hidden: true,
        },
        "mel": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgWith(imgMel, this.w, this.h)
            },
            hidden: true,
        },
        "gab": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgWith(imgGab, this.w, this.h)
            },
            hidden: true,
        },
        "jpp": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgWith(imgJpp, this.w, this.h)
            },
            hidden: true,
        }
    },
    false,
    code => code + "noi",
    {
        "emp": { primary: true, poseCode: "stack" },

        "sou": { primary: true, poseCode: "bottom-align-junction" },
        // "sou": { primary: true, poseCode: "bottom-align-center" },
        "sod": { poseCode: "bottom-align-right" },
        "sog": { poseCode: "bottom-align-left" },
        // "soj": {  poseCode: "bottom-align-junction" },

        "cot": { primary: true, poseCode: "right-align-junction" },
        // "cot": { primary: true, poseCode: "right-align-center" },
        "coh": { poseCode: "right-align-top" },
        "cob": { poseCode: "right-align-bottom" },
        // "coj": { poseCode: "right-align-junction" },
    },
    {
        "jau": "yellow",
        "ble": "blue",
        "cya": "cyan",
        "ver": "green",
        "ora": "orange",
        "ros": "pink",
        "gri": "gray",
        "rou": "red",
        "bla": "white",
        "noi": "black",
        "mag": "magenta",
        "bei": "beige",
        "vio": "indigo",
    },
    ["0", "3", "6", "9"],
    {
        "–": 1 / 2,
        "+": 2,
    },
)

const DialectHivobu = new Dialect(
    "hivobu",
    {
        "rah": {
            w: 3, h: 10, relativeCenter: { x: 1.5, y: 5 },
            makeSvg() {
                return makeSvgElem("rect", { width: this.w, height: this.h, "--fillcolor": "#2d6060" })
            }
        },
        "teh": {
            w: 10, h: 8.7, relativeCenter: { x: 5, y: 5.8 },
            makeSvg() {
                return makeSvgPolygon([{ x: 0, y: this.h }, { x: this.w, y: this.h }, { x: this.w / 2, y: 0 }], { "--fillcolor": "#ffff00" })
            }
        },
        "oh": {
            w: 8, h: 8, relativeCenter: { x: 4, y: 4 },
            makeSvg() {
                return makeSvgElem("ellipse", { cx: this.w / 2, cy: this.h / 2, rx: this.w / 2, ry: this.h / 2, "--fillcolor": "#7EB4F9" })
            }
        },
        "vid": {
            w: 10, h: 10, relativeCenter: { x: 5, y: 5 },
            makeSvg() {
                return makeSvgEmpty()
            },
            hidden: true,
        },
    },
    true,
    code => code,
    {
        "co": { poseCode: "stack", primary: true, invertArgs: true },
        "du": { poseCode: "bottom-align-junction", primary: true },
    },
    {},
    [],
    {},
)

type AST = (
    | { _type: 'obj'; token: ParsedToken }
    | { _type: 'pose'; token: ParsedToken; first: AST; second: AST }
    | { _type: 'col'; token: ParsedToken; arg: AST }
    | { _type: 'rot'; token: ParsedToken; arg: AST }
    | { _type: 'size'; token: ParsedToken; arg: AST }
    | { _type: 'call'; token: ParsedToken; def: AST }
) & {
    dialect: Dialect,
    builtObjElem: HTMLElement
    cachedSize?: SizeAndCenter,
    svgElems: SVGElement[],
}

type ASTType = AST["_type"]

type TokenTypeForASTType<T extends ASTType | CSTOnlyType> =
    T extends CSTOnlyType ? string :
    Extract<AST, { _type: T }>["token"]["str"]

const CSTOnlyTypes = ["noop", "colchar"] as const
type CSTOnlyType = typeof CSTOnlyTypes[number]

function isCSTOnlyType(type: string): type is CSTOnlyType {
    return (CSTOnlyTypes as readonly string[]).includes(type)
}

type Arity<T extends ASTType | CSTOnlyType> =
    T extends 'obj' | 'call' ? 0 :
    T extends 'pose' ? 2 :
    T extends 'col' | 'rot' | 'size' ? 1 :
    T extends CSTOnlyType ? 0 :
    never

const NoOps = [" ", " ", "\t", "\n", "(", ")"] as const

class ParseError extends Error {
    constructor(public readonly pos: number, message: string) {
        super(message)
        this.name = "ParseError"
    }
}

type ParsedToken = { str: string, range: { pos: number, len: number }, elem: HTMLElement }

function isAST(obj: boolean | AST | undefined): obj is AST {
    return obj !== undefined && typeof obj === "object" && "_type" in obj
}

function parse(input: string, dialect: Dialect): [AST, WeakMap<HTMLElement, AST>] {

    const elemToAstMap: WeakMap<HTMLElement, AST> = new WeakMap()
    const lines = input.toLowerCase().replace(/-/g, "–").split(/\r?\n|;/)
    const defs: Map<string, AST> = new Map()
    const stack: AST[] = []

    let l = 0
    let c = 0
    let prevLinesOffset = 0

    const error = (message: string) => {
        throw new ParseError(prevLinesOffset + c, message)
    }

    const tryMatchOneOf = <T extends ASTType | CSTOnlyType>(candidates: Iterable<TokenTypeForASTType<T>>, type: T, arity: Arity<T>, opts?: { mustMatch?: boolean, prepend?: string, argOrderDict?: Record<string, { invertArgs?: boolean }> }): undefined | true | AST & { _type: T } => {
        for (const str of candidates) {
            if (input.startsWith(str, c)) {
                // console.log(`At pos ${prevLinesOffset + c}, matched ${type} token '${str}'`)
                c += str.length
                const range = { pos: prevLinesOffset + c, len: str.length }
                const elem = document.createElement("span")
                elem.classList.add("ast", type)
                elem.innerHTML = (opts?.prepend ?? "") + capitalize(str.replace(/\n/g, "<br>"))
                const parsedToken = { str, range, elem }
                if (isCSTOnlyType(type)) {
                    return true
                }
                const argsObj: { arg?: AST, first?: AST, second?: AST } = {}
                let builtObjElem: HTMLElement = elem
                if (arity === 0) {
                    builtObjElem = elem
                } else {
                    if (stack.length < arity) {
                        return error(`Not enough operands for type ${type}, expected ${arity}, got ${stack.length}`)
                    }
                    if (arity === 1) {
                        const arg = stack.pop()!
                        argsObj.arg = arg
                        builtObjElem = document.createElement("span")
                        builtObjElem.classList.add("ast")
                        builtObjElem.appendChild(arg.builtObjElem)
                        builtObjElem.appendChild(elem)
                    } else if (arity === 2) {
                        const cstSecond = stack.pop()!
                        const cstFirst = stack.pop()!
                        const invertArgs = opts?.argOrderDict && str in opts.argOrderDict && opts.argOrderDict[str].invertArgs
                        console.log("argOrderDict", opts?.argOrderDict)
                        if (invertArgs) {
                            argsObj.second = cstFirst
                            argsObj.first = cstSecond
                        } else {
                            argsObj.second = cstSecond
                            argsObj.first = cstFirst
                        }
                        builtObjElem = document.createElement("span")
                        builtObjElem.classList.add("ast")
                        builtObjElem.appendChild(cstFirst.builtObjElem)
                        builtObjElem.appendChild(cstSecond.builtObjElem)
                        builtObjElem.appendChild(elem)
                    } else {
                        return error(`Unsupported arity ${arity} for type ${type}`)
                    }
                }
                const ast: AST & { _type: T } = { _type: type, token: parsedToken, ...argsObj, dialect, builtObjElem, svgElems: [] } as any
                stack.push(ast)
                elemToAstMap.set(elem, ast)
                return ast
            }
        }
        if (opts?.mustMatch) {
            return error(`Expected one of ${[...candidates].join(", ")} at position ${c}, got: ${input.slice(c)}`)
        }
        return undefined
    }

    const parseExpr = (input: string): AST => {
        let ast
        while (c < input.length) {
            if (tryMatchOneOf(NoOps, "noop", 0))
                continue

            if (tryMatchOneOf(dialect.Objs, "obj", 0))
                continue

            if (isAST(ast = tryMatchOneOf(defs.keys(), "call", 0))) {
                ast.def = defs.get(ast.token.str)!
                continue
            }

            if (tryMatchOneOf(dialect.Colors, "col", 1))
                continue

            if (tryMatchOneOf(dialect.Poses, "pose", 2, { argOrderDict: dialect.PoseDict }))
                continue

            if (tryMatchOneOf(dialect.Angles, "rot", 1))
                continue

            if (tryMatchOneOf(dialect.Sizes, "size", 1))
                continue

            return error(`Unknown token at position ${c}: ${input.slice(c)}`)
        }

        if (stack.length !== 1) {
            return error(`Invalid input, stack has ${stack.length} items, expected 1: ${JSON.stringify(stack)}`)
        }

        const expr = stack.pop()!
        console.log("Parsed expression:", expr)
        return expr
    }

    const parseDef = (input: string): void => {
        let [name, expr] = input.split("=").map(s => s.trim())
        if (!name || !expr) {
            return error(`Invalid definition, expected format "name = expression"`)
        }
        name = name.toLowerCase()
        if (defs.has(name)) {
            return error(`Duplicate definition for ${name}`)
        }

        defs.set(name, parseExpr(expr))
    }

    for (; l < lines.length; l++) {
        const line = lines[l].trim()
        if (line.length !== 0 && !line.startsWith("#")) {


            c = 0
            input = line

            if (line.includes("=")) {
                parseDef(line)
            } else {
                const ast = parseExpr(line)
                // console.log("Final AST:", ast)
                return [ast, elemToAstMap]
            }
        }
        prevLinesOffset += line.length + 1
    }

    return error(`No expression found in input`)
}

function fallbackParse(input: string): HTMLElement {
    const lines = input.split(/\r?\n|;/)
    const containerSpan = document.createElement("span")
    const push = (token: string) => {
        const tokenSpan = document.createElement("span")
        tokenSpan.classList.add("ast", "fallback")
        tokenSpan.textContent = token
        containerSpan.appendChild(tokenSpan)
    }
    for (let l = 0; l < lines.length; l++) {
        const line = lines[l].trim()

        if (line.length === 0) continue

        let buf = ""
        const flushBuf = () => {
            if (buf.length > 0) {
                push(buf)
                buf = ""
            }
        }
        for (let c = 0; c < line.length; c++) {
            const char = line[c]
            const isLower = char >= "a" && char <= "z"
            const isWhitespace = char === " " || char === "\t"
            if (buf.length === 3 || !(isLower || isWhitespace)) {
                flushBuf()
            }
            buf += char
        }

        flushBuf()

        if (l < lines.length - 1) {
            containerSpan.appendChild(document.createElement("br"))
        }
    }

    console.log("Fallback parsed input:", containerSpan.outerHTML)
    return containerSpan
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function pretty(ast: AST, parensIfComplex?: boolean): string {
    switch (ast._type) {
        case 'obj':
        case 'call':
            return `<span style="">${capitalize(ast.token.str)}</span>`
        case 'pose': {
            const invertArgs = ast.dialect.PoseDict[ast.token.str].invertArgs
            const [first, second] = invertArgs ? [ast.second, ast.first] : [ast.first, ast.second]
            const repr = `${pretty(first, true)} ${pretty(second, true)} <span style="font-weight: bold;">${capitalize(ast.token.str)}</span>`
            if (parensIfComplex) return `(${repr})`
            return repr
        }
        case 'rot': {
            let angleNum = parseInt(ast.token.str)
            let child = ast.arg
            while (child._type === 'rot') {
                angleNum = (angleNum + parseInt(child.token.str)) % 12
                child = child.arg
            }
            if (ast.token.str === "0") return pretty(child)
            return `${pretty(child, true)}${angleNum}`
        }
        case 'size':
            return `${pretty(ast.arg, true)}<span style="font-weight: bold;">${ast.token.str}</span>`
        case 'col': {
            const cssColor = ast.dialect.ColorDict[ast.token.str]
            return `${pretty(ast.arg, true)}<span style="font-style: italic; padding: 0 0.2ex 0 0.1ex; margin-left: 0.1ex; border: 3px solid ${cssColor}">${capitalize(ast.token.str)}</span>`
        }
    }
}


function sizeOf(ast: AST): SizeAndCenter {
    if (!ast.cachedSize) {
        ast.cachedSize = ((): SizeAndCenter => {
            switch (ast._type) {
                case 'call':
                    return sizeOf(ast.def)
                case 'obj':
                    return ast.dialect.ObjsDict[ast.token.str]
                case 'pose': {
                    const poseCode = ast.dialect.PoseDict[ast.token.str].poseCode
                    const firstSize = sizeOf(ast.first)
                    const secondSize = sizeOf(ast.second)
                    const newWidthDefault = Math.max(firstSize.relativeCenter.x, secondSize.relativeCenter.x) + Math.max(firstSize.w - firstSize.relativeCenter.x, secondSize.w - secondSize.relativeCenter.x)
                    const newHeightDefault = Math.max(firstSize.relativeCenter.y, secondSize.relativeCenter.y) + Math.max(firstSize.h - firstSize.relativeCenter.y, secondSize.h - secondSize.relativeCenter.y)
                    switch (poseCode) {
                        case 'stack':
                            return {
                                w: newWidthDefault,
                                h: newHeightDefault,
                                relativeCenter: {
                                    x: Math.max(firstSize.relativeCenter.x, secondSize.relativeCenter.x),
                                    y: Math.max(firstSize.relativeCenter.y, secondSize.relativeCenter.y)
                                }
                            }
                        case 'bottom-align-left':
                        case 'bottom-align-right':
                        case 'bottom-align-junction': {
                            const relativeCenterX = (() => {
                                switch (poseCode) {
                                    case 'bottom-align-junction': return Math.max(firstSize.relativeCenter.x, secondSize.relativeCenter.x)
                                    case 'bottom-align-left': return Math.min(firstSize.relativeCenter.x, secondSize.relativeCenter.x)
                                    case 'bottom-align-right': return firstSize.w > secondSize.w
                                        ? firstSize.w - (secondSize.w - secondSize.relativeCenter.x)
                                        : secondSize.w - (firstSize.w - firstSize.relativeCenter.x)
                                }
                            })()
                            return {
                                w: newWidthDefault,
                                h: firstSize.h + secondSize.h,
                                relativeCenter: {
                                    x: relativeCenterX,
                                    y: firstSize.h,
                                }
                            }
                        }
                        case "right-align-top":
                        case "right-align-bottom":
                        case "right-align-junction":
                            return {
                                w: firstSize.w + secondSize.w,
                                h: newHeightDefault,
                                relativeCenter: {
                                    x: firstSize.w,
                                    y: Math.max(firstSize.relativeCenter.y, secondSize.relativeCenter.y)
                                }
                            }
                    }
                }
                case 'rot': {
                    const angle = ast.token.str
                    const childSize = sizeOf(ast.arg)
                    if (angle === "0") return childSize
                    const relativeCenter = (() => {
                        switch (angle) {
                            case "9":
                                return {
                                    x: childSize.relativeCenter.y,
                                    y: childSize.w - childSize.relativeCenter.x
                                }
                            case "6":
                                return {
                                    x: childSize.w - childSize.relativeCenter.x,
                                    y: childSize.h - childSize.relativeCenter.y
                                }
                            case "3":
                                return {
                                    x: childSize.h - childSize.relativeCenter.y,
                                    y: childSize.relativeCenter.x
                                }
                            default:
                                return childSize.relativeCenter
                        }
                    })()
                    const [w, h] = angle === "6" ? [childSize.w, childSize.h] : [childSize.h, childSize.w]
                    return {
                        w,
                        h,
                        relativeCenter
                    }
                }
                case 'size': {
                    const size = ast.token.str
                    const childSize = sizeOf(ast.arg)
                    const factor = ast.dialect.SizeDict[size]
                    return {
                        w: childSize.w * factor,
                        h: childSize.h * factor,
                        relativeCenter: {
                            x: childSize.relativeCenter.x * factor,
                            y: childSize.relativeCenter.y * factor
                        }
                    }
                }
                case 'col':
                    return sizeOf(ast.arg)
            }
        })()
    }
    return ast.cachedSize
}


const background = "#f0f0f0"

function makeSvgElem<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number | undefined>): SVGElementTagNameMap[K] {
    const elem = document.createElementNS("http://www.w3.org/2000/svg", tag)
    for (const [key, value] of Object.entries(attrs)) {
        if (value !== undefined) {
            if (key.startsWith("--")) {
                elem.style.setProperty(key, value.toString())
            } else {
                elem.setAttribute(key, value.toString())
            }
        }
    }
    return elem
}

function setStyle(elem: HTMLElement, styles: Partial<Record<keyof CSSStyleDeclaration, string>>): void {
    Object.assign(elem.style, styles)
}


function makeSvgPolygon(pointsArr: Point[], attrs: Record<string, string | number | undefined> = {}): SVGPolygonElement {
    const points = pointsArr.map(p => `${p.x},${p.y}`).join(" ")
    return makeSvgElem("polygon", {
        points,
        ...attrs
    })
}


function makeSvgEmpty() {
    return makeSvgElem("g", {})
}

function makeSvgWith(svgCode: string, w: number, h: number): SVGElement {

    const href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgCode)}`
    const image = makeSvgElem("image", {
        href,
        width: w,
        height: h,
        preserveAspectRatio: "xMidYMid meet",
    })

    // const container = document.createElement("div")
    // container.innerHTML = svgCode
    // const svg = container.querySelector("svg")!
    // const viewBox = svg.getAttribute("viewBox")
    // const { width, height } = svg.viewBox.baseVal
    // console.log({ viewBox, width, height })
    // const factor = Math.min(w / width, h / height)
    // const mainGroup = svgGroup(svg)
    // mainGroup.setAttribute("transform", `scale(${factor})`)
    return image
}

function svgGroup(children: SVGElement | SVGElement[], transform?: string, className?: string): SVGGElement {
    const group = makeSvgElem("g", {
        class: className,
        transform,
    })
    children = Array.isArray(children) ? children : [children]
    for (const child of children) {
        group.appendChild(child)
    }
    return group
}

function astToSVG(ast: AST): SVGSVGElement {
    const makeCenterCircle = (className?: string) =>
        // `<circle class="cp ${className ?? ""}" cx="0" cy="0" r="0.3" />`
        makeSvgElem("circle", {
            class: `cp ${className ?? ""}`,
            cx: 0,
            cy: 0,
            r: 0.3
        })

    function render(ast: AST): SVGElement {
        const svgElem = doRender()
        ast.svgElems.push(svgElem)
        return svgElem

        function doRender(): SVGElement {
            switch (ast._type) {
                case 'call':
                    return render(ast.def)
                case 'obj': {
                    const obj = ast.token.str
                    const def = ast.dialect.ObjsDict[obj]
                    const objSvg = def.makeSvg()
                    objSvg.setAttribute("transform", `translate(${-def.relativeCenter.x} ${-def.relativeCenter.y})`)
                    objSvg.classList.add("obj", obj)
                    if (ast.dialect.precolored) {
                        objSvg.classList.add("hascol")
                    }
                    return svgGroup([objSvg, makeCenterCircle()])
                }
                case 'pose': {
                    const poseCode = ast.dialect.PoseDict[ast.token.str].poseCode
                    const firstSvg = render(ast.first)
                    const secondSvg = render(ast.second)
                    const combinedSize = sizeOf(ast)
                    const firstSize = sizeOf(ast.first)
                    const secondSize = sizeOf(ast.second)
                    switch (poseCode) {
                        case 'stack':
                            return svgGroup([
                                svgGroup(firstSvg, undefined, "first"),
                                svgGroup(secondSvg, undefined, "second"),
                            ], undefined, `pose stack`)

                        case 'bottom-align-left':
                        case 'bottom-align-right':
                        case 'bottom-align-junction': {
                            const combinedDy = firstSize.relativeCenter.y - combinedSize.relativeCenter.y
                            const [secondDx, combinedDx] = (() => {
                                switch (poseCode) {
                                    case 'bottom-align-junction': return [0, 0]
                                    case 'bottom-align-left': return [- firstSize.relativeCenter.x + secondSize.relativeCenter.x, firstSize.relativeCenter.x - combinedSize.relativeCenter.x]
                                    case 'bottom-align-right': {
                                        const combinedDx = firstSize.relativeCenter.x <= secondSize.relativeCenter.x ? 0 : firstSize.relativeCenter.x - combinedSize.relativeCenter.x
                                        return [firstSize.w - firstSize.relativeCenter.x - (secondSize.w - secondSize.relativeCenter.x), combinedDx]
                                    }
                                }
                            })()
                            const secondDy = firstSize.h - firstSize.relativeCenter.y + secondSize.relativeCenter.y

                            return svgGroup([
                                svgGroup(firstSvg, undefined, "first"),
                                svgGroup(
                                    svgGroup(secondSvg, `translate(${secondDx} ${secondDy})`),
                                    undefined, "second"),
                            ], `translate(${combinedDx} ${combinedDy})`, `pose bottom`)
                        }

                        case 'right-align-top':
                        case 'right-align-bottom':
                        case 'right-align-junction': {
                            const combinedDx = firstSize.relativeCenter.x - combinedSize.relativeCenter.x
                            const [secondDy, combinedDy] = (() => {
                                switch (poseCode) {
                                    case 'right-align-junction': return [0, 0]
                                    case 'right-align-top': return [- firstSize.relativeCenter.y + secondSize.relativeCenter.y, firstSize.relativeCenter.y - combinedSize.relativeCenter.y]
                                    case 'right-align-bottom': {
                                        const combinedDy = firstSize.relativeCenter.y > secondSize.relativeCenter.y ? 0 : -firstSize.relativeCenter.y + combinedSize.relativeCenter.y
                                        return [firstSize.h - firstSize.relativeCenter.y - (secondSize.h - secondSize.relativeCenter.y), combinedDy]
                                    }
                                }
                            })()
                            const secondDx = firstSize.w - firstSize.relativeCenter.x + secondSize.relativeCenter.x
                            return svgGroup([
                                svgGroup(firstSvg, undefined, "first"),
                                svgGroup(
                                    svgGroup(secondSvg, `translate(${secondDx} ${secondDy})`),
                                    undefined, "second"),
                            ], `translate(${combinedDx} ${combinedDy})`, `pose right`)
                        }
                    }
                }
                case 'rot': {
                    const angle = ast.token.str
                    return svgGroup(render(ast.arg), `rotate(${30 * parseInt(angle)})`, `rot${angle}`)
                }
                case 'size': {
                    const size = ast.token.str
                    const factor = ast.dialect.SizeDict[size]
                    return svgGroup(render(ast.arg), `scale(${factor})`, `size${size}`)
                }
                case 'col': {
                    const color = ast.token.str
                    const cssColor = ast.dialect.ColorDict[color]
                    const groupContent = render(ast.arg)
                    groupContent.querySelectorAll(".obj").forEach(elem => {
                        elem.classList.add("hascol")
                        if (elem instanceof SVGElement) {
                            elem.style.setProperty("--fillcolor", cssColor)
                        }
                    })
                    const group = svgGroup(groupContent, undefined, `col${color}`)
                    group.style.setProperty("--fillcolor", cssColor)
                    return group
                }
            }
        }
    }

    const debug = false
    const size = sizeOf(ast)
    const globalDx = size.relativeCenter.x
    const globalDy = size.relativeCenter.y
    const centerFill = debug ? "red" : "none"
    const objFillColor = "var(--fillcolor, rgb(255 255 255 / 0.2))"
    const dropShadow = "drop-shadow(0px 0px 0.2px #0004)"
    const debugFrame = !debug ? makeSvgEmpty()
        : svgGroup([
            makeCenterCircle("orig"),
            makeSvgElem("rect", {
                x: -size.relativeCenter.x,
                y: -size.relativeCenter.y,
                width: size.w,
                height: size.h,
                fill: "none",
                stroke: "blue",
                "stroke-width": 0.1,
            })
        ])

    const svgPadding = 2
    const svg = makeSvgElem("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: `-${svgPadding} -${svgPadding} ${size.w + 2 * svgPadding} ${size.h + 2 * svgPadding}`,
        style: `background: ${background}; margin: 0 auto;`
    })

    const svgStyle = makeSvgElem("style", {})
    svgStyle.textContent = `
    .shadow {
            -webkit-filter: ${dropShadow};
            filter: ${dropShadow};
        }
        .cp { fill: ${centerFill}; stroke: none; }
        .cp.orig { fill: blue; }
        .obj {
            fill: ${objFillColor};
            stroke-width: 0;
            stroke: oklab(from ${objFillColor} calc(l * 0.85) a b / 0.3);
            vector-effect: non-scaling-stroke;
        }
        .obj:not(.hascol) {
            stroke-width: 2;
            stroke: black;
        }


@keyframes pulse {
  0%, 100% {
    fill: oklch(from ${objFillColor} calc(l * 0.8) c h); /* darker */
    /* opacity: 0.5; */
  }
  50% {
    fill: oklch(from ${objFillColor} calc(l * 1.2) c h); /* lighter */
    /* opacity: 1; */
  }
}

@keyframes cot {
    0% {
        transform: translate(10px, 0px);
        opacity: 0;
    }
    25% {
        transform: none;
        opacity: 1;
    }
}

@keyframes sou {
    0% {
        transform: translate(0px, 10px);
        opacity: 0;
    }
    25% {
        transform: none;
        opacity: 1;
    }
}

@keyframes emp {
    0% {
        stroke-width: 50;
    }
    25% {
        stroke-width: 0;
    }
}

span.ast {
    display: inline-block;
    margin: 0 0.1ex;
}

span.ast.pose {
    font-weight: bold;
}

span.ast.size {
    font-weight: bold;
}

span.ast.col {
    font-style: italic;
}

span.ast.highlighted {
    border-bottom: 2px solid gray;
}

span.ast.highlighted_built {
    border: 1px solid gray;
}

span.ast.highlighted_arg.arg {
    background-color: rgba(228, 228, 228, 0.9);
}

span.ast.highlighted_arg.first {
    background-color: rgba(214, 250, 255, 0.9);
}

span.ast.highlighted_arg.second {
    background-color: rgba(253, 224, 255, 0.9);
}

.highlighted > *.obj {
  animation: pulse 1s ease-in-out infinite;
  stroke-width: 0.15;
}

.pose.right.highlighted > .second {
    animation: cot 2s ease-in-out infinite;
}

.pose.bottom.highlighted > .second {
    animation: sou 2s ease-in-out infinite;
}

.pose.stack.highlighted > .second *.obj {
    stroke: ${objFillColor};
    animation: emp 2s ease-in-out infinite;
}
    `
    const svgChildren = [
        svgStyle,
        svgGroup(render(ast), `translate(${globalDx} ${globalDy})`, "shadow"),
        debugFrame,
    ]

    for (const child of svgChildren) {
        svg.appendChild(child)
    }

    return svg
}


function gallery(...shapes: string[]): string {
    if (shapes.length === 0) return ""
    let buf = shapes[0]
    for (let i = 1; i < shapes.length; i++) {
        buf += `vid-cot${shapes[i]}cot`
    }
    return buf
}

function children(ast: AST): AST[] {
    switch (ast._type) {
        case 'call':
        case 'obj':
            return []
        case 'pose':
            return [ast.first, ast.second]
        case 'rot':
        case 'size':
        case 'col':
            return [ast.arg]
    }
}

class EarlyReturn extends Error {
    constructor() {
        super("EarlyReturnError")
        this.name = "EarlyReturnError"
    }
}

function visit(ast: AST, fn: (ast: AST, depth: number) => boolean | void): void {
    try {
        doVisit(ast, 0)
    } catch (e) {
        if (!(e instanceof EarlyReturn)) {
            throw e
        }
    }

    function doVisit(ast: AST, depth: number): void {
        if (fn(ast, depth) === false) {
            throw new EarlyReturn()
        }

        for (const child of children(ast)) {
            doVisit(child, depth + 1)
        }
    }
}


function printSizes(ast: AST): void {
    visit(ast, (node, depth) => {
        const size = sizeOf(node)
        console.log(`${"  ".repeat(depth)}${pretty(node)}   -->   w=${size.w.toFixed(2)}, h=${size.h.toFixed(2)}, center=(${size.relativeCenter.x.toFixed(2)}, ${size.relativeCenter.y.toFixed(2)})`)
    })
}

function findNodeAt(ast: AST, pos: number): AST | undefined {
    let found: AST | undefined = undefined
    visit(ast, (node) => {
        if (pos >= node.token.range.pos && pos <= node.token.range.pos + node.token.range.len) {
            found = node
            return false
        }
        return
    })
    return found
}


function getSelectionOffsetsWithin(container: HTMLElement): { start: number, end: number } | undefined {
    const selection = document.getSelection()
    if (!selection || selection.rangeCount === 0) {
        return
    }
    const range = selection.getRangeAt(0)
    if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
        return
    }

    const startRange = document.createRange()
    startRange.selectNodeContents(container)
    startRange.setEnd(range.startContainer, range.startOffset)
    const start = startRange.toString().length

    const endRange = document.createRange()
    endRange.selectNodeContents(container)
    endRange.setEnd(range.endContainer, range.endOffset)
    const end = endRange.toString().length

    return { start, end }
}

function resolveTextPosition(container: HTMLElement, offset: number): { node: Node, offset: number } {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
    let remaining = offset
    let lastTextNode: Text | undefined = undefined

    while (walker.nextNode()) {
        const textNode = walker.currentNode as Text
        lastTextNode = textNode
        const len = textNode.nodeValue?.length ?? 0
        if (remaining <= len) {
            return { node: textNode, offset: remaining }
        }
        remaining -= len
    }

    if (lastTextNode) {
        return { node: lastTextNode, offset: lastTextNode.nodeValue?.length ?? 0 }
    }

    return { node: container, offset: 0 }
}

function restoreSelectionOffsetsWithin(container: HTMLElement, start: number, end: number): void {
    const textLength = container.innerText.length
    const safeStart = Math.max(0, Math.min(start, textLength))
    const safeEnd = Math.max(0, Math.min(end, textLength))

    const startPos = resolveTextPosition(container, safeStart)
    const endPos = resolveTextPosition(container, safeEnd)
    const range = document.createRange()
    range.setStart(startPos.node, startPos.offset)
    range.setEnd(endPos.node, endPos.offset)

    const selection = document.getSelection()
    if (!selection) {
        return
    }
    selection.removeAllRanges()
    selection.addRange(range)
}

function parseNumericAttr(value: string | null): number | undefined {
    if (!value) return undefined
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : undefined
}

function svgRasterSize(svg: SVGSVGElement): { width: number, height: number } {
    const viewBox = svg.viewBox.baseVal
    const widthFromViewBox = viewBox && viewBox.width > 0 ? viewBox.width : undefined
    const heightFromViewBox = viewBox && viewBox.height > 0 ? viewBox.height : undefined
    const width = widthFromViewBox ?? parseNumericAttr(svg.getAttribute("width")) ?? 128
    const height = heightFromViewBox ?? parseNumericAttr(svg.getAttribute("height")) ?? 128
    return {
        width: Math.max(1, Math.round(width)),
        height: Math.max(1, Math.round(height)),
    }
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error("Unable to encode canvas as PNG"))
                return
            }
            resolve(blob)
        }, "image/png")
    })
}

function copyPngDataUrlWithExecCommand(pngDataUrl: string): boolean {
    const host = document.createElement("div")
    host.contentEditable = "true"
    setStyle(host, {
        position: "fixed",
        left: "-99999px",
        top: "0",
        opacity: "0",
    })

    const img = document.createElement("img")
    img.src = pngDataUrl
    img.alt = ""
    host.appendChild(img)
    document.body.appendChild(host)

    const range = document.createRange()
    range.selectNode(img)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)

    let copied = false
    try {
        copied = document.execCommand("copy")
    } catch {
        copied = false
    }

    selection?.removeAllRanges()
    document.body.removeChild(host)
    return copied
}

function triggerPngDownload(pngBlob: Blob, fileName = "screenshot.png"): void {
    const url = URL.createObjectURL(pngBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

async function copySvgToClipboardAsImage(svg: SVGSVGElement): Promise<void> {
    const serialized = new XMLSerializer().serializeToString(svg)
    const svgBlob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" })
    let { width, height } = svgRasterSize(svg)
    width *= 100
    height *= 100

    const imageUrl = URL.createObjectURL(svgBlob)
    try {
        const image = new Image()
        const imageLoaded = new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error("Failed to load SVG for rasterization"))
        })
        image.src = imageUrl
        await imageLoaded

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext("2d")
        if (!context) {
            throw new Error("2D canvas context is unavailable")
        }
        context.drawImage(image, 0, 0, width, height)

        const pngBlob = await canvasToPngBlob(canvas)

        // Preferred path for browsers that support image writes (Chromium, newer Safari).
        if (navigator.clipboard && typeof ClipboardItem !== "undefined") {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({
                        "image/png": pngBlob,
                        "image/svg+xml": svgBlob,
                    })
                ])
                return
            } catch {
                // Fall through to Safari legacy fallback below.
            }
        }

        // Safari fallback: select an <img> and use legacy copy command.
        const pngDataUrl = canvas.toDataURL("image/png")
        if (copyPngDataUrlWithExecCommand(pngDataUrl)) {
            return
        }

        // Last resort: provide a PNG file so user can still use it immediately.
        triggerPngDownload(pngBlob)
        throw new Error("Clipboard image copy is unavailable; downloaded PNG instead")
    } finally {
        URL.revokeObjectURL(imageUrl)
    }
}

function createSettingsPopup(currentDialect: Dialect): void {

    const settingPopup = document.createElement("details")
    const settingPopupSummary = document.createElement("summary")
    settingPopupSummary.textContent = S("settings")
    settingPopup.appendChild(settingPopupSummary)
    setStyle(settingPopup, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: "10000",
        background: "#fff",
        border: "1px solid #b7b7b7",
        borderRadius: "8px",
        boxShadow: "0 8px 24px rgb(0 0 0 / 0.16)",
        padding: "6px 8px",
        font: "500 12px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
    })
    setStyle(settingPopupSummary, {
        cursor: "pointer",
        listStyle: "none",
        userSelect: "none",
    })

    const settingPanel = document.createElement("div")
    setStyle(settingPanel, {
        marginTop: "8px",
        display: "grid",
        gap: "6px",
    })

    const makeSettingRow = (labelText: string, control: HTMLElement): HTMLElement => {
        const row = document.createElement("label")
        const text = document.createElement("span")
        text.textContent = `${labelText}: `
        setStyle(row, {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            whiteSpace: "nowrap",
        })
        row.appendChild(text)
        row.appendChild(control)
        return row
    }

    const langSelect = document.createElement("select")
    for (const langCode of Object.keys(Transations) as Lang[]) {
        const option = document.createElement("option")
        option.value = langCode
        option.textContent = langCode.toUpperCase()
        option.selected = langCode === currentLang
        langSelect.appendChild(option)
    }

    const dialectSelect = document.createElement("select")
    for (const dialectName of Object.keys(AllDialects)) {
        const option = document.createElement("option")
        option.value = dialectName
        option.textContent = dialectName
        option.selected = dialectName === currentDialect.name
        dialectSelect.appendChild(option)
    }

    settingPanel.appendChild(makeSettingRow(S("lang"), langSelect))
    settingPanel.appendChild(makeSettingRow(S("dialect"), dialectSelect))
    settingPopup.appendChild(settingPanel)
    document.body.appendChild(settingPopup)

    const reloadWithSettings = (settings: { lang?: string, dialect?: string }): void => {
        const url = new URL(window.location.href)
        if (settings.lang) {
            url.searchParams.set("lang", settings.lang)
        }
        if (settings.dialect) {
            url.searchParams.set("dialect", settings.dialect)
        }
        window.location.assign(url.toString())
    }

    langSelect.addEventListener("change", () => {
        reloadWithSettings({ lang: langSelect.value })
    })
    dialectSelect.addEventListener("change", () => {
        reloadWithSettings({ dialect: dialectSelect.value })
    })
}

function makeCheatSheetContent(dialect: Dialect): string {
    const smallSvgRender = (code: string): Element => {
        const ast = parse(code, dialect)[0]
        const svg = astToSVG(ast)
        svg.classList.add("objpreview")
        return svg
    }

    const unbreakableSpan = (content: string) => `<span style="white-space: nowrap;">${content}</span>`
    const sep = `<span style="font-size:120%; padding: 0 1ex;"> </span>`
    const colSpan = (colcode: string) => `<span style="padding: 1px; border: 3px solid ${dialect.ColorDict[colcode]}">${capitalize(colcode)}</span>`
    const objSpan = (objcode: string) => `<span>${capitalize(objcode)}${smallSvgRender(dialect.mkPreviewString(objcode)).outerHTML}</span>`
    const objs = Object.keys(dialect.ObjsDict).filter(obj => dialect.ObjsDict[obj].hidden !== true)

    const mkSection = (title: string, items: readonly string[], sectionSep: string, map: (item: string) => string = (item) => item): string => {
        if (items.length === 0) {
            return ""
        }
        return `<b>${title}:</b> ${items.map(map).join(sectionSep)}`
    }

    const cheatSheetSections = [[
        mkSection(S("shapes"), objs, " ", objSpan),
        mkSection(S("operators"), Object.entries(dialect.PoseDict).filter(([_, v]) => v.primary === true).map(([k]) => k), " ", capitalize),
    ], [
        mkSection(S("colors"), dialect.Colors, " ", colSpan),
        mkSection(S("sizes"), dialect.Sizes, " "),
        mkSection(S("rotation"), dialect.Angles, " "),
    ]]

    return cheatSheetSections.map(subsection => subsection.map(unbreakableSpan).join(sep)).join("<br>")
}

function makeToastUI() {
    const toast = document.createElement("div")
    setStyle(toast, {
        position: "fixed",
        right: "16px",
        bottom: "76px",
        padding: "8px 12px",
        borderRadius: "8px",
        font: "600 12px/1.2 ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
        color: "#fff",
        background: "#333",
        boxShadow: "0 8px 24px rgb(0 0 0 / 0.2)",
        opacity: "0",
        transform: "translateY(8px)",
        transition: "opacity 120ms ease, transform 120ms ease",
        pointerEvents: "none",
        zIndex: "9999",
    })
    document.body.appendChild(toast)

    let toastTimeout: number | undefined
    const showToast = (message: string, kind: "success" | "error" = "success") => {
        toast.textContent = message
        toast.style.background = kind === "success" ? "#1d6e2c" : "#a12828"
        toast.style.opacity = "1"
        toast.style.transform = "translateY(0)"
        if (toastTimeout !== undefined) {
            window.clearTimeout(toastTimeout)
        }
        toastTimeout = window.setTimeout(() => {
            toast.style.opacity = "0"
            toast.style.transform = "translateY(8px)"
        }, 1400)
    }
    return showToast
}


async function main() {

    const codeContainer = document.getElementById("code-container")
    const cheatSheetContainer = document.getElementById("cheatsheet-container")
    const svgContainer = document.getElementById("svg-container")
    const prettyprintContainer = document.getElementById("prettyprint-container")

    const initialUrlParams = new URLSearchParams(window.location.search)
    const dialectNameParam = initialUrlParams.get("dialect")
    const langParam = initialUrlParams.get("lang")
    currentLang = langParam !== null && langParam in Transations ? langParam as Lang : DefaultLang
    const dialect = dialectNameParam !== null && dialectNameParam in AllDialects ? AllDialects[dialectNameParam] : DialectDefault

    if (!codeContainer || !cheatSheetContainer || !svgContainer || !prettyprintContainer) {
        throw new Error("HTML containers not found")
    }

    createSettingsPopup(dialect)

    const codeRow = document.createElement("div")
    setStyle(codeRow, {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        paddingInline: "8px",
    })

    const codeStatusIndicator = document.createElement("span")
    codeStatusIndicator.title = S("parseStatus")
    setStyle(codeStatusIndicator, {
        minWidth: "20px",
        textAlign: "center",
        fontSize: "16px",
        fontWeight: "700",
        userSelect: "none",
    })

    const setParseStatus = (status: "idle" | "ok" | "error") => {
        switch (status) {
            case "idle":
                codeStatusIndicator.textContent = ""
                codeStatusIndicator.style.color = "#666"
                codeStatusIndicator.title = S("parseStatus")
                break
            case "ok":
                codeStatusIndicator.textContent = "✅"
                codeStatusIndicator.style.color = "#1d6e2c"
                codeStatusIndicator.title = S("codeCompiles")
                break
            case "error":
                codeStatusIndicator.textContent = "❌"
                codeStatusIndicator.style.color = "#a12828"
                codeStatusIndicator.title = S("codeHasErrors")
                break
        }
    }

    const codeContainerParent = codeContainer.parentElement
    if (!codeContainerParent) {
        throw new Error("Code container parent not found")
    }
    codeContainerParent.insertBefore(codeRow, codeContainer)
    codeRow.appendChild(codeContainer)
    codeRow.appendChild(codeStatusIndicator)
    setStyle(codeContainer, {
        flex: "1 1 auto",
        minWidth: "0",
    })
    setParseStatus("idle")

    const showToast = makeToastUI()

    document.addEventListener("keydown", (event) => {
        const isCopyRenderedSvgShortcut = event.metaKey
            && event.shiftKey
            && !event.ctrlKey
            && !event.altKey
            && event.key.toLowerCase() === "c"

        if (!isCopyRenderedSvgShortcut) {
            return
        }

        const renderedSvg = svgContainer.querySelector("svg")
        if (!(renderedSvg instanceof SVGSVGElement)) {
            showToast("No SVG to copy", "error")
            return
        }

        event.preventDefault()
        void copySvgToClipboardAsImage(renderedSvg)
            .then(() => {
                showToast("SVG copied as image")
            })
            .catch((error) => {
                console.error("Could not copy rendered SVG to clipboard", error)
                showToast("Copy failed", "error")
            })
    })

    cheatSheetContainer.innerHTML = makeCheatSheetContent(dialect)

    let currentAst: AST | undefined = undefined

    const selectTokenInCode = (tokenElem: HTMLElement): void => {
        if (!codeContainer.contains(tokenElem)) {
            return
        }
        const range = document.createRange()
        range.selectNodeContents(tokenElem)

        const selection = document.getSelection()
        if (!selection) {
            return
        }
        selection.removeAllRanges()
        selection.addRange(range)
        codeContainer.focus()
    }

    const findAstGeneratingSvgElem = (svgElem: SVGElement): AST | undefined => {
        if (!currentAst) {
            return
        }

        let bestMatchAst: AST | undefined = undefined
        let bestMatchDepth = -1

        visit(currentAst, (node, depth) => {
            const containsClickedShape = node.svgElems.some(nodeSvgElem =>
                nodeSvgElem === svgElem || nodeSvgElem.contains(svgElem)
            )
            if (!containsClickedShape) {
                return
            }
            if (depth >= bestMatchDepth) {
                bestMatchDepth = depth
                bestMatchAst = node
            }
        })

        return bestMatchAst
    }

    document.addEventListener("pointerup", e => {
        if ((e.target instanceof SVGElement) && e.target.classList.contains("obj")) {
            const generatingAst = findAstGeneratingSvgElem(e.target)
            if (!generatingAst) {
                return
            }
            e.preventDefault()
            e.stopPropagation()
            selectTokenInCode(generatingAst.token.elem)
        }
    }, { capture: true })

    codeContainer.spellcheck = false
    codeContainer.addEventListener("input", () => {
        renderAndShow(codeContainer.innerText, true)
    })
    codeContainer.addEventListener('pointerdown', e => {
        if (e.detail !== 2) {
            return
        }
        const sel = window.getSelection()
        if (!sel || !(e.target instanceof HTMLElement)) return
        // e.preventDefault()
        // e.stopPropagation()
        sel.selectAllChildren(e.target)
    }, { capture: true })

    const ArgKeys = ["arg", "first", "second"] as const
    type ArgType = typeof ArgKeys[number]

    const findDependentHighlights = (span: HTMLElement): { svgElems: SVGElement[], args: [HTMLElement, ArgType][], builtObj: HTMLElement | undefined } => {
        const ast = elemToAstMap.get(span)
        if (!ast) return { svgElems: [], args: [], builtObj: undefined }

        // if we are a unary op, try to go down to the built object to find highlights
        let objAst: AST = ast
        while ("arg" in objAst) {
            objAst = objAst.arg
        }
        // revert if we are a pose, since poses are binary and highlight a move rather than children
        if (objAst._type === "pose") {
            objAst = ast
        }

        const svgElems = objAst.svgElems

        const args: [HTMLElement, ArgType][] = []
        for (const key of ArgKeys) {
            if (key in ast) {
                const argAst: AST = ast[key as keyof AST] as any
                args.push([argAst.builtObjElem, key])
            }
        }
        // only highlight built object if it's not the same as the current span
        const builtObj = args.length === 0 ? undefined : ast.builtObjElem
        return { svgElems, args, builtObj: builtObj }
    }

    let highlightedSpan: HTMLElement | undefined = undefined

    const clearHighlights = () => {
        if (highlightedSpan) {
            highlightedSpan.classList.remove("highlighted")
            const { svgElems, args, builtObj } = findDependentHighlights(highlightedSpan)
            for (const svgElem of svgElems) {
                svgElem.classList.remove("highlighted")
            }
            for (const [argElem, argType] of args) {
                argElem.classList.remove("highlighted_arg", argType)
            }
            if (builtObj) {
                builtObj.classList.remove("highlighted_built")
            }
            highlightedSpan = undefined
        }
    }

    document.addEventListener("selectionchange", () => {

        const isAtEndOfContainer = (): boolean => {
            const selectionOffsets = getSelectionOffsetsWithin(codeContainer)
            return selectionOffsets !== undefined
                && selectionOffsets.start === selectionOffsets.end
                && selectionOffsets.end === codeContainer.innerText.length
        }

        const findSelectionNode = (): HTMLElement | undefined => {
            const sel = document.getSelection()
            if (!sel) return
            if (isAtEndOfContainer()) return
            const node = sel.focusNode
            if (!node) return
            if (node.nodeType !== Node.TEXT_NODE) return
            const parent = node.parentElement
            if (!parent) return
            if (!codeContainer.contains(parent)) return
            if (!(parent instanceof HTMLElement)) return
            return parent
        }

        const newHighlightedSpan = findSelectionNode()
        // console.log("Selection changed, element:", newHighlightedSpan)

        if (newHighlightedSpan !== highlightedSpan) {
            clearHighlights()
            if (newHighlightedSpan) {
                newHighlightedSpan.classList.add("highlighted")
                const { svgElems, args, builtObj } = findDependentHighlights(newHighlightedSpan)
                for (const svgElem of svgElems) {
                    svgElem.classList.add("highlighted")
                }
                for (const [argElem, argType] of args) {
                    argElem.classList.add("highlighted_arg", argType)
                }
                if (builtObj) {
                    builtObj.classList.add("highlighted_built")
                }
            }
            highlightedSpan = newHighlightedSpan
        }
    })

    codeContainer.style.padding = "4px"
    svgContainer.style.background = background
    prettyprintContainer.style.background = background

    let lastRenderedString = ""
    let elemToAstMap: WeakMap<HTMLElement, AST> = new WeakMap()

    const renderAndShow = (code: string, saveToState: boolean): void => {
        if (code === lastRenderedString) {
            return
        }

        clearHighlights()
        const previousSelection = getSelectionOffsetsWithin(codeContainer)
        let parseResult: [AST, WeakMap<HTMLElement, AST>] | undefined = undefined

        if (code.trim() === "") {
            codeContainer.innerHTML = ""
            svgContainer.innerHTML = ""
            prettyprintContainer.innerHTML = ""
            currentAst = undefined
            elemToAstMap = new WeakMap()
            setParseStatus("idle")
        } else {

            try {
                parseResult = parse(code, dialect)
            } catch (e) {
                if (e instanceof ParseError) {
                    console.log(`Parse error at position ${e.pos}: ${e.message}`)
                } else {
                    throw e
                }
            }
            if (parseResult) {
                const [ast, newElemToAstMap] = parseResult
                currentAst = ast
                elemToAstMap = newElemToAstMap
                setParseStatus("ok")
                prettyprintContainer.innerHTML = pretty(ast)
                // printSizes(ast)
                const svg = astToSVG(ast)
                svgContainer.innerHTML = ""
                svgContainer.appendChild(svg)

                codeContainer.innerHTML = ""
                console.log("AST for final code:", ast, ast.builtObjElem)
                codeContainer.appendChild(ast.builtObjElem)
            } else {
                currentAst = undefined
                elemToAstMap = new WeakMap()
                setParseStatus("error")
                codeContainer.innerHTML = ""
                codeContainer.appendChild(fallbackParse(code))
            }
        }

        if (previousSelection) {
            restoreSelectionOffsetsWithin(codeContainer, previousSelection.start, previousSelection.end)
        }

        lastRenderedString = code
        if (saveToState) {
            const isValidCode = parseResult !== undefined
            saveToURL(code, isValidCode)
        }
    }

    let saveToURL: (code: string, isValidCode: boolean) => void
    let lastSavedWasValid = true

    saveToURL = (code, isValidCode) => {
        const url = new URL(window.location.href)
        if (code.trim().length === 0) {
            url.searchParams.delete('t')
        } else {
            const compressed = LZString.compressToEncodedURIComponent(code)
            url.searchParams.set('t', compressed)
        }
        const usePush = !isValidCode && lastSavedWasValid
        const method = usePush ? "pushState" : "replaceState"
        console.log("saving", { valid: isValidCode, method, code })
        window.history[method]({ code }, '', url.toString())
        lastSavedWasValid = isValidCode
    }

    window.addEventListener("popstate", (event) => {
        if (event.state && typeof event.state.code === "string") {
            console.log("Popstate event, loading code from state:", event.state.code)
            renderAndShow(event.state.code, false)
        }
    })

    const isFullScreen = initialUrlParams.get('fs') === '1'
    if (isFullScreen) {
        cheatSheetContainer.style.display = "none"
        prettyprintContainer.style.display = "none"
        codeRow.style.display = "none"
    }

    const loadFromURL = (): boolean => {
        const compressed = initialUrlParams.get('t')
        if (compressed === null) return false
        const decompressed = LZString.decompressFromEncodedURIComponent(compressed)
        if (decompressed === null) return false
        renderAndShow(decompressed, true)
        return true
    }

    if (!loadFromURL()) {
        renderAndShow(codeContainer.innerText, false)
    }
}

document.addEventListener("DOMContentLoaded", main)

