/**
    js/index.js - Testing utilities API for JavaScript and TypeScript tests
    Provides assertion functions, environment variable access, and test utilities

    Supports two testing styles:
    1. Traditional TestMe API: ttrue(), teq(), etc.
    2. Jest/Vitest-compatible API: expect().toBe(), etc.
 */

//  Import Jest/Vitest-compatible expect() API
import {expect} from './expect.js'

let exitCode = 0
let testContext = {
    nestLevel: 0,
    currentDescribe: null,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    beforeEachHooks: [],
    afterEachHooks: [],
    beforeAllHooks: [],
    afterAllHooks: [],
    queuedTests: [],
    inTest: false,
    collectingTests: false,
}

function tdepth() {
    return parseInt(tget('TESTME_DEPTH', '0'), 10)
}

function tget(key, def = null) {
    let value = process.env[key]
    if (value == null || value == '') {
        value = def
    }
    return value
}

function thas(key) {
    return tget(key) - 0
}

function tverbose() {
    return Boolean(tget('TESTME_VERBOSE'))
}

export function getStack() {
    const error = new Error()
    const stack = error.stack?.split('\n') || []

    let bestCandidate = null

    // Find the first line that is the actual test code (not internal test framework functions)
    // This is more robust than using a fixed index, as it handles console.log overrides and other stack variations
    for (let i = 1; i < stack.length; i++) {
        const line = stack[i]

        // Skip native calls
        if (line.includes('(native:')) continue

        // Skip testme module internals (handles various installation paths)
        // Matches: /testme/src/modules/, \testme\src\modules\, node_modules/@embedthis/testme, etc.
        if (line.includes('testme/src/modules/') || line.includes('testme\\src\\modules\\')) continue
        if (line.includes('node_modules/@embedthis/testme') || line.includes('node_modules\\@embedthis\\testme')) continue
        if (line.includes('.bun/install/global/node_modules/@embedthis/testme')) continue

        // Extract the file path from the stack line
        // On Windows, paths may have drive letters like C:\path\file.js:123
        // Pattern: at [function] (path:line) or at path:line
        // For Windows: Match drive letter (C:), then non-colons, then :line
        const match = line.match(/at (?:.*\s+\()?([a-zA-Z]:[^:]+|[^:]+):(\d+)/)
        if (!match) continue

        // Skip if it's the getStack function itself
        if (line.includes('getStack')) continue

        // Check if it's a known test helper function
        const funcMatch = line.match(/at\s+(\w+)\s/)
        let isHelperFunction = false
        if (funcMatch) {
            const funcName = funcMatch[1]
            const testFunctions = [
                'ttrue',
                'tfalse',
                'teq',
                'tneq',
                'expect',
                'treport',
                'describe',
                'test',
                'it',
                'beforeEach',
                'afterEach',
            ]
            isHelperFunction = testFunctions.includes(funcName)
        }

        // Store this as best candidate if we don't have one yet
        if (!bestCandidate) {
            bestCandidate = {
                filename: match[1],
                line: match[2],
            }
        }

        // If it's not a helper function, this is the actual test file location
        if (!isHelperFunction) {
            return {
                filename: match[1],
                line: match[2],
            }
        }
    }

    // If we found at least one candidate (even if it was a helper function), use it
    // This handles cases where a helper function throws and we want to report the next frame up
    if (bestCandidate) {
        return bestCandidate
    }

    return {filename: 'unknown file', line: 'unknown line'}
}

export function isInTestContext() {
    return testContext.inTest
}

function treport(success, stack, message, received, expected) {
    let loc = `${stack.filename}:${stack.line}`
    if (!message) {
        message = `Test ${success ? 'passed' : 'failed'}`
    }
    if (success) {
        console.log(`✓ ${message} at ${loc}`)
    } else {
        if (expected === undefined && received === undefined) {
            console.error(`✗ ${message} at ${loc}`)
        } else {
            console.error(`✗ ${message} at ${loc}\nExpected: ${expected}\nReceived: ${received}`)
        }
        process.exit(1)
    }
}

function tassert(condition, message = '') {
    treport(condition, getStack(), message)
}
function ttrue(condition, message = '') {
    treport(condition, getStack(), message)
}

function tfalse(condition, message = '') {
    treport(!condition, getStack(), message)
}

function tfail(message = '') {
    treport(false, getStack(), message)
}

//  Type-specific equality functions for better error messages

function teqi(received, expected, message = '') {
    treport(received === expected, getStack(), message, received, expected)
}

function teql(received, expected, message = '') {
    treport(received === expected, getStack(), message, received, expected)
}

function teqll(received, expected, message = '') {
    treport(BigInt(received) === BigInt(expected), getStack(), message, received, expected)
}

function teqz(received, expected, message = '') {
    treport(received === expected, getStack(), message, received, expected)
}

function tequ(received, expected, message = '') {
    treport(received === expected, getStack(), message, received, expected)
}

function teqp(received, expected, message = '') {
    treport(received === expected, getStack(), message, received, expected)
}

//  Type-specific inequality functions

function tneqi(received, expected, message = '') {
    treport(received !== expected, getStack(), message, received, expected)
}

function tneql(received, expected, message = '') {
    treport(received !== expected, getStack(), message, received, expected)
}

function tneqll(received, expected, message = '') {
    treport(BigInt(received) !== BigInt(expected), getStack(), message, received, expected)
}

function tneqz(received, expected, message = '') {
    treport(received !== expected, getStack(), message, received, expected)
}

function tnequ(received, expected, message = '') {
    treport(received !== expected, getStack(), message, received, expected)
}

function tneqp(received, expected, message = '') {
    treport(received !== expected, getStack(), message, received, expected)
}

//  Comparison functions (greater than)

function tgti(received, expected, message = '') {
    treport(received > expected, getStack(), message, received, expected)
}

function tgtl(received, expected, message = '') {
    treport(received > expected, getStack(), message, received, expected)
}

function tgtz(received, expected, message = '') {
    treport(received > expected, getStack(), message, received, expected)
}

//  Comparison functions (greater than or equal)

function tgtei(received, expected, message = '') {
    treport(received >= expected, getStack(), message, received, expected)
}

function tgtel(received, expected, message = '') {
    treport(received >= expected, getStack(), message, received, expected)
}

function tgtez(received, expected, message = '') {
    treport(received >= expected, getStack(), message, received, expected)
}

//  Comparison functions (less than)

function tlti(received, expected, message = '') {
    treport(received < expected, getStack(), message, received, expected)
}

function tltl(received, expected, message = '') {
    treport(received < expected, getStack(), message, received, expected)
}

function tltz(received, expected, message = '') {
    treport(received < expected, getStack(), message, received, expected)
}

//  Comparison functions (less than or equal)

function tltei(received, expected, message = '') {
    treport(received <= expected, getStack(), message, received, expected)
}

function tltel(received, expected, message = '') {
    treport(received <= expected, getStack(), message, received, expected)
}

function tltez(received, expected, message = '') {
    treport(received <= expected, getStack(), message, received, expected)
}

//  NULL checking functions

function tnull(value, message = '') {
    treport(value === null, getStack(), message, value, null)
}

function tnotnull(value, message = '') {
    treport(value !== null, getStack(), message, value, null)
}

//  Legacy deprecated functions (kept for backward compatibility)

function teq(received, expected, message = '') {
    return teqi(received, expected, message)
}

function tneq(received, expected, message = '') {
    return tneqi(received, expected, message)
}

function tmatch(string, pattern, message = '') {
    treport(new RegExp(pattern).test(string), getStack(), message, string, pattern)
}

function tcontains(string, pattern, message = '') {
    treport(string.includes(pattern), getStack(), message, string, pattern)
}

function tinfo(...args) {
    console.log(...args)
}

function tdebug(...args) {
    console.log(...args)
}

function tskip(...args) {
    console.log(...args)
}

function twrite(...args) {
    console.log(...args)
}

//  ==================== describe() and test() API ====================

/**
    Helper to get indentation string based on nesting level
*/
function getIndent() {
    return '  '.repeat(testContext.nestLevel)
}

/**
    describe() - Group related tests with a label
    @param {string} name - Description of the test group
    @param {Function} fn - Function containing tests
*/
async function describe(name, fn) {
    const indent = getIndent()
    console.log(`${indent}${name}`)

    const previousDescribe = testContext.currentDescribe
    const previousBeforeEach = [...testContext.beforeEachHooks]
    const previousAfterEach = [...testContext.afterEachHooks]
    const previousBeforeAll = [...testContext.beforeAllHooks]
    const previousAfterAll = [...testContext.afterAllHooks]
    const previousCollecting = testContext.collectingTests
    const previousQueuedTests = [...testContext.queuedTests]

    testContext.currentDescribe = name
    testContext.nestLevel++
    testContext.collectingTests = true
    testContext.queuedTests = []

    //  Run parent beforeAll hooks first (from outer describes)
    const inheritedBeforeAllHooks = [...testContext.beforeAllHooks]
    for (const hook of inheritedBeforeAllHooks) {
        if (hook.constructor.name === 'AsyncFunction') {
            await hook()
        } else {
            hook()
        }
    }

    //  Save current beforeAll/afterAll hooks (these are hooks for THIS level)
    const currentLevelBeforeAllHooks = []
    const currentLevelAfterAllHooks = []

    //  Temporarily replace hooks arrays so new hooks register at this level
    testContext.beforeAllHooks = currentLevelBeforeAllHooks
    testContext.afterAllHooks = currentLevelAfterAllHooks

    try {
        //  Execute the describe block to register hooks and tests
        await fn()

        //  Now run beforeAll hooks for this level
        for (const hook of currentLevelBeforeAllHooks) {
            if (hook.constructor.name === 'AsyncFunction') {
                await hook()
            } else {
                hook()
            }
        }

        //  Restore original hooks for parent context
        testContext.beforeAllHooks = inheritedBeforeAllHooks
        testContext.afterAllHooks = previousAfterAll

        //  Run all queued tests
        for (const queuedTest of testContext.queuedTests) {
            await queuedTest()
        }

        //  Run afterAll hooks for this level
        for (const hook of currentLevelAfterAllHooks) {
            if (hook.constructor.name === 'AsyncFunction') {
                await hook()
            } else {
                hook()
            }
        }

        //  Restore context
        testContext.nestLevel--
        testContext.currentDescribe = previousDescribe
        testContext.beforeEachHooks = previousBeforeEach
        testContext.afterEachHooks = previousAfterEach
        testContext.beforeAllHooks = previousBeforeAll
        testContext.afterAllHooks = previousAfterAll
        testContext.collectingTests = previousCollecting
        testContext.queuedTests = previousQueuedTests
    } catch (error) {
        //  Restore context on error
        testContext.nestLevel--
        testContext.currentDescribe = previousDescribe
        testContext.beforeEachHooks = previousBeforeEach
        testContext.afterEachHooks = previousAfterEach
        testContext.beforeAllHooks = previousBeforeAll
        testContext.afterAllHooks = previousAfterAll
        testContext.collectingTests = previousCollecting
        testContext.queuedTests = previousQueuedTests

        console.error(`${indent}✗ Error in describe block: ${error.message}`)
        process.exit(1)
    }
}

/**
    describe.skip() - Skip an entire describe block
    @param {string} name - Description of the test group
    @param {Function} fn - Function containing tests (not executed)
*/
describe.skip = async function (name, fn) {
    const indent = getIndent()
    console.log(`${indent}${name} (skipped)`)
}

/**
    test() - Execute a single test with a label
    @param {string} name - Description of the test
    @param {Function} fn - Test function to execute
*/
async function test(name, fn) {
    const indent = getIndent()

    //  If we're collecting tests (inside a describe), queue this test
    if (testContext.collectingTests) {
        testContext.queuedTests.push(async () => {
            await runTest(name, fn, indent)
        })
    } else {
        //  Run immediately if not in a describe block
        await runTest(name, fn, indent)
    }
}

/**
    Internal function to actually run a test
*/
async function runTest(name, fn, indent) {
    testContext.totalTests++

    try {
        //  Run beforeEach hooks
        for (const hook of testContext.beforeEachHooks) {
            if (hook.constructor.name === 'AsyncFunction') {
                await hook()
            } else {
                hook()
            }
        }

        //  Mark that we're in a test context
        testContext.inTest = true

        //  Run the test
        if (fn.constructor.name === 'AsyncFunction') {
            await fn()
        } else {
            fn()
        }

        //  Clear test context flag
        testContext.inTest = false

        //  Run afterEach hooks
        for (const hook of testContext.afterEachHooks) {
            if (hook.constructor.name === 'AsyncFunction') {
                await hook()
            } else {
                hook()
            }
        }

        testContext.passedTests++
        console.log(`${indent}✓ ${name}`)
    } catch (error) {
        //  Clear test context flag on error
        testContext.inTest = false

        testContext.failedTests++
        console.error(`${indent}✗ ${name}`)

        //  Try to extract a better location from the error stack if message shows "unknown file"
        let message = error.message
        if (message.includes('unknown file:unknown line') && error.stack) {
            //  Parse the stack to find the actual test file location
            const stackLines = error.stack.split('\n')
            for (let i = 1; i < stackLines.length; i++) {
                const line = stackLines[i]
                //  Skip testme internals
                if (line.includes('testme/src/modules/') || line.includes('testme\\src\\modules\\')) continue
                if (line.includes('node_modules/@embedthis/testme') || line.includes('node_modules\\@embedthis\\testme')) continue
                if (line.includes('.bun/install/global/node_modules/@embedthis/testme')) continue
                if (line.includes('(native:')) continue

                //  Extract file:line
                // On Windows, paths may have drive letters like C:\path\file.js:123
                const match = line.match(/at (?:.*\s+\()?([a-zA-Z]:[^:]+|[^:]+):(\d+)/)
                if (match) {
                    //  Replace "unknown file:unknown line" with actual location
                    message = message.replace('unknown file:unknown line', `${match[1]}:${match[2]}`)
                    break
                }
            }
        }

        console.error(`${indent}  ${message}`)
        if (tverbose() && error.stack) {
            console.error(error.stack)
        }
        exitCode = 1
    }
}

/**
    test.skip() - Skip a test
    @param {string} name - Description of the test
    @param {Function} fn - Test function (not executed)
*/
test.skip = function (name, fn) {
    const indent = getIndent()
    console.log(`${indent}⊘ ${name} (skipped)`)
}

/**
    test.skipIf() - Conditionally skip a test
    @param {boolean} condition - If true, skip the test
*/
test.skipIf = function (condition) {
    if (condition) {
        return test.skip
    }
    return test
}

/**
    it() - Alias for test()
    @param {string} name - Description of the test
    @param {Function} fn - Test function to execute
*/
const it = test

/**
    it.skip() - Alias for test.skip()
*/
it.skip = test.skip

/**
    it.skipIf() - Alias for test.skipIf()
*/
it.skipIf = test.skipIf

/**
    beforeEach() - Register a hook to run before each test
    @param {Function} fn - Hook function to run
*/
function beforeEach(fn) {
    testContext.beforeEachHooks.push(fn)
}

/**
    afterEach() - Register a hook to run after each test
    @param {Function} fn - Hook function to run
*/
function afterEach(fn) {
    testContext.afterEachHooks.push(fn)
}

/**
    beforeAll() - Register a hook to run once before all tests in current describe block
    @param {Function} fn - Hook function to run
*/
function beforeAll(fn) {
    testContext.beforeAllHooks.push(fn)
}

/**
    afterAll() - Register a hook to run once after all tests in current describe block
    @param {Function} fn - Hook function to run
*/
function afterAll(fn) {
    testContext.afterAllHooks.push(fn)
}

// Process exit handler to return appropriate exit code
process.on('exit', () => {
    process.exitCode = exitCode
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error.message)
    if (tverbose()) {
        console.error(error.stack)
    }
    process.exit(1)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason)
    process.exit(1)
})

// Export all functions for use in tests
export {
    //  Jest/Vitest-compatible API
    expect,
    describe,
    test,
    it,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    //  Traditional TestMe API
    tassert,
    tcontains,
    tdebug,
    tdepth,
    teq,
    teqi,
    teql,
    teqll,
    teqz,
    tequ,
    teqp,
    tfalse,
    tfail,
    tget,
    tgti,
    tgtl,
    tgtz,
    tgtei,
    tgtel,
    tgtez,
    thas,
    tinfo,
    tlti,
    tltl,
    tltz,
    tltei,
    tltel,
    tltez,
    tmatch,
    tneq,
    tneqi,
    tneql,
    tneqll,
    tneqz,
    tnequ,
    tneqp,
    tnull,
    tnotnull,
    tskip,
    ttrue,
    tverbose,
    twrite,
}

// Default export with all functions
export default {
    //  Jest/Vitest-compatible API
    expect,
    describe,
    test,
    it,
    beforeEach,
    afterEach,
    beforeAll,
    afterAll,
    //  Traditional TestMe API
    tassert,
    tcontains,
    tdebug,
    tdepth,
    teq,
    teqi,
    teql,
    teqll,
    teqz,
    tequ,
    teqp,
    tfalse,
    tfail,
    tget,
    tgti,
    tgtl,
    tgtz,
    tgtei,
    tgtel,
    tgtez,
    thas,
    tinfo,
    tlti,
    tltl,
    tltz,
    tltei,
    tltel,
    tltez,
    tmatch,
    tneq,
    tneqi,
    tneql,
    tneqll,
    tneqz,
    tnequ,
    tneqp,
    tnull,
    tnotnull,
    tskip,
    ttrue,
    tverbose,
    twrite,
}
