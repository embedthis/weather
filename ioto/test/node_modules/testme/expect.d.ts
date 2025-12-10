/**
    expect.d.ts - TypeScript type definitions for Jest/Vitest-compatible expect() API
*/

/**
    Matchers interface - defines all available assertion methods
    @template R Return type (void for sync, Promise<void> for async)
*/
export interface Matchers<R = void> {
    /**
        Negates the matcher - use like expect(x).not.toBe(y)
    */
    not: Matchers<R>

    /**
        Unwraps a promise and applies matcher to resolved value
        Use like: await expect(promise).resolves.toBe(value)
    */
    resolves: Matchers<Promise<R>>

    /**
        Unwraps a promise and applies matcher to rejection reason
        Use like: await expect(promise).rejects.toThrow()
    */
    rejects: Matchers<Promise<R>>

    //  Equality Matchers

    /**
        Checks strict equality using Object.is()
        @param expected Expected value
    */
    toBe(expected: any): R

    /**
        Performs deep recursive equality comparison
        @param expected Expected value
    */
    toEqual(expected: any): R

    /**
        Performs strict deep equality, checking undefined properties and object types
        @param expected Expected value
    */
    toStrictEqual(expected: any): R

    //  Truthiness Matchers

    /**
        Checks if value is truthy
    */
    toBeTruthy(): R

    /**
        Checks if value is falsy
    */
    toBeFalsy(): R

    /**
        Checks if value is null
    */
    toBeNull(): R

    /**
        Checks if value is undefined
    */
    toBeUndefined(): R

    /**
        Checks if value is defined (not undefined)
    */
    toBeDefined(): R

    /**
        Checks if value is NaN
    */
    toBeNaN(): R

    //  Type Matchers

    /**
        Checks if value is instance of class
        @param expected Constructor function
    */
    toBeInstanceOf(expected: Function): R

    /**
        Checks if value has specific typeof result
        @param expected Type name ('string', 'number', 'object', etc.)
    */
    toBeTypeOf(expected: 'string' | 'number' | 'boolean' | 'object' | 'function' | 'undefined' | 'symbol' | 'bigint'): R

    //  Numeric Comparison Matchers

    /**
        Checks if value is greater than number
        @param expected Number to compare against
    */
    toBeGreaterThan(expected: number): R

    /**
        Checks if value is greater than or equal to number
        @param expected Number to compare against
    */
    toBeGreaterThanOrEqual(expected: number): R

    /**
        Checks if value is less than number
        @param expected Number to compare against
    */
    toBeLessThan(expected: number): R

    /**
        Checks if value is less than or equal to number
        @param expected Number to compare against
    */
    toBeLessThanOrEqual(expected: number): R

    /**
        Checks floating point approximation
        @param expected Expected value
        @param precision Number of decimal places (default 2)
    */
    toBeCloseTo(expected: number, precision?: number): R

    //  String and Collection Matchers

    /**
        Checks if string matches regex or string pattern
        @param pattern Pattern to match (RegExp or string)
    */
    toMatch(pattern: RegExp | string): R

    /**
        Checks if array or string contains item/substring
        @param item Item or substring to find
    */
    toContain(item: any): R

    /**
        Checks if array contains item with deep equality
        @param item Item to find
    */
    toContainEqual(item: any): R

    /**
        Checks if array or string has specific length
        @param expected Expected length
    */
    toHaveLength(expected: number): R

    /**
        Checks if object has property at key path
        @param keyPath Property path ('a.b.c' or ['a', 'b', 'c'])
        @param value Optional expected value
    */
    toHaveProperty(keyPath: string | string[], value?: any): R

    /**
        Checks if object contains all properties of pattern (partial match)
        @param pattern Pattern object to match
    */
    toMatchObject(pattern: object): R

    //  Error Matchers

    /**
        Checks if function throws an error
        @param error Optional error matcher (string message, RegExp, Error instance, or constructor)
    */
    toThrow(error?: string | RegExp | Error | Function): R

    /**
        Checks if function throws an error (alias for toThrow)
        @param error Optional error matcher
    */
    toThrowError(error?: string | RegExp | Error | Function): R
}

/**
    Main expect function
    @template T Type of the received value
    @param received Value to test
    @returns Matchers instance for chaining assertions
*/
export function expect<T = any>(received: T): Matchers<void>

/**
    ExpectMatcher class (exported for advanced use cases)
*/
export class ExpectMatcher {
    constructor(received: any, isNot?: boolean, promise?: string | null)
    readonly received: any
    readonly isNot: boolean
    readonly promise: string | null
}

/**
    describe() - Group related tests with a label
    @param name Description of the test group
    @param fn Function containing tests (can be async)
*/
export function describe(name: string, fn: () => void | Promise<void>): Promise<void>

/**
    test() - Execute a single test with a label
    @param name Description of the test
    @param fn Test function to execute (can be async)
*/
export function test(name: string, fn: () => void | Promise<void>): Promise<void>

/**
    it() - Alias for test()
    @param name Description of the test
    @param fn Test function to execute (can be async)
*/
export function it(name: string, fn: () => void | Promise<void>): Promise<void>

/**
    beforeEach() - Register a hook to run before each test
    @param fn Hook function to run (can be async)
*/
export function beforeEach(fn: () => void | Promise<void>): void

/**
    afterEach() - Register a hook to run after each test
    @param fn Hook function to run (can be async)
*/
export function afterEach(fn: () => void | Promise<void>): void
