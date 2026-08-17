import type { ConditionStatus, CustodyStatus, LifecycleStatus } from '../../shared/types/domain'

export interface AssetState {
  lifecycleStatus: LifecycleStatus
  custodyStatus: CustodyStatus
  conditionStatus: ConditionStatus
}

export const assertBorrowable = (asset: AssetState): void => {
  if (asset.lifecycleStatus !== 'ACTIVE') {
    throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์ไม่ได้อยู่ในวงจรใช้งาน' })
  }
  if (asset.custodyStatus !== 'AVAILABLE') {
    throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์ไม่พร้อมให้ยืม' })
  }
  if (asset.conditionStatus === 'UNUSABLE') {
    throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์มีสภาพใช้งานไม่ได้' })
  }
}

export const assertTransferable = (asset: AssetState): void => {
  if (asset.custodyStatus === 'BORROWED') {
    throw createError({ statusCode: 409, statusMessage: 'ต้องรับคืนครุภัณฑ์ก่อนย้าย' })
  }
  if (asset.lifecycleStatus === 'DISPOSED') {
    throw createError({ statusCode: 409, statusMessage: 'ไม่สามารถย้ายครุภัณฑ์ที่จำหน่ายแล้ว' })
  }
}

export const assertRepairable = (asset: AssetState): void => {
  if (asset.lifecycleStatus !== 'ACTIVE') {
    throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์ไม่ได้อยู่ในวงจรใช้งาน' })
  }
  if (asset.custodyStatus !== 'AVAILABLE') {
    throw createError({ statusCode: 409, statusMessage: 'ครุภัณฑ์ต้องพร้อมใช้งานก่อนแจ้งซ่อม' })
  }
}

export const returnState = (condition: ConditionStatus) => {
  return {
    custodyStatus: 'AVAILABLE' as const,
    conditionStatus: condition,
  }
}

export const repairResultState = (successful: boolean) => {
  return successful
    ? { custodyStatus: 'AVAILABLE' as const, conditionStatus: 'NORMAL' as const }
    : { custodyStatus: 'AVAILABLE' as const, conditionStatus: 'UNUSABLE' as const }
}
