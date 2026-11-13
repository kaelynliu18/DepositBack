// SHARED CONTRACT between Builder A (api/lib) and Builder B (UI).
// Do not change without telling the whole team.

export type Verdict = "allowed" | "questionable" | "not_allowed";
export type Route = "settled" | "courtroom" | "inspector";
export interface FileInput { mediaType: "image/jpeg" | "image/png" | "application/pdf"; data: string /* base64, no data: prefix */ }
export interface CaseInput { statement: FileInput; depositAmount: number; moveOutDate: string /* YYYY-MM-DD */; tenancyMonths: number; tenantName: string }
export interface LineItem { id: string; description: string; amount: number; category: "cleaning"|"repair"|"paint"|"carpet"|"rent"|"fee"|"other"; hasReceipt: boolean; verdict: Verdict; reason: string; rule: string; route: Route; decidedBy: "clerk"|"judge"|"inspector" }
export interface ClerkResponse { landlordName: string|null; landlordEmail: string|null; propertyAddress: string|null; statementDate: string|null; lineItems: LineItem[]; otherIssues: string[]; tenantName?: string|null; moveOutDate?: string|null /* YYYY-MM-DD */; depositAmount?: number|null }
export interface Ruling { lineItemId: string; landlordArgument: string; tenantArgument: string; verdict: Verdict; reason: string; rule: string }
export interface CourtroomResponse { rulings: Ruling[] }
export interface InspectorResponse { lineItemId: string; sameLocation: boolean; changeObserved: string; classification: "normal_wear"|"damage"|"unclear"; verdict: Verdict; reason: string; confidence: "high"|"medium"|"low" }
export type AgentName = "case_manager"|"clerk"|"landlord_advocate"|"tenant_advocate"|"judge"|"inspector"|"paralegal";
export interface AgentEventPayload { lineItems?: LineItem[]; landlordArgument?: string; tenantArgument?: string; ruling?: Ruling; inspector?: InspectorResponse; previousVerdict?: Verdict; newVerdict?: Verdict }
export interface AgentEvent { id: string; agent: AgentName; status: "working"|"done"|"error"; message: string; lineItemId?: string; at: number; payload?: AgentEventPayload }
export interface PhotoPair { moveIn: FileInput; moveOut: FileInput }
export interface CaseResult { clerk: ClerkResponse; items: LineItem[] /* final verdicts */; rulings: Ruling[]; photos: InspectorResponse[]; strongClaim: number; possibleClaim: number; daysToStatement: number|null; isLate: boolean; letter: string; mailto: string; ics: string; followUpEmail: string }
