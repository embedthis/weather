/**
    expect.js - Jest/Vitest-compatible expect() API for TestMe
    Provides a familiar testing API while using TestMe's infrastructure
*/

import {getStack, isInTestContext} from './index.js'

/**
    Deep equality comparison for objects, arrays, and primitives
    Handles circular references, Maps, Sets, Dates, RegExp, etc.
    @param {*} a First value
    @param {*} b Second value
    @param {boolean} strict If true, checks for undefined properties and exact types
    @returns {boolean} True if values are deeply equal
*/
function deepEqual(a, b, strict = false) {
    //  Use Object.is for primitives (handles NaN, -0, +0 correctly)
    if (Object.is(a, b)) {
        return true
    }

    //  Handle null and undefined
    if (a === null || b === null || a === undefined || b === undefined) {
        return false
    }

    //  Type checking
    const typeA = typeof a
    const typeB = typeof b
    if (typeA !== typeB) {
        return false
    }

    //  Primitives of different values
    if (typeA !== 'object') {
        return false
    }

    //  Special object types
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
    }

    if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags
    }

    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size) return false
        for (const [key, value] of a.entries()) {
            if (!b.has(key) || !deepEqual(value, b.get(key), strict)) {
                return false
            }
        }
        return true
    }

    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size) return false
        for (const value of a.values()) {
            let found = false
            for (const bValue of b.values()) {
                if (deepEqual(value, bValue, strict)) {
                    found = true
                    break
                }
            }
            if (!found) return false
        }
        return true
    }

    //  Array comparison
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false
        }
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i], strict)) {
                return false
            }
        }
        return true
    }

    //  Object comparison
    if (a.constructor !== b.constructor) {
        return strict ? false : true //  Strict mode checks constructor
    }

    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (strict) {
        //  Strict mode: check all own properties including undefined
        const allKeysA = Object.getOwnPropertyNames(a)
        const allKeysB = Object.getOwnPropertyNames(b)
        if (allKeysA.length !== allKeysB.length) {
            return false
        }
        for (const key of allKeysA) {
            if (!allKeysB.includes(key)) {
                return false
            }
            if (!deepEqual(a[key], b[key], strict)) {
                return false
            }
        }
    } else {
        //  Non-strict: only check defined keys
        if (keysA.length !== keysB.length) {
            return false
        }
        for (const key of keysA) {
            if (!keysB.includes(key)) {
                return false
            }
            if (!deepEqual(a[key], b[key], strict)) {
                return false
            }
        }
    }

    return true
}

/**
    Partial object matching - checks if object contains all properties of pattern
    @param {object} obj Object to check
    @param {object} pattern Pattern to match against
    @returns {boolean} True if object matches pattern
*/
function matchObject(obj, pattern) {
    if (typeof obj !== 'object' || typeof pattern !== 'object') {
        return false
    }
    if (obj === null || pattern === null) {
        return false
    }

    for (const key of Object.keys(pattern)) {
        if (!(key in obj)) {
            return false
        }
        const objValue = obj[key]
        const patternValue = pattern[key]

        if (typeof patternValue === 'object' && patternValue !== null && !Array.isArray(patternValue)) {
            if (!matchObject(objValue, patternValue)) {
                return false
            }
        } else if (!deepEqual(objValue, patternValue)) {
            return false
        }
    }
    return true
}

/**
    Check if object has property at key path
    @param {object} obj Object to check
    @param {string|Array} keyPath Key path (e.g., 'a.b.c' or ['a', 'b', 'c'])
    @returns {boolean} True if property exists (even if value is undefined)
*/
function hasProperty(obj, keyPath) {
    const keys = Array.isArray(keyPath) ? keyPath : keyPath.split('.')
    let current = obj
    for (let i = 0; i < keys.length; i++) {
        if (current === null || current === undefined || typeof current !== 'object') {
            return false
        }
        const key = keys[i]
        if (!(key in current)) {
            return false
        }
        if (i < keys.length - 1) {
            current = current[key]
        }
    }
    return true
}

/**
    Get property value from object using key path
    @param {object} obj Object to traverse
    @param {string|Array} keyPath Key path (e.g., 'a.b.c' or ['a', 'b', 'c'])
    @returns {*} Property value or undefined
*/
function getProperty(obj, keyPath) {
    const keys = Array.isArray(keyPath) ? keyPath : keyPath.split('.')
    let current = obj
    for (const key of keys) {
        if (current === null || current === undefined) {
            return undefined
        }
        current = current[key]
    }
    return current
}

/**
    Format value for error messages
    @param {*} value Value to format
    @returns {string} Formatted string
*/
function formatValue(value) {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value.toString()
    if (typeof value === 'function') return '[Function]'
    if (value instanceof RegExp) return value.toString()
    if (value instanceof Date) return value.toISOString()
    if (Array.isArray(value)) {
        if (value.length > 10) {
            return `[Array(${value.length})]`
        }
        return JSON.stringify(value)
    }
    if (typeof value === 'object') {
        try {
            const str = JSON.stringify(value, null, 2)
            if (str.length > 200) {
                return `[Object]`
            }
            return str
        } catch (e) {
            return '[Object]'
        }
    }
    return String(value)
}

/**
    ExpectMatcher class - implements all Jest/Vitest matchers
    Supports .not, .resolves, .rejects modifiers
*/
class ExpectMatcher {
    constructor(received, isNot = false, promise = null) {
        this.received = received
        this.isNot = isNot
        this.promise = promise
    }

    /**
        Internal helper to create a matcher result
        @param {string} name Matcher name
        @param {boolean} pass Did the matcher pass?
        @param {string} message Error message if failed
    */
    createResult(name, pass, message) {
        const success = this.isNot ? !pass : pass
        if (!success) {
            const stack = getStack()
            const loc = `${stack.filename}:${stack.line}`
            const prefix = this.isNot ? 'not ' : ''
            const errorMsg = `${message} at ${loc}\n   Matcher: expect(...).${prefix}${name}`

            //  If we're inside a test() block, throw an error so test() can catch it
            //  Otherwise, print and exit immediately (backward compatible behavior)
            if (isInTestContext()) {
                throw new Error(errorMsg)
            } else {
                console.error(`✗ ${message} at ${loc}`)
                console.error(`   Matcher: expect(...).${prefix}${name}`)
                process.exit(1)
            }
        }
    }

    /**
        .not modifier - negates the matcher
    */
    get not() {
        return new ExpectMatcher(this.received, !this.isNot, this.promise)
    }

    /**
        .resolves modifier - unwraps promise and applies matcher to resolved value
    */
    get resolves() {
        if (!(this.received instanceof Promise)) {
            throw new Error('expect.resolves requires a Promise')
        }
        return new ExpectMatcher(this.received, this.isNot, 'resolves')
    }

    /**
        .rejects modifier - unwraps promise and applies matcher to rejection reason
    */
    get rejects() {
        if (!(this.received instanceof Promise)) {
            throw new Error('expect.rejects requires a Promise')
        }
        return new ExpectMatcher(this.received, this.isNot, 'rejects')
    }

    /**
        Internal helper to handle async matchers
        @param {Function} matcher Matcher function to run
        @returns {Promise|void} Promise if async, void if sync
    */
    handleAsync(matcher) {
        if (this.promise === 'resolves') {
            //  Async: resolve promise then run matcher
            return (async () => {
                try {
                    const value = await this.received
                    return matcher(value)
                } catch (error) {
                    this.createResult(
                        'resolves',
                        false,
                        `Expected promise to resolve but it rejected with: ${error.message}`
                    )
                }
            })()
        } else if (this.promise === 'rejects') {
            //  Async: reject promise then run matcher
            return (async () => {
                try {
                    await this.received
                    this.createResult('rejects', false, 'Expected promise to reject but it resolved')
                } catch (error) {
                    return matcher(error)
                }
            })()
        } else {
            //  Sync: just run matcher directly
            return matcher(this.received)
        }
    }

    //  ==================== Equality Matchers ====================

    /**
        toBe(expected) - Strict equality using Object.is()
        @param {*} expected Expected value
    */
    toBe(expected) {
        return this.handleAsync((received) => {
            const pass = Object.is(received, expected)
            const message = pass
                ? `Expected ${formatValue(received)} not to be ${formatValue(expected)}`
                : `Expected ${formatValue(received)} to be ${formatValue(expected)}`
            this.createResult('toBe', pass, message)
        })
    }

    /**
        toEqual(expected) - Deep equality comparison
        @param {*} expected Expected value
    */
    async toEqual(expected) {
        return this.handleAsync((received) => {
            const pass = deepEqual(received, expected, false)
            const message = pass
                ? `Expected ${formatValue(received)} not to equal ${formatValue(expected)}`
                : `Expected ${formatValue(received)} to equal ${formatValue(expected)}`
            this.createResult('toEqual', pass, message)
        })
    }

    /**
        toStrictEqual(expected) - Strict deep equality (checks undefined props and types)
        @param {*} expected Expected value
    */
    async toStrictEqual(expected) {
        return this.handleAsync((received) => {
            const pass = deepEqual(received, expected, true)
            const message = pass
                ? `Expected ${formatValue(received)} not to strictly equal ${formatValue(expected)}`
                : `Expected ${formatValue(received)} to strictly equal ${formatValue(expected)}`
            this.createResult('toStrictEqual', pass, message)
        })
    }

    //  ==================== Truthiness Matchers ====================

    /**
        toBeTruthy() - Value is truthy
    */
    async toBeTruthy() {
        return this.handleAsync((received) => {
            const pass = Boolean(received)
            const message = pass
                ? `Expected ${formatValue(received)} not to be truthy`
                : `Expected ${formatValue(received)} to be truthy`
            this.createResult('toBeTruthy', pass, message)
        })
    }

    /**
        toBeFalsy() - Value is falsy
    */
    async toBeFalsy() {
        return this.handleAsync((received) => {
            const pass = !Boolean(received)
            const message = pass
                ? `Expected ${formatValue(received)} not to be falsy`
                : `Expected ${formatValue(received)} to be falsy`
            this.createResult('toBeFalsy', pass, message)
        })
    }

    /**
        toBeNull() - Value is null
    */
    async toBeNull() {
        return this.handleAsync((received) => {
            const pass = received === null
            const message = pass
                ? `Expected ${formatValue(received)} not to be null`
                : `Expected ${formatValue(received)} to be null`
            this.createResult('toBeNull', pass, message)
        })
    }

    /**
        toBeUndefined() - Value is undefined
    */
    async toBeUndefined() {
        return this.handleAsync((received) => {
            const pass = received === undefined
            const message = pass
                ? `Expected ${formatValue(received)} not to be undefined`
                : `Expected ${formatValue(received)} to be undefined`
            this.createResult('toBeUndefined', pass, message)
        })
    }

    /**
        toBeDefined() - Value is not undefined
    */
    async toBeDefined() {
        return this.handleAsync((received) => {
            const pass = received !== undefined
            const message = pass
                ? `Expected ${formatValue(received)} to be undefined`
                : `Expected ${formatValue(received)} to be defined`
            this.createResult('toBeDefined', pass, message)
        })
    }

    /**
        toBeNaN() - Value is NaN
    */
    async toBeNaN() {
        return this.handleAsync((received) => {
            const pass = Number.isNaN(received)
            const message = pass
                ? `Expected ${formatValue(received)} not to be NaN`
                : `Expected ${formatValue(received)} to be NaN`
            this.createResult('toBeNaN', pass, message)
        })
    }

    //  ==================== Type Matchers ====================

    /**
        toBeInstanceOf(expected) - Value is instance of class
        @param {Function} expected Constructor function
    */
    async toBeInstanceOf(expected) {
        return this.handleAsync((received) => {
            const pass = received instanceof expected
            const message = pass
                ? `Expected ${formatValue(received)} not to be instance of ${expected.name}`
                : `Expected ${formatValue(received)} to be instance of ${expected.name}`
            this.createResult('toBeInstanceOf', pass, message)
        })
    }

    /**
        toBeTypeOf(expected) - Value has specific typeof result
        @param {string} expected Type name ('string', 'number', 'object', etc.)
    */
    async toBeTypeOf(expected) {
        return this.handleAsync((received) => {
            const pass = typeof received === expected
            const message = pass
                ? `Expected type of ${formatValue(received)} not to be ${expected}`
                : `Expected type of ${formatValue(received)} to be ${expected}, got ${typeof received}`
            this.createResult('toBeTypeOf', pass, message)
        })
    }

    //  ==================== Numeric Comparison Matchers ====================

    /**
        toBeGreaterThan(expected) - received > expected
        @param {number} expected Number to compare against
    */
    async toBeGreaterThan(expected) {
        return this.handleAsync((received) => {
            const pass = received > expected
            const message = pass
                ? `Expected ${received} not to be greater than ${expected}`
                : `Expected ${received} to be greater than ${expected}`
            this.createResult('toBeGreaterThan', pass, message)
        })
    }

    /**
        toBeGreaterThanOrEqual(expected) - received >= expected
        @param {number} expected Number to compare against
    */
    async toBeGreaterThanOrEqual(expected) {
        return this.handleAsync((received) => {
            const pass = received >= expected
            const message = pass
                ? `Expected ${received} not to be greater than or equal to ${expected}`
                : `Expected ${received} to be greater than or equal to ${expected}`
            this.createResult('toBeGreaterThanOrEqual', pass, message)
        })
    }

    /**
        toBeLessThan(expected) - received < expected
        @param {number} expected Number to compare against
    */
    async toBeLessThan(expected) {
        return this.handleAsync((received) => {
            const pass = received < expected
            const message = pass
                ? `Expected ${received} not to be less than ${expected}`
                : `Expected ${received} to be less than ${expected}`
            this.createResult('toBeLessThan', pass, message)
        })
    }

    /**
        toBeLessThanOrEqual(expected) - received <= expected
        @param {number} expected Number to compare against
    */
    async toBeLessThanOrEqual(expected) {
        return this.handleAsync((received) => {
            const pass = received <= expected
            const message = pass
                ? `Expected ${received} not to be less than or equal to ${expected}`
                : `Expected ${received} to be less than or equal to ${expected}`
            this.createResult('toBeLessThanOrEqual', pass, message)
        })
    }

    /**
        toBeCloseTo(expected, precision) - Floating point approximation
        @param {number} expected Expected value
        @param {number} precision Number of decimal places (default 2)
    */
    async toBeCloseTo(expected, precision = 2) {
        return this.handleAsync((received) => {
            const multiplier = Math.pow(10, precision)
            const pass = Math.abs(received - expected) < 1 / multiplier / 2
            const message = pass
                ? `Expected ${received} not to be close to ${expected} (precision: ${precision})`
                : `Expected ${received} to be close to ${expected} (precision: ${precision})`
            this.createResult('toBeCloseTo', pass, message)
        })
    }

    //  ==================== String and Collection Matchers ====================

    /**
        toMatch(pattern) - String matches regex or string
        @param {RegExp|string} pattern Pattern to match
    */
    async toMatch(pattern) {
        return this.handleAsync((received) => {
            if (typeof received !== 'string') {
                this.createResult('toMatch', false, `toMatch() expects a string, received ${typeof received}`)
                return
            }
            const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern)
            const pass = regex.test(received)
            const message = pass
                ? `Expected "${received}" not to match ${pattern}`
                : `Expected "${received}" to match ${pattern}`
            this.createResult('toMatch', pass, message)
        })
    }

    /**
        toContain(item) - Array/string contains item/substring
        @param {*} item Item or substring to find
    */
    async toContain(item) {
        return this.handleAsync((received) => {
            let pass = false
            if (typeof received === 'string') {
                pass = received.includes(item)
            } else if (Array.isArray(received)) {
                pass = received.includes(item)
            } else {
                this.createResult(
                    'toContain',
                    false,
                    `toContain() expects array or string, received ${typeof received}`
                )
                return
            }
            const message = pass
                ? `Expected ${formatValue(received)} not to contain ${formatValue(item)}`
                : `Expected ${formatValue(received)} to contain ${formatValue(item)}`
            this.createResult('toContain', pass, message)
        })
    }

    /**
        toContainEqual(item) - Array contains item with deep equality
        @param {*} item Item to find
    */
    async toContainEqual(item) {
        return this.handleAsync((received) => {
            if (!Array.isArray(received)) {
                this.createResult(
                    'toContainEqual',
                    false,
                    `toContainEqual() expects an array, received ${typeof received}`
                )
                return
            }
            const pass = received.some((element) => deepEqual(element, item))
            const message = pass
                ? `Expected array not to contain ${formatValue(item)}`
                : `Expected array to contain ${formatValue(item)}`
            this.createResult('toContainEqual', pass, message)
        })
    }

    /**
        toHaveLength(expected) - Array/string has specific length
        @param {number} expected Expected length
    */
    async toHaveLength(expected) {
        return this.handleAsync((received) => {
            if (typeof received !== 'string' && !Array.isArray(received)) {
                this.createResult(
                    'toHaveLength',
                    false,
                    `toHaveLength() expects array or string, received ${typeof received}`
                )
                return
            }
            const pass = received.length === expected
            const message = pass
                ? `Expected length not to be ${expected}, received ${received.length}`
                : `Expected length to be ${expected}, received ${received.length}`
            this.createResult('toHaveLength', pass, message)
        })
    }

    /**
        toHaveProperty(keyPath, value) - Object has property at key path
        @param {string|Array} keyPath Property path ('a.b.c' or ['a', 'b', 'c'])
        @param {*} value Optional expected value
    */
    async toHaveProperty(keyPath, value) {
        return this.handleAsync((received) => {
            if (typeof received !== 'object' || received === null) {
                this.createResult(
                    'toHaveProperty',
                    false,
                    `toHaveProperty() expects an object, received ${typeof received}`
                )
                return
            }
            const propertyExists = hasProperty(received, keyPath)
            let pass = propertyExists

            if (propertyExists && value !== undefined) {
                const actualValue = getProperty(received, keyPath)
                pass = deepEqual(actualValue, value)
            }

            const keyStr = Array.isArray(keyPath) ? keyPath.join('.') : keyPath
            let message
            if (value !== undefined) {
                const actualValue = getProperty(received, keyPath)
                message = pass
                    ? `Expected object not to have property "${keyStr}" with value ${formatValue(value)}`
                    : `Expected object to have property "${keyStr}" with value ${formatValue(value)}, received ${formatValue(actualValue)}`
            } else {
                message = pass
                    ? `Expected object not to have property "${keyStr}"`
                    : `Expected object to have property "${keyStr}"`
            }
            this.createResult('toHaveProperty', pass, message)
        })
    }

    /**
        toMatchObject(pattern) - Object contains all properties of pattern
        @param {object} pattern Pattern object to match
    */
    async toMatchObject(pattern) {
        return this.handleAsync((received) => {
            if (typeof received !== 'object' || received === null) {
                this.createResult(
                    'toMatchObject',
                    false,
                    `toMatchObject() expects an object, received ${typeof received}`
                )
                return
            }
            const pass = matchObject(received, pattern)
            const message = pass
                ? `Expected object not to match pattern ${formatValue(pattern)}`
                : `Expected object to match pattern ${formatValue(pattern)}`
            this.createResult('toMatchObject', pass, message)
        })
    }

    //  ==================== Error Matchers ====================

    /**
        toThrow(error) - Function throws an error
        @param {string|RegExp|Error|Function} error Optional error matcher
    */
    async toThrow(error) {
        return this.handleAsync((received) => {
            let caughtError = null

            //  If used with .rejects, received is already the error object
            if (this.promise === 'rejects') {
                caughtError = received
            } else {
                //  Otherwise, received should be a function
                if (typeof received !== 'function') {
                    this.createResult('toThrow', false, 'toThrow() expects a function')
                    return
                }

                let thrown = false
                try {
                    received()
                } catch (e) {
                    thrown = true
                    caughtError = e
                }

                if (!thrown) {
                    this.createResult('toThrow', false, 'Expected function to throw an error, but it did not')
                    return
                }
            }

            if (error === undefined) {
                //  Just checking that it threw
                this.createResult('toThrow', true, '')
                return
            }

            let pass = false
            if (typeof error === 'string') {
                //  Match error message
                pass = caughtError.message && caughtError.message.includes(error)
            } else if (error instanceof RegExp) {
                //  Match error message with regex
                pass = caughtError.message && error.test(caughtError.message)
            } else if (typeof error === 'function') {
                //  Match error constructor
                pass = caughtError instanceof error
            } else if (error instanceof Error) {
                //  Match error instance
                pass = caughtError.message === error.message
            }

            const message = pass
                ? `Expected function not to throw ${formatValue(error)}`
                : `Expected function to throw ${formatValue(error)}, but threw ${formatValue(caughtError && caughtError.message ? caughtError.message : caughtError)}`
            this.createResult('toThrow', pass, message)
        })
    }

    /**
        toThrowError(error) - Alias for toThrow
        @param {string|RegExp|Error|Function} error Optional error matcher
    */
    async toThrowError(error) {
        return this.toThrow(error)
    }
}

/**
    Main expect function - creates an ExpectMatcher instance
    @param {*} received Value to test
    @returns {ExpectMatcher} Matcher instance
*/
export function expect(received) {
    return new ExpectMatcher(received)
}

//  Export for direct access if needed
export {ExpectMatcher}
