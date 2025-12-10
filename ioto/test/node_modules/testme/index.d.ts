/**
    index.d.ts - TypeScript type definitions for TestMe JavaScript/TypeScript testing API
    Provides types for Jest/Vitest-compatible test organization and traditional TestMe assertions
*/

// Import expect types from expect.d.ts
export * from './expect.js'

/**
    Test function interface with skip capabilities
*/
export interface TestFunction {
    /**
        Execute a test
        @param name Test description
        @param fn Test function (sync or async)
    */
    (name: string, fn: () => void | Promise<void>): Promise<void>

    /**
        Skip a test
        @param name Test description
        @param fn Test function (not executed)
    */
    skip(name: string, fn: () => void | Promise<void>): void

    /**
        Conditionally skip a test
        @param condition If true, test is skipped
        @returns Test function (either normal or skip variant)
    */
    skipIf(condition: boolean): TestFunction
}

/**
    Describe function interface for test grouping
*/
export interface DescribeFunction {
    /**
        Group related tests
        @param name Group description
        @param fn Function containing tests
    */
    (name: string, fn: () => void | Promise<void>): Promise<void>

    /**
        Skip an entire test group
        @param name Group description
        @param fn Function containing tests (not executed)
    */
    skip(name: string, fn: () => void | Promise<void>): Promise<void>
}

// Test organization functions
export const test: TestFunction
export const it: TestFunction
export const describe: DescribeFunction

/**
    Register a hook to run before each test in the current describe block
    @param fn Hook function
*/
export function beforeEach(fn: () => void | Promise<void>): void

/**
    Register a hook to run after each test in the current describe block
    @param fn Hook function
*/
export function afterEach(fn: () => void | Promise<void>): void

/**
    Register a hook to run once before all tests in the current describe block
    @param fn Hook function
*/
export function beforeAll(fn: () => void | Promise<void>): void

/**
    Register a hook to run once after all tests in the current describe block
    @param fn Hook function
*/
export function afterAll(fn: () => void | Promise<void>): void

// Traditional TestMe assertion functions

/**
    Assert a condition is true
    @param condition Value to test
    @param message Optional error message
*/
export function tassert(condition: any, message?: string): void

/**
    Assert a condition is true
    @param condition Value to test
    @param message Optional error message
*/
export function ttrue(condition: any, message?: string): void

/**
    Assert a condition is false
    @param condition Value to test
    @param message Optional error message
*/
export function tfalse(condition: any, message?: string): void

/**
    Fail a test with a message
    @param message Error message
*/
export function tfail(message?: string): void

// Equality functions
export function teq(received: any, expected: any, message?: string): void
export function teqi(received: any, expected: any, message?: string): void
export function teql(received: any, expected: any, message?: string): void
export function teqll(received: any, expected: any, message?: string): void
export function teqz(received: any, expected: any, message?: string): void
export function tequ(received: any, expected: any, message?: string): void
export function teqp(received: any, expected: any, message?: string): void

// Inequality functions
export function tneq(received: any, expected: any, message?: string): void
export function tneqi(received: any, expected: any, message?: string): void
export function tneql(received: any, expected: any, message?: string): void
export function tneqll(received: any, expected: any, message?: string): void
export function tneqz(received: any, expected: any, message?: string): void
export function tnequ(received: any, expected: any, message?: string): void
export function tneqp(received: any, expected: any, message?: string): void

// Comparison functions (greater than)
export function tgti(received: number, expected: number, message?: string): void
export function tgtl(received: number, expected: number, message?: string): void
export function tgtz(received: number, expected: number, message?: string): void

// Comparison functions (greater than or equal)
export function tgtei(received: number, expected: number, message?: string): void
export function tgtel(received: number, expected: number, message?: string): void
export function tgtez(received: number, expected: number, message?: string): void

// Comparison functions (less than)
export function tlti(received: number, expected: number, message?: string): void
export function tltl(received: number, expected: number, message?: string): void
export function tltz(received: number, expected: number, message?: string): void

// Comparison functions (less than or equal)
export function tltei(received: number, expected: number, message?: string): void
export function tltel(received: number, expected: number, message?: string): void
export function tltez(received: number, expected: number, message?: string): void

// NULL checking functions
export function tnull(value: any, message?: string): void
export function tnotnull(value: any, message?: string): void

// String matching functions
export function tmatch(string: string, pattern: string | RegExp, message?: string): void
export function tcontains(string: string, pattern: string, message?: string): void

// Environment and utility functions

/**
    Get environment variable
    @param key Environment variable name
    @param def Default value if not set
    @returns Environment variable value
*/
export function tget(key: string, def?: string | null): string | null

/**
    Check if environment variable is set and non-zero
    @param key Environment variable name
    @returns Numeric value
*/
export function thas(key: string): number

/**
    Get current test depth
    @returns Test depth level
*/
export function tdepth(): number

/**
    Check if verbose mode is enabled
    @returns True if verbose
*/
export function tverbose(): boolean

// Output functions
export function tinfo(...args: any[]): void
export function tdebug(...args: any[]): void
export function tskip(...args: any[]): void
export function twrite(...args: any[]): void

// Default export with all functions
declare const _default: {
    expect: typeof import('./expect.js').expect
    describe: DescribeFunction
    test: TestFunction
    it: TestFunction
    beforeEach: typeof beforeEach
    afterEach: typeof afterEach
    beforeAll: typeof beforeAll
    afterAll: typeof afterAll
    tassert: typeof tassert
    tcontains: typeof tcontains
    tdebug: typeof tdebug
    tdepth: typeof tdepth
    teq: typeof teq
    teqi: typeof teqi
    teql: typeof teql
    teqll: typeof teqll
    teqz: typeof teqz
    tequ: typeof tequ
    teqp: typeof teqp
    tfalse: typeof tfalse
    tfail: typeof tfail
    tget: typeof tget
    tgti: typeof tgti
    tgtl: typeof tgtl
    tgtz: typeof tgtz
    tgtei: typeof tgtei
    tgtel: typeof tgtel
    tgtez: typeof tgtez
    thas: typeof thas
    tinfo: typeof tinfo
    tlti: typeof tlti
    tltl: typeof tltl
    tltz: typeof tltz
    tltei: typeof tltei
    tltel: typeof tltel
    tltez: typeof tltez
    tmatch: typeof tmatch
    tneq: typeof tneq
    tneqi: typeof tneqi
    tneql: typeof tneql
    tneqll: typeof tneqll
    tneqz: typeof tneqz
    tnequ: typeof tnequ
    tneqp: typeof tneqp
    tnull: typeof tnull
    tnotnull: typeof tnotnull
    tskip: typeof tskip
    ttrue: typeof ttrue
    tverbose: typeof tverbose
    twrite: typeof twrite
}

export default _default
