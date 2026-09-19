export interface BodyInsight {
  id: string;
  question: string;
  tag: string;
  noteId: string;
  cause: string;
  mechanism: string;
  tip: string;
}

export const BODY_INSIGHTS: BodyInsight[] = [
  {
    id: 'dau-that-lung',
    question: 'Vì sao ngồi làm việc lâu lại đau mỏi thắt lưng?',
    tag: 'Cơ học chịu tải',
    noteId: 'ctsonglung',
    cause: 'Tư thế ngồi gù làm tăng 150%–200% áp lực thủy tĩnh lên đĩa đệm thắt lưng so với khi đứng thẳng.',
    mechanism: '5 đốt sống thắt lưng (L1–L5) là trụ đỡ chính của toàn bộ nửa thân trên. Khi ngồi cong lưng, trọng tâm dồn ra trước làm dây chằng căng cứng và nhân nhầy đĩa đệm bị đẩy lùi về sau, chèn ép rễ thần kinh.',
    tip: 'Đặt gối tựa thắt lưng giữ đường cong sinh lý ưỡn tự nhiên và đứng dậy đi lại mỗi 45–60 phút.',
  },
  {
    id: 'nac-cut',
    question: 'Hiện tượng nấc cụt sinh ra như thế nào?',
    tag: 'Áp suất & Phản xạ',
    noteId: 'cohoanh',
    cause: 'Sự co thắt đột ngột ngoài ý muốn của cơ hoành kích hoạt phản xạ đóng sập thanh môn.',
    mechanism: 'Cơ hoành là vòm cơ ngăn giữa ngực và bụng. Khi bị kích thích (uống nước có ga, ăn quá nhanh, thay đổi nhiệt độ), cơ hoành co giật kéo luồng khí tràn vào mạnh; ngay lập tức nắp thanh quản đóng lại để bảo vệ, tạo ra tiếng "nấc".',
    tip: 'Uống từng ngụm nước nhỏ hoặc hít sâu nín thở 10–15 giây để tăng nồng độ CO₂ máu, giúp làm dịu xung thần kinh hoành.',
  },
  {
    id: 'sac-nuoc',
    question: 'Vì sao vừa ăn vừa nói cười rất dễ bị sặc?',
    tag: 'Van chuyển mạch',
    noteId: 'thanhquan',
    cause: 'Ngã tư hầu họng không kịp đóng nắp thanh quản khi luồng khí phát âm đi lên.',
    mechanism: 'Thanh quản và thực quản dùng chung lối vào tại vùng hầu. Khi nuốt, sụn nắp thanh quản hạ xuống đậy kín khí quản như một nắp van an toàn. Nếu bạn nói hoặc cười, nắp thanh quản buộc phải mở ra để không khí đi qua làm rung dây thanh âm, khiến thức ăn/nước rơi nhầm vào đường thở.',
    tip: 'Tập thói quen nuốt xong mới nói; nếu bị sặc, ho mạnh dứt khoát để dùng áp suất phổi tống dị vật ra ngoài.',
  },
  {
    id: 'dau-ruot-thua',
    question: 'Tại sao đau ruột thừa lại bắt đầu từ rốn rồi mới xuống hố chậu phải?',
    tag: 'Đường dẫn truyền thần kinh',
    noteId: 'ruotthua',
    cause: 'Sự chuyển dịch tín hiệu đau từ thần kinh tạng (mơ hồ) sang thần kinh thể chất (chính xác).',
    mechanism: 'Ban đầu khi ruột thừa bị tắc nghẽn và căng phồng, các sợi thần kinh giao cảm dẫn truyền tín hiệu đau tạng về tủy sống cùng đoạn T10 chi phối vùng rốn (đau mơ hồ). Sau vài giờ, viêm nhiễm lan ra lớp phúc mạc thành giàu thụ thể cảm giác xúc giác, cơn đau khu trú chính xác tại điểm McBurney ở hố chậu phải.',
    tip: 'Đau âm ỉ quanh rốn chuyển dần xuống bụng dưới bên phải kèm sốt nhẹ/buồn nôn là dấu hiệu cấp cứu ngoại khoa — tuyệt đối không tự ý chườm nóng hay uống thuốc giảm đau.',
  },
  {
    id: 'tim-dap-nhanh',
    question: 'Vì sao tim đập thình thịch trong lồng ngực khi hoảng sợ hoặc hồi hộp?',
    tag: 'Hệ đòn bẩy Adrenaline',
    noteId: 'tim',
    cause: 'Phản xạ sinh tồn nguyên thủy "Chiến đấu hoặc Bỏ chạy" (Fight or Flight).',
    mechanism: 'Tuyến thượng thận lập tức phóng thích hormone adrenaline vào máu. Adrenaline kích thích nút xoang tim tăng tần số co bóp từ 70 lên 120–150 nhịp/phút, đồng thời co các mạch máu da để dồn lưu lượng máu tối đa đến các khối cơ lớn và não bộ nhằm chuẩn bị đối phó hiểm nguy.',
    tip: 'Áp dụng bài thở 4-7-8 (hít 4s, nín thở 7s, thở ra từ từ 8s) để kích hoạt nhánh thần kinh phó giao cảm làm chậm nhịp tim.',
  },
  {
    id: 'te-tay-may-tinh',
    question: 'Cảm giác tê rần các ngón tay khi dùng chuột/bàn phím lâu?',
    tag: 'Hội chứng ống cổ tay',
    noteId: 'bantay',
    cause: 'Dây thần kinh giữa bị chèn ép khi đi qua đường hầm xương - dây chằng hẹp ở cổ tay.',
    mechanism: 'Mặt trước cổ tay có một "đường hầm" hẹp chứa 9 gân gấp ngón tay và dây thần kinh giữa. Khi gập hoặc tì cổ tay liên tục lên bàn cứng, áp lực trong ống tăng gấp nhiều lần làm thiếu máu nuôi thần kinh, gây tê ngón cái, ngón trỏ và ngón giữa.',
    tip: 'Dùng đệm kê cổ tay công thái học và thực hiện bài tập kéo giãn duỗi các ngón tay sau mỗi giờ làm việc.',
  },
  {
    id: 'axit-da-day',
    question: 'Dạ dày chứa axit mạnh ăn mòn được kim loại, vì sao nó không tự tiêu hủy?',
    tag: 'Hàng rào bảo vệ sinh học',
    noteId: 'dsday',
    cause: 'Lớp chất nhầy kiềm dày đặc và tốc độ tái tạo tế bào siêu tốc của niêm mạc.',
    mechanism: 'Dịch vị dạ dày có nồng độ acid HCl cao với pH 1.5–2 (đủ sức hòa tan kẽm). Dạ dày tự bảo vệ nhờ lớp gel nhầy giàu bicarbonate dày khoảng 0.2mm phủ kín bề mặt để trung hòa acid ngay tại ranh giới tế bào, cùng với chu kỳ thay mới tế bào niêm mạc chỉ trong 3–5 ngày.',
    tip: 'Tránh để bụng quá đói hoặc quá no, hạn chế lạm dụng thuốc giảm đau NSAID (gây ức chế lớp nhầy bảo vệ).',
  },
  {
    id: 'gan-loc-con',
    question: 'Gan chuyển hóa bia rượu như thế nào và vì sao dễ bị gan nhiễm mỡ?',
    tag: 'Nhà máy sinh hóa quá tải',
    noteId: 'gan',
    cause: 'Gan phải tạm dừng đốt mỡ để ưu tiên phân giải cồn độc hại thành acid axetic.',
    mechanism: 'Khi cồn vào máu, enzym gan khử cồn thành Acetaldehyde (chất cực độc gây say, đỏ mặt và tổn thương tế bào). Do gan phải dồn toàn bộ nguồn lực chuyển hóa chất độc này, quá trình oxy hóa acid béo bị ngưng trệ, khiến mỡ thừa tích tụ dần trong tế bào gan dẫn đến gan nhiễm mỡ và xơ gan.',
    tip: 'Uống nhiều nước lọc khi dùng bia rượu để tăng đào thải qua thận, và cho gan tối thiểu 48 giờ nghỉ ngơi giữa các buổi liên hoan.',
  },
];

/**
 * Cơ chế vật lý cốt lõi gắn liền với các cơ quan then chốt.
 * Giúp người dùng nắm bắt bản chất vận hành vật lý của cơ quan chỉ trong một câu súc tích.
 */
export const PHYSICAL_MECHANISMS: Record<string, { role: string; principle: string }> = {
  tim: {
    role: 'Máy bơm thủy lực 2 thì kép',
    principle: 'Bơm đẩy ~7.200 lít máu/ngày với áp lực co bóp 120 mmHg qua hệ thống van một chiều.',
  },
  phoiphai: {
    role: 'Màng lọc trao đổi khí vi mô áp suất âm',
    principle: '300 triệu túi phế nang tạo diện tích tiếp xúc ~70m² để oxy và CO₂ tự khuếch tán qua chênh lệch phân áp.',
  },
  phoitrai: {
    role: 'Màng lọc trao đổi khí vi mô áp suất âm',
    principle: 'Cùng phổi phải tạo khoang đàn hồi phồng xẹp theo áp lực cơ hoành và lồng ngực.',
  },
  cohoanh: {
    role: 'Piston sinh học tạo áp suất âm',
    principle: 'Hạ thấp 1.5–7cm khi co, làm giảm áp suất khoang ngực để hút không khí từ ngoài vào phổi.',
  },
  thanhquan: {
    role: 'Van chuyển mạch hai chiều thông minh',
    principle: 'Cơ chế cơ học tự động gập nắp sụn che đường thở khi nuốt và rung các dây thanh âm khi thở ra.',
  },
  gan: {
    role: 'Nhà máy lọc hóa chất đa tầng',
    principle: 'Xử lý hơn 500 phản ứng sinh hóa, lọc 1.4 lít máu mỗi phút qua hệ thống bè gan vi mô.',
  },
  thanphai: {
    role: 'Bộ lọc vi mô áp suất cao siêu tinh vi',
    principle: 'Lọc 180 lít huyết tương mỗi ngày qua màng lọc vi hạt mao mạch cầu thận dưới áp lực máu.',
  },
  thantrai: {
    role: 'Bộ lọc vi mô áp suất cao siêu tinh vi',
    principle: 'Phối hợp nhịp nhàng giữ cân bằng nội môi nước - điện giải và tái hấp thu 99% lượng dịch lọc.',
  },
  dsday: {
    role: 'Lò phản ứng cơ - hóa học',
    principle: 'Nghiền nát cơ học bằng 3 lớp cơ chéo/vòng/dọc phối hợp với thủy phân enzyme ở pH 1.5–2.',
  },
  ruotnon: {
    role: 'Hệ thống vi nhung mao thẩm thấu diện tích lớn',
    principle: 'Gấp nếp niêm mạc tăng diện tích tiếp xúc lên gấp 600 lần (~30m²) để hấp thu dưỡng chất vào mao mạch.',
  },
  daitrang: {
    role: 'Bộ phận tái hấp thu nước & đóng gói',
    principle: 'Hút ngược 1.5 lít nước mỗi ngày qua thành ruột nhờ chênh lệch nồng độ ion Natri để cô đặc bã thải.',
  },
  ctsonglung: {
    role: 'Trụ chịu nén & giảm chấn thủy lực',
    principle: '5 đốt sống to bản kết hợp đĩa đệm nhân nhầy đàn hồi phân tán chấn động và gánh 60% tải trọng cơ thể.',
  },
  ctsongco: {
    role: 'Bản lề điều hướng đa trục linh hoạt',
    principle: 'Hệ thống khớp mỏm gai cho phép đầu quay 180° và gật gập 90° nhưng rất nhạy cảm với sai lệch tư thế.',
  },
  khopgoi: {
    role: 'Khớp bản lề giảm chấn phức hợp',
    principle: 'Kết hợp đệm sụn chêm và dây chằng bắt chéo chịu lực va đập gấp 3–8 lần khối lượng cơ thể khi vận động.',
  },
  dainao: {
    role: 'Siêu máy tính sinh học xử lý tín hiệu',
    principle: 'Mạng lưới 86 tỷ nơ-ron kết nối qua hàng trăm nghìn tỷ synapse truyền xung điện 100m/s.',
  },
  dmchu: {
    role: 'Đường ống dẫn chịu áp & đệm áp lực (Windkessel)',
    principle: 'Thành động mạch giàu sợi chun co giãn hấp thu bớt áp lực tâm thu và duy trì dòng chảy liên tục khi tim nghỉ.',
  },
  tucung: {
    role: 'Buồng ấp sinh học co giãn siêu đàn hồi & máy bơm cơ học chuyển dạ',
    principle: 'Thành cơ trơn 3 lớp đan chéo có khả năng giãn thể tích gấp hơn 500 lần khi mang thai và tạo lực co thắt mạnh tới 50–60 mmHg đẩy thai nhi ra đời.',
  },
  xuongchau: {
    role: 'Cầu vòm chịu lực & bệ đỡ bảo vệ tạng sinh sản - tiết niệu',
    principle: 'Cấu trúc vòng cung kép phân bổ toàn bộ trọng lượng thân trên xuống hai đầu xương đùi và mở rộng thích ứng thiên bẩm cho quá trình sinh nở ở nữ giới.',
  },
};
