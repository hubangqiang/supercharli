/** @typedef {"normal"|"s1"|"s2"|"s3"} SeverityMode */

/**
 * @typedef {{
 *   sessionId: string,
 *   text: string,
 *   complexity?: "fast"|"deep",
 *   riskSignals?: string[]
 * }} TurnInput
 */

/**
 * @typedef {{
 *   conclusion: string,
 *   nextStep: string,
 *   completionSignal: string,
 *   fallbackOption?: string,
 *   uncertainty?: string
 * }} NormalizedResponse
 */

/**
 * @typedef {{
 *   route: "fast"|"deep",
 *   model: string,
 *   fallbackUsed: boolean,
 *   severity: SeverityMode,
 *   promotedToL2: boolean,
 *   traceId: string
 * }} TurnMeta
 */
