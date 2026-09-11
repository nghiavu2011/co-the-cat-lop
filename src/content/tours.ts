// "Hành trình dẫn dắt": chuỗi bước có kịch bản, tự động chuyển hệ/chọn bộ phận
// và kể một câu chuyện sinh lý ngắn theo trình tự — giúp người xem hiểu các
// bộ phận liên quan với nhau thế nào, thay vì chỉ tra cứu rời rạc từng mục.
export interface TourStep {
  /** phải khớp với Note.i trong content/notes.ts và có mesh 3D thật (match3d.ts) */
  noteId: string;
  caption: string;
}

export interface Tour {
  id: string;
  title: string;
  intro: string;
  steps: TourStep[];
}

export const TOURS: Tour[] = [
  {
    id: 'tuanhoan',
    title: 'Vòng tuần hoàn của một giọt máu',
    intro: 'Khám phá chu trình khép kín của dòng máu: từ tim đi nuôi cơ thể, gom chất thải rồi lên phổi đổi oxy.',
    steps: [
      { noteId: 'tim', caption: 'Tim trái co bóp với áp lực mạnh, tống dòng máu tươi giàu oxy và dưỡng chất vào động mạch chủ.' },
      { noteId: 'dmchu', caption: 'Động mạch chủ phân nhánh thành mạng lưới mạch máu khắp cơ thể, phân phối oxy đến từng tế bào từ não bộ đến đầu ngón chân.' },
      { noteId: 'tmchi', caption: 'Sau khi nhường oxy và nhận khí CO₂ cùng chất thải chuyển hóa, máu sẫm màu theo hệ tĩnh mạch chảy ngược về tim phải.' },
      { noteId: 'machphoi', caption: 'Từ tâm thất phải, máu nghèo oxy được bơm lên động mạch phổi với áp lực vừa phải để bảo vệ màng mao mạch mỏng manh.' },
      { noteId: 'phoiphai', caption: 'Tại hàng triệu phế nang trong phổi, khí CO₂ được khuếch tán ra ngoài và oxy tươi được nạp lại đầy vào hồng cầu.' },
      { noteId: 'tim', caption: 'Máu giàu oxy theo 4 tĩnh mạch phổi quay về tim trái — chu kỳ tuần hoàn khép kín hoàn tất, sẵn sàng cho nhịp đập kế tiếp.' },
    ],
  },
  {
    id: 'tho',
    title: 'Hành trình một hơi thở',
    intro: 'Theo dõi một hơi thở đi từ mũi vào máu và tới tim, qua 6 chặng.',
    steps: [
      { noteId: 'khoangmui', caption: 'Không khí đi vào qua khoang mũi — được các cuốn mũi lọc bụi, sưởi ấm và tạo độ ẩm trước khi đi sâu vào trong.' },
      { noteId: 'khiquan', caption: 'Không khí tiếp tục xuống khí quản, một ống sụn chữ C cứng cáp giúp đường thở luôn mở thông suốt.' },
      { noteId: 'phequan', caption: 'Tới ngực, khí quản chia đôi thành hai phế quản chính dẫn khí vào hai lá phổi.' },
      { noteId: 'phoiphai', caption: 'Trong phổi, không khí tràn ngập các phế nang — nơi oxy thấm trực tiếp qua thành mạch siêu mỏng vào dòng máu.' },
      { noteId: 'tim', caption: 'Máu vừa nhận oxy theo các tĩnh mạch phổi trở về tâm nhĩ trái của tim.' },
      { noteId: 'dmchu', caption: 'Tim bơm máu tươi đó ra động mạch chủ đi nuôi cơ thể — một hơi thở đã hoàn tất hành trình nuôi dưỡng sự sống.' },
    ],
  },
  {
    id: 'an',
    title: 'Hành trình một bữa ăn',
    intro: 'Theo dõi thức ăn từ khi nuốt tới khi cơ thể hấp thu xong, qua 6 chặng.',
    steps: [
      { noteId: 'thucquan', caption: 'Sau khi nuốt, thức ăn đi qua thực quản — ống cơ co bóp nhịp nhàng dạng sóng đẩy thức ăn xuống dạ dày dù bạn có nằm ngang.' },
      { noteId: 'dsday', caption: 'Thức ăn tới dạ dày, được nhào trộn với acid clohydric (pH ~1.5–2) và enzym để phân giải cấu trúc đạm bước đầu.' },
      { noteId: 'tatrang', caption: 'Hỗn hợp chuyển sang tá tràng — dịch mật từ gan và men tuỵ đổ vào để nhũ hoá chất béo và phân cắt tinh bột.' },
      { noteId: 'ruotnon', caption: 'Dọc theo hàng triệu vi nhung mao ruột non, hầu hết dưỡng chất được hấp thu trực tiếp qua niêm mạc vào dòng máu.' },
      { noteId: 'daitrang', caption: 'Phần bã còn lại qua đại tràng — ruột già tái hấp thu lượng nước dư thừa và các vi khuẩn có lợi tổng hợp thêm vitamin.' },
      { noteId: 'tructrang', caption: 'Hành trình kết thúc ở trực tràng, nơi bã thải được cô đặc lưu giữ và báo tín hiệu thần kinh khi sẵn sàng đào thải.' },
    ],
  },
  {
    id: 'locthai',
    title: 'Hệ thống thanh lọc & bài tiết',
    intro: 'Theo dõi cách gan và thận liên tục làm sạch độc tố trong máu và đưa ra ngoài qua 6 chặng.',
    steps: [
      { noteId: 'dmchu', caption: 'Mỗi phút có hơn 1 lít máu từ động mạch chủ được phân bổ đến gan và hai quả thận để được lọc liên tục không ngừng nghỉ.' },
      { noteId: 'gan', caption: 'Gan đóng vai trò nhà máy hóa chất: phân giải thuốc, trung hòa độc tố, xử lý cồn và chuyển hóa amoniac độc hại thành urê.' },
      { noteId: 'thanphai', caption: 'Hai quả thận với 2 triệu nephron lọc sạch 180 lít dịch máu mỗi ngày, tái hấp thu nước sạch và chỉ giữ lại 1.5–2 lít cặn bã.' },
      { noteId: 'nieuquan', caption: 'Nước tiểu chứa urê và cặn bã liên tục được vận chuyển từ đài bể thận xuống bàng quang qua hai ống niệu quản.' },
      { noteId: 'bangquang', caption: 'Bàng quang là chiếc túi cơ đàn hồi; khi chứa khoảng 200–300ml nước tiểu, các thụ thể thần kinh sẽ kích hoạt cảm giác buồn tiểu.' },
      { noteId: 'nieudao', caption: 'Khi đi tiểu, cơ thắt mở ra để nước tiểu tống xuất hoàn toàn qua niệu đạo — khép lại chu trình thanh lọc cơ thể.' },
    ],
  },
  {
    id: 'cotsong',
    title: 'Cột sống & Trục chịu lực',
    intro: 'Hiểu cơ chế cơ học nâng đỡ thân người và vì sao các điểm nối hay bị thoái hóa, đau mỏi.',
    steps: [
      { noteId: 'hopso', caption: 'Hộp sọ nặng 4.5–5kg, là khối tải trọng tập trung trên đỉnh của toàn bộ trục chịu lực cơ thể.' },
      { noteId: 'ctsongco', caption: '7 đốt sống cổ mềm dẻo giúp quay đầu linh hoạt; khi gập cổ 60° xem điện thoại, tải trọng đè lên cổ tăng vọt lên ~27kg.' },
      { noteId: 'ctsongnguc', caption: '12 đốt sống ngực gắn với khung sườn tạo thành lồng vững chắc che chở tim phổi, chịu tải ổn định và ít bị thoái hóa nhất.' },
      { noteId: 'suon', caption: '12 đôi xương sườn vừa đàn hồi giãn nở theo nhịp thở, vừa phân bổ lực nén cơ học đều về cột sống.' },
      { noteId: 'ctsonglung', caption: '5 đốt sống thắt lưng có thân đốt to nhất, gánh toàn bộ trọng lượng thân trên và là nơi chịu áp lực uốn lớn nhất khi cúi bê đồ.' },
      { noteId: 'xuongchau', caption: 'Xương chậu đóng vai trò bản lề chịu lực chính, phân bổ đều tải trọng từ cột sống thắt lưng sang hai khớp háng.' },
      { noteId: 'xuongdui', caption: 'Xương đùi là xương dài và chịu lực nén khỏe nhất trong cơ thể, truyền phản lực từ mặt đất lên khung chậu.' },
      { noteId: 'khopgoi', caption: 'Khớp gối là khớp phức tạp nhất: khi đi bộ chịu tải 2–3 lần trọng lượng cơ thể, khi ngồi xổm áp lực lên bánh chè tăng tới 7–8 lần.' },
    ],
  },
];
