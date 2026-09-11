/** Mục đang được chọn: một Note đã biên soạn, hoặc một cấu trúc thật chưa có
 * chú thích riêng (chỉ có thể xảy ra ở tab 3D, khi bấm vào một trong ~2.170
 * cấu trúc còn lại của BodyParts3D). */
export type Selection = { kind: 'note'; id: string } | { kind: 'part'; id: string };
