export const lifecycleStatuses = ['ACTIVE', 'PROPOSED_FOR_DISPOSAL', 'DISPOSED'] as const
export const custodyStatuses = ['AVAILABLE', 'BORROWED', 'IN_REPAIR', 'MISSING'] as const
export const conditionStatuses = ['NORMAL', 'DAMAGED_USABLE', 'UNUSABLE'] as const
export const inspectionResults = ['FOUND_OK', 'FOUND_DAMAGED', 'REPAIR_REQUESTED', 'MISSING', 'DISPOSAL_REQUESTED', 'OTHER'] as const

export type LifecycleStatus = typeof lifecycleStatuses[number]
export type CustodyStatus = typeof custodyStatuses[number]
export type ConditionStatus = typeof conditionStatuses[number]
export type InspectionResult = typeof inspectionResults[number]
