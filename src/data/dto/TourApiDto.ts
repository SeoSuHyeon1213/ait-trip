export interface TourItemDto {
  contentid: string; contenttypeid: string; title: string;
  addr1?: string; addr2?: string; firstimage?: string; firstimage2?: string; cpyrhtDivCd?: string;
  mapx?: string; mapy?: string; overview?: string; tel?: string;
  lDongRegnCd?: string; lDongSignguCd?: string; lclsSystm1?: string; lclsSystm2?: string; lclsSystm3?: string;
}
export interface RegionCodeDto { code: string; name: string }
export interface ClassificationDto { lclsSystm1Cd?: string; lclsSystm1Nm?: string; lclsSystm2Cd?: string; lclsSystm2Nm?: string; lclsSystm3Cd?: string; lclsSystm3Nm?: string }
export interface TourPageDto { items: TourItemDto[]; totalCount: number; pageNo: number; pageSize: number; hasMore: boolean; regions: RegionCodeDto[]; classifications: ClassificationDto[] }
export interface TourDetailDto { item: TourItemDto; intro: Record<string, string>; images: { originimgurl?: string; smallimageurl?: string; cpyrhtDivCd?: string }[]; regions: RegionCodeDto[]; classifications: ClassificationDto[] }
