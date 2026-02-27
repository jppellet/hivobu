// import { Diagnostic, linter } from "@codemirror/lint"
// import { Compartment, Prec, StateEffect, StateField } from '@codemirror/state'
// import { Decoration, keymap } from '@codemirror/view'
// import { EditorView, minimalSetup } from 'codemirror'


import * as LZString from "lz-string"


type Point = { x: number, y: number }
type SizeAndCenter = { w: number, h: number, relativeCenter: Point }

const ObjsDict = {
    "tri": { w: 10, h: 8.7, relativeCenter: { x: 5, y: 5.8 }, defaultFill: "#ffff5c" },
    "dem": { w: 10, h: 5, relativeCenter: { x: 5, y: 2.5 }, defaultFill: "#a2d0f1" },
    "ova": { w: 5, h: 10, relativeCenter: { x: 2.5, y: 5 }, defaultFill: "#fbd7f0" },
    "rec": { w: 3, h: 10, relativeCenter: { x: 1.5, y: 5 }, defaultFill: "#2a7809" },
    "car": { w: 10, h: 10, relativeCenter: { x: 5, y: 5 }, defaultFill: "#9ded99" },
    "fer": { w: 10, h: 10, relativeCenter: { x: 5, y: 5 }, defaultFill: "#909090" },
    "vid": { w: 10, h: 10, relativeCenter: { x: 5, y: 5 }, defaultFill: "#00000000" },
} as const satisfies Record<string, SizeAndCenter & { defaultFill: string }>
type Obj = keyof typeof ObjsDict
const Objs = Object.keys(ObjsDict) as readonly Obj[]

type Context = Record<string, any>

const PosesDict = {
    "emp": (first, second, ctx) => undefined,

    "soud": (first, second, ctx) => undefined,
    "soug": (first, second, ctx) => undefined,
    "sou": (first, second, ctx) => undefined,

    "coth": (first, second, ctx) => undefined,
    "cotb": (first, second, ctx) => undefined,
    "cot": (first, second, ctx) => undefined,
} as const satisfies Record<string, (first: AST, second: AST, ctx: Context) => any>
type Pose = keyof typeof PosesDict
const Poses = Object.keys(PosesDict) as readonly Pose[]

const Angles = ["0", "3", "6", "9"] as const
type Angle = typeof Angles[number]

const SIZE_FACTOR = 2 // Math.sqrt(2)

const SizesDict = {
    "-": 1 / SIZE_FACTOR,
    "+": SIZE_FACTOR,
    "s": 1 / SIZE_FACTOR,
    "m": 1,
    "l": SIZE_FACTOR,
} as const satisfies Record<string, number>
type Size = keyof typeof SizesDict
const Sizes = Object.keys(SizesDict) as readonly Size[]

type AST = (
    | { _type: 'obj'; token: ParsedToken<Obj> }
    | { _type: 'pose'; token: ParsedToken<Pose>; first: AST; second: AST }
    | { _type: 'col'; token: ParsedToken<Color>; arg: AST }
    | { _type: 'rot'; token: ParsedToken<Angle>; arg: AST }
    | { _type: 'size'; token: ParsedToken<Size>; arg: AST }
) & {
    builtObjElem: HTMLElement
    cachedSize?: SizeAndCenter,
    svgElem?: SVGElement,
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
    T extends 'obj' ? 0 :
    T extends 'pose' ? 2 :
    T extends 'col' | 'rot' | 'size' ? 1 :
    T extends CSTOnlyType ? 0 :
    never

const ColorDict = {
    "jaune": "yellow",
    "bleuclair": "lightblue",
    "bleu": "blue",
    "cyan": "cyan",
    "vertclair": "lightgreen",
    "vert": "green",
    "orange": "orange",
    "rose": "pink",
    "gris": "gray",
    "rouge": "red",
    "blanc": "white",
    "noir": "black",
    "magenta": "magenta",
    "beige": "beige",
} as const satisfies Record<string, string>
type Color = keyof typeof ColorDict
const Colors = Object.keys(ColorDict) as readonly Color[]
const ColorChar = "@"

const NoOps = [" ", " ", "\t", "\n", "(", ")"] as const

class ParseError extends Error {
    constructor(public readonly pos: number, message: string) {
        super(message)
        this.name = "ParseError"
    }
}

type ParsedToken<T extends string = string> = { str: T, range: { pos: number, len: number }, elem: HTMLElement }


function parse(input: string, lib: Record<string, AST> = {}): [AST, WeakMap<HTMLElement, AST>] {

    console.log(`Parsing input: '${input}'`)

    const elemToAstMap: WeakMap<HTMLElement, AST> = new WeakMap()
    const lines = input.toLowerCase().split(/\r?\n|;/)
    const defs: Map<string, AST> = new Map(Object.entries(lib))
    const stack: AST[] = []

    let l = 0
    let c = 0
    let prevLinesOffset = 0

    // const makePos = (len: number) => ({ line: l + 1, col: c + 1, len })
    // const makePos = (len: number) => ({ pos: prevLinesOffset + c, len })
    const error = (message: string) => {
        throw new ParseError(prevLinesOffset + c, message)
    }


    const tryMatchOneOf = <T extends ASTType | CSTOnlyType>(candidates: readonly TokenTypeForASTType<T>[], type: T, arity: Arity<T>, mustMatch: boolean = false, prepend: string = ""): boolean => {
        for (const str of candidates) {
            if (input.startsWith(str, c)) {
                // console.log(`At pos ${prevLinesOffset + c}, matched ${type} token '${str}'`)
                c += str.length
                const range = { pos: prevLinesOffset + c, len: str.length }
                const elem = document.createElement("span")
                elem.classList.add("ast", type)
                elem.innerHTML = prepend + str.replace(/\n/g, "<br>")
                const parsedToken = { str, range, elem }
                if (!isCSTOnlyType(type)) {
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
                            const second = stack.pop()!
                            const first = stack.pop()!
                            argsObj.second = second
                            argsObj.first = first
                            builtObjElem = document.createElement("span")
                            builtObjElem.classList.add("ast")
                            builtObjElem.appendChild(first.builtObjElem)
                            builtObjElem.appendChild(second.builtObjElem)
                            builtObjElem.appendChild(elem)
                        } else {
                            return error(`Unsupported arity ${arity} for type ${type}`)
                        }
                    }
                    const ast: AST = { _type: type, token: parsedToken, ...argsObj, builtObjElem } as any
                    stack.push(ast)
                    elemToAstMap.set(elem, ast)
                }
                return true
                // } else {
                //     console.log(`At pos ${prevLinesOffset + c}, did not match ${type} token '${str}'`)
            }
        }
        if (mustMatch) {
            return error(`Expected one of ${candidates.join(", ")} at position ${c}, got: ${input.slice(c)}`)
        }
        return false
    }

    const parseExpr = (input: string): AST => {
        while (c < input.length) {
            if (tryMatchOneOf(NoOps, "noop", 0))
                continue

            if (tryMatchOneOf([ColorChar], "colchar", 0)) {
                tryMatchOneOf(Colors, "col", 1, true, ColorChar)
                continue
            }

            // for (const [name, ast] of defs) {
            //     if (input.startsWith(name, c)) {
            //         stack.push({ ...ast, tokenRange: makePos(name.length) })
            //         c += name.length
            //         continue outer
            //     }
            // }

            if (tryMatchOneOf(Objs, "obj", 0))
                continue

            if (tryMatchOneOf(Poses, "pose", 2))
                continue

            if (tryMatchOneOf(Angles, "rot", 1))
                continue

            if (tryMatchOneOf(Sizes, "size", 1))
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
                console.log("Final AST:", ast)
                return [ast, elemToAstMap]
            }
        }
        prevLinesOffset += line.length + 1
    }

    return error(`No expression found in input`)
}

function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

function pretty(ast: AST, parensIfComplex?: boolean): string {
    switch (ast._type) {
        case 'obj':
            return `<span style="text-decoration: underline;">${capitalize(ast.token.str)}</span>`
        case 'pose': {
            const repr = `${pretty(ast.first, true)} ${pretty(ast.second, true)} <span style="font-weight: bold;">${capitalize(ast.token.str)}</span>`
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
        case 'col':
            return `${pretty(ast.arg, true)}<span style="font-style: italic;">@${capitalize(ast.token.str)}</span>`
    }
}


function sizeOf(ast: AST): SizeAndCenter {
    if (!ast.cachedSize) {
        ast.cachedSize = ((): SizeAndCenter => {
            switch (ast._type) {
                case 'obj':
                    return ObjsDict[ast.token.str]
                case 'pose': {
                    const pose = ast.token.str
                    const firstSize = sizeOf(ast.first)
                    const secondSize = sizeOf(ast.second)
                    const newWidthDefault = Math.max(firstSize.relativeCenter.x, secondSize.relativeCenter.x) + Math.max(firstSize.w - firstSize.relativeCenter.x, secondSize.w - secondSize.relativeCenter.x)
                    const newHeightDefault = Math.max(firstSize.relativeCenter.y, secondSize.relativeCenter.y) + Math.max(firstSize.h - firstSize.relativeCenter.y, secondSize.h - secondSize.relativeCenter.y)
                    switch (pose) {
                        case 'emp':
                            return {
                                w: newWidthDefault,
                                h: newHeightDefault,
                                relativeCenter: {
                                    x: Math.max(firstSize.relativeCenter.x, secondSize.relativeCenter.x),
                                    y: Math.max(firstSize.relativeCenter.y, secondSize.relativeCenter.y)
                                }
                            }
                        case 'sou':
                        case 'soud':
                        case "soug": {
                            const relativeCenterX = (() => {
                                switch (pose) {
                                    case 'sou': return Math.max(firstSize.relativeCenter.x, secondSize.relativeCenter.x)
                                    case 'soug': return Math.min(firstSize.relativeCenter.x, secondSize.relativeCenter.x)
                                    case 'soud': return firstSize.w > secondSize.w
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
                        case 'cot':
                        case "cotb":
                        case "coth":
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
                    const factor = SizesDict[size]
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
            elem.setAttribute(key, value.toString())
        }
    }
    return elem
}

function objClassName(objName: string, additionalClassName?: string): string {
    return `obj ${objName} ${additionalClassName ?? ""}`
}

function svgRect(objName: string, x: number, y: number, width: number, height: number, transform: string, additionalClassName?: string): SVGRectElement {
    return makeSvgElem("rect", {
        class: objClassName(objName, additionalClassName),
        x, y, width, height,
        transform
    })
}

function svgPolygon(objName: string, pointsArr: Point[], transform: string, additionalClassName?: string): SVGPolygonElement {
    const points = pointsArr.map(p => `${p.x},${p.y}`).join(" ")
    return makeSvgElem("polygon", {
        class: objClassName(objName, additionalClassName),
        points,
        transform
    })
}

function svgPath(objName: string, d: string, transform: string, additionalClassName?: string): SVGPathElement {
    return makeSvgElem("path", {
        class: objClassName(objName, additionalClassName),
        d,
        transform
    })
}

function svgEllipse(objName: string, cx: number, cy: number, rx: number, ry: number, transform: string, additionalClassName?: string): SVGEllipseElement {
    return makeSvgElem("ellipse", {
        class: objClassName(objName, additionalClassName),
        cx, cy, rx, ry,
        transform
    })
}


function svgEmpty() {
    return makeSvgElem("g", {})
}

function svgGroup(children: SVGElement[], transform?: string, className?: string): SVGGElement {
    const group = makeSvgElem("g", {
        class: className,
        transform,
    })
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
        ast.svgElem = svgElem
        return svgElem

        function doRender(): SVGElement {
            switch (ast._type) {
                case 'obj': {
                    const obj = ast.token.str
                    const def = ObjsDict[obj]
                    // const transform = `transform="translate(${-def.relativeCenter.x} ${-def.relativeCenter.y}) "`
                    const translation = `translate(${-def.relativeCenter.x} ${-def.relativeCenter.y})`
                    const objSvg: SVGElement = (() => {
                        switch (obj) {
                            case "rec":
                                return svgRect(obj, 0, 0, def.w, def.h, translation)
                            case "tri":
                                return svgPolygon(obj, [{ x: 0, y: def.h }, { x: def.w, y: def.h }, { x: def.w / 2, y: 0 }], translation)
                            case "car":
                                return svgRect(obj, 0, 0, def.w, def.h, translation)
                            case "dem":
                                return svgPath(obj, `M 0 ${def.h} A ${def.w / 2} ${def.h} 0 0 1 ${def.w} ${def.h} L ${def.w} ${def.h} L 0 ${def.h} Z`, translation)
                            case "ova":
                                return svgEllipse(obj, def.w / 2, def.h / 2, def.w / 2, def.h / 2, translation)
                            case "fer":
                                return svgPolygon(obj, [{ x: def.w / 2, y: 0 }, { x: def.w, y: def.h }, { x: def.w / 2, y: def.h / 2 }, { x: 0, y: def.h }], translation)
                            case "vid":
                                return svgEmpty()
                        }
                    })()

                    return svgGroup([objSvg, makeCenterCircle()])
                }
                case 'pose': {
                    const pose = ast.token.str
                    const firstSvg = render(ast.first)
                    const secondSvg = render(ast.second)
                    const combinedSize = sizeOf(ast)
                    const firstSize = sizeOf(ast.first)
                    const secondSize = sizeOf(ast.second)
                    switch (pose) {
                        case 'emp':
                            return svgGroup([
                                svgGroup([firstSvg], undefined, "first"),
                                svgGroup([secondSvg], undefined, "second"),
                            ], undefined, `pose ${pose}`)

                        case 'sou':
                        case 'soug':
                        case 'soud': {
                            const combinedDy = firstSize.relativeCenter.y - combinedSize.relativeCenter.y
                            const [secondDx, combinedDx] = (() => {
                                switch (pose) {
                                    case 'sou': return [0, 0]
                                    case 'soug': return [- firstSize.relativeCenter.x + secondSize.relativeCenter.x, firstSize.relativeCenter.x - combinedSize.relativeCenter.x]
                                    case 'soud': {
                                        const combinedDx = firstSize.relativeCenter.x <= secondSize.relativeCenter.x ? 0 : firstSize.relativeCenter.x - combinedSize.relativeCenter.x
                                        return [firstSize.w - firstSize.relativeCenter.x - (secondSize.w - secondSize.relativeCenter.x), combinedDx]
                                    }
                                }
                            })()
                            const secondDy = firstSize.h - firstSize.relativeCenter.y + secondSize.relativeCenter.y

                            return svgGroup([
                                svgGroup([firstSvg], undefined, "first"),
                                svgGroup([
                                    svgGroup([secondSvg], `translate(${secondDx} ${secondDy})`),
                                ], undefined, "second"),
                            ], `translate(${combinedDx} ${combinedDy})`, `pose ${pose.slice(0, 3)}`)
                        }
                        case 'cot':
                        case 'coth':
                        case 'cotb': {
                            const combinedDx = firstSize.relativeCenter.x - combinedSize.relativeCenter.x
                            const [secondDy, combinedDy] = (() => {
                                switch (pose) {
                                    case 'cot': return [0, 0]
                                    case 'coth': return [- firstSize.relativeCenter.y + secondSize.relativeCenter.y, firstSize.relativeCenter.y - combinedSize.relativeCenter.y]
                                    case 'cotb': {
                                        const combinedDy = firstSize.relativeCenter.y > secondSize.relativeCenter.y ? 0 : -firstSize.relativeCenter.y + combinedSize.relativeCenter.y
                                        return [firstSize.h - firstSize.relativeCenter.y - (secondSize.h - secondSize.relativeCenter.y), combinedDy]
                                    }
                                }
                            })()
                            const secondDx = firstSize.w - firstSize.relativeCenter.x + secondSize.relativeCenter.x
                            return svgGroup([
                                svgGroup([firstSvg], undefined, "first"),
                                svgGroup([
                                    svgGroup([secondSvg], `translate(${secondDx} ${secondDy})`),
                                ], undefined, "second"),
                            ], `translate(${combinedDx} ${combinedDy})`, `pose ${pose.slice(0, 3)}`)
                        }
                    }
                }
                case 'rot': {
                    const angle = ast.token.str
                    return svgGroup([render(ast.arg)], `rotate(${30 * parseInt(angle)})`, `rot${angle}`)
                }
                case 'size': {
                    const size = ast.token.str
                    const factor = SizesDict[size]
                    return svgGroup([render(ast.arg)], `scale(${factor})`, `size${size}`)
                }
                case 'col': {
                    const color = ast.token.str
                    const cssColor = ColorDict[color]
                    const group = svgGroup([render(ast.arg)], undefined, `col${color}`)
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
    // const globalDx = 0
    // const globalDy = 0
    const centerFill = debug ? "red" : "none"
    const objFillColor = "var(--fillcolor, var(--defaultcolor))"
    const dropShadow = "drop-shadow(0px 0px 0.2px #0004)"
    const debugFrame = !debug ? svgEmpty()
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
            stroke-width: 0;/*.15;*/
            stroke: oklab(from ${objFillColor} calc(l * 0.85) a b / 0.3);
        }
        ${Object.entries(ObjsDict).map(([name, props]) =>
        `.${name} { --defaultcolor: ${props.defaultFill}; }`
    ).join("\n        ")}


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
        stroke-width: 5;
    }
    25% {
        stroke-width: 0;
    }
}

span.ast {
    display: inline-block;
    margin: 0 0.1ex;
}

span.ast.highlighted {
    border-bottom: 2px solid gray;
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

.pose.cot.highlighted > .second {
    animation: cot 2s ease-in-out infinite;
}

.pose.sou.highlighted > .second {
    animation: sou 2s ease-in-out infinite;
}

.pose.emp.highlighted > .second *.obj {
    stroke: ${objFillColor};
    animation: emp 2s ease-in-out infinite;
}
    `

    const svgChildren = [
        svgStyle,
        svgGroup([render(ast)], `translate(${globalDx} ${globalDy})`, "shadow"),
        debugFrame,
    ]

    for (const child of svgChildren) {
        svg.appendChild(child)
    }

    return svg
}

// const lib = {
//     "ron": parse("DemDem6Sou"),
//     "cro": parse("Rec3RecEmp"),
// }


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



async function main() {

    const codeContainer = document.getElementById("code-container")
    const svgContainer = document.getElementById("svg-container")
    const prettyprintContainer = document.getElementById("prettyprint-container")

    if (!codeContainer || !svgContainer || !prettyprintContainer) {
        throw new Error("HTML containers not found")
    }

    codeContainer.spellcheck = false
    codeContainer.addEventListener("input", () => {
        renderAndShow(codeContainer.innerText)
    })

    const ArgKeys = ["arg", "first", "second"] as const
    type ArgType = typeof ArgKeys[number]

    const findDependentHighlights = (span: HTMLElement): { svgElem?: SVGElement, args: [HTMLElement, ArgType][] } => {
        const ast = elemToAstMap.get(span)
        if (!ast) return { args: [] }
        const svgElem = ast.svgElem

        const args: [HTMLElement, ArgType][] = []
        for (const key of ArgKeys) {
            if (key in ast) {
                const argAst: AST = ast[key as keyof AST] as any
                args.push([argAst.builtObjElem, key])
            }
        }
        return { svgElem, args }
    }

    let highlightedSpan: HTMLElement | undefined = undefined

    const clearHighlights = () => {
        if (highlightedSpan) {
            highlightedSpan.classList.remove("highlighted")
            const { svgElem, args } = findDependentHighlights(highlightedSpan)
            if (svgElem) {
                svgElem.classList.remove("highlighted")
            }
            for (const [argElem, argType] of args) {
                argElem.classList.remove("highlighted_arg", argType)
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
        console.log("Selection changed, element:", newHighlightedSpan)

        if (newHighlightedSpan !== highlightedSpan) {
            clearHighlights()
            if (newHighlightedSpan) {
                newHighlightedSpan.classList.add("highlighted")
                const { svgElem, args } = findDependentHighlights(newHighlightedSpan)
                if (svgElem) {
                    svgElem.classList.add("highlighted")
                }
                for (const [argElem, argType] of args) {
                    argElem.classList.add("highlighted_arg", argType)
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

    const renderAndShow = (code: string): void => {
        if (code === lastRenderedString) {
            return
        }

        clearHighlights()
        const previousSelection = getSelectionOffsetsWithin(codeContainer)
        let parseResult: [AST, WeakMap<HTMLElement, AST>] | undefined = undefined

        try {
            parseResult = parse(code)
            console.log("Rendered")
        } catch (e) {
            if (e instanceof ParseError) {
                console.log(`Parse error at position ${e.pos}: ${e.message}`)
            } else {
                throw e
            }
        }
        if (parseResult) {
            const [ast, newElemToAstMap] = parseResult
            elemToAstMap = newElemToAstMap
            prettyprintContainer.innerHTML = pretty(ast)
            // printSizes(ast)
            const svg = astToSVG(ast)
            svgContainer.innerHTML = ""
            svgContainer.appendChild(svg)

            codeContainer.innerHTML = ""
            console.log("AST for final code:", ast, ast.builtObjElem)
            codeContainer.appendChild(ast.builtObjElem)
        } else {
            elemToAstMap = new WeakMap()
            prettyprintContainer.innerHTML = ""
            codeContainer.innerHTML = ""
            codeContainer.appendChild(document.createTextNode(code))
        }

        if (previousSelection) {
            restoreSelectionOffsetsWithin(codeContainer, previousSelection.start, previousSelection.end)
        }

        lastRenderedString = code
    }

    const snowman = "ron@blancsstri@rougesouron@beigeovaovacot@noirssempsou"
    const flower = "tri@bleutri6@bleuclairempron@orangessemprecrecsou@vertclairsou"
    const switzerland = "car@rougerec3recemp@blancsemp"
    const bee = "Dem@beigeova@noir-vidcot-EmpCar@orangeDem@bleuclair3-CothSoug"
    const all = gallery(snowman, flower, switzerland, bee)

    let saveToURL: () => Promise<void>

    saveToURL = async () => {
        const userCode = codeContainer.innerText
        const compressed = LZString.compressToEncodedURIComponent(userCode)
        const url = new URL(window.location.href)
        url.searchParams.set('t', compressed)
        window.history.replaceState({}, '', url.toString())
    }

    renderAndShow(codeContainer.innerText)
}

document.addEventListener("DOMContentLoaded", main)