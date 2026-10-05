# 여행지 데이터 구조

데이터 반환 흐름: DataSource → DTO → Mapper → Repository → 화면

| 계층 | 책임 |
|---|---|
| DataSource | 원본 데이터를 읽어 DTO 반환. 현재는 MockDestinationDataSource 사용 |
| DTO | 데이터 전달 형식. 현재 DTO는 앱 내부 계약이며 TourAPI 원본 응답이 아님 |
| Mapper | DTO 필드를 도메인 모델로 변환하고 지원하는 코드 값을 검증 |
| Repository | 화면에 도메인 모델만 제공. 목록·ID·찜 ID 목록·기분/지역 추천 조회 |
| Composition | DataSource와 Repository 구현을 조립 |

호출 방향은 화면 → Repository → DataSource입니다. 반환할 때 Mapper가 DTO를 Destination으로 변환합니다.

샘플 데이터는 src/data/fixtures/mockDestinationDtos.ts에만 있습니다. 화면과 도메인 모델은 DTO나 샘플을 직접 참조하지 않습니다. Repository는 DataSource 인터페이스를 주입받아 동작합니다.

현재 화면은 Repository 목록을 조회해 상세와 찜 목록에도 사용합니다. 향후 목록 페이지네이션을 붙일 때 상세는 getById, 찜 목록은 getByIds로 개별 조회하면 됩니다.

## API 권한 발급 이후

1. 서버에서 관광공사 API 인증키를 관리합니다.
2. 서버 응답을 읽는 DataSource 구현을 추가합니다.
3. 실제 응답에 맞춘 DTO 검증과 Mapper 변환을 작성합니다. 기분 태그는 별도 추천 데이터입니다.
4. src/composition/destinationRepository.ts에서 DataSource를 교체합니다.

현재 전국 지역코드·페이지네이션·실제 사진·운영정보는 구현하지 않았습니다. 샘플의 4개 지역과 풍경 유형을 실제 API 범위로 확장할 때 모델과 Mapper도 함께 수정합니다. API 호출이나 인증키 파일은 만들지 않습니다.
