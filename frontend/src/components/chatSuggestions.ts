export interface ChatSuggestion {
  text: string;
  grade: number;
  curriculumTopicId?: string;
  curriculumVisualTemplate?: string;
}

export interface ChatSuggestionGroup {
  label: string;
  icon: string;
  suggestions: ChatSuggestion[];
}

const g1 = (text: string, curriculumTopicId: string, curriculumVisualTemplate?: string): ChatSuggestion => ({
  text,
  grade: 1,
  curriculumTopicId,
  curriculumVisualTemplate,
});

const g2 = (text: string, curriculumTopicId: string, curriculumVisualTemplate?: string): ChatSuggestion => ({
  text,
  grade: 2,
  curriculumTopicId,
  curriculumVisualTemplate,
});

export const CHAT_SUGGESTION_GROUPS_BY_GRADE: Record<number, ChatSuggestionGroup[]> = {
  1: [
    {
      label: 'Số và cấu tạo số',
      icon: '🔢',
      suggestions: [
        g1('Số 24 có mấy chục mấy đơn vị?', 'G1-NUM-01', 'place_value_blocks'),
        g1('Biểu diễn số 36 bằng chục và đơn vị', 'G1-NUM-01', 'place_value_blocks'),
        g1('Đếm 42 bằng khối chục đơn vị', 'G1-NUM-01', 'place_value_blocks'),
      ],
    },
    {
      label: 'So sánh số',
      icon: '⚖️',
      suggestions: [
        g1('So sánh 37 và 42', 'G1-NUM-02', 'comparison_visual'),
        g1('Số nào lớn hơn: 58 hay 53?', 'G1-NUM-02', 'comparison_visual'),
        g1('Đặt 19, 21, 20 theo thứ tự', 'G1-NUM-02', 'number_line'),
      ],
    },
    {
      label: 'Cộng trừ',
      icon: '➕',
      suggestions: [
        g1('Minh họa 24 + 13 bằng que tính', 'G1-OPS-01', 'stick_bundles'),
        g1('Bớt 15 từ 48', 'G1-OPS-01', 'operation_story'),
        g1('Giải thích 32 - 10 bằng chục đơn vị', 'G1-OPS-01', 'place_value_blocks'),
      ],
    },
    {
      label: 'Tính nhẩm',
      icon: '🧠',
      suggestions: [
        g1('Tính nhẩm 8 + 5 bằng khung 10', 'G1-OPS-02', 'ten_frame'),
        g1('Nhanh 30 - 10', 'G1-OPS-02', 'ten_frame'),
        g1('Dùng tia số để tính 7 + 2', 'G1-OPS-02', 'number_line'),
      ],
    },
    {
      label: 'Bài toán lời văn',
      icon: '📖',
      suggestions: [
        g1('Lan có 5 quả táo, mẹ cho thêm 3 quả', 'G1-WORD-01', 'operation_story'),
        g1('Bài toán bớt đi 2 con chim', 'G1-WORD-01', 'operation_story'),
        g1('Tóm tắt bài toán lời văn', 'G1-WORD-01', 'bar_model'),
      ],
    },
    {
      label: 'Vị trí không gian',
      icon: '📍',
      suggestions: [
        g1('Quả bóng ở bên trái cái hộp', 'G1-GEO-01', 'spatial_position_scene'),
        g1('Chỉ vị trí ở giữa', 'G1-GEO-01', 'spatial_position_scene'),
        g1('Minh họa trên dưới trước sau', 'G1-GEO-01', 'spatial_position_scene'),
      ],
    },
    {
      label: 'Nhận biết hình',
      icon: '🔷',
      suggestions: [
        g1('Nhận biết hình vuông và hình tròn', 'G1-GEO-02', 'geometry_shape'),
        g1('Vật nào là khối hộp chữ nhật?', 'G1-GEO-02', 'real_object_match'),
        g1('Ghép đồ vật với hình học', 'G1-GEO-02', 'real_object_match'),
      ],
    },
    {
      label: 'Ghép hình',
      icon: '🧩',
      suggestions: [
        g1('Ghép các hình để tạo ngôi nhà', 'G1-GEO-03', 'shape_composition'),
        g1('Xếp hình từ tam giác và hình vuông', 'G1-GEO-03', 'shape_composition'),
        g1('Tạo hình mới bằng kéo thả', 'G1-GEO-03', 'drag_drop_shapes'),
      ],
    },
    {
      label: 'Đo độ dài / Lịch / Đồng hồ',
      icon: '📏',
      suggestions: [
        g1('So sánh bút nào dài hơn', 'G1-MEAS-01', 'comparison_visual'),
        g1('Đọc giờ đúng trên đồng hồ', 'G1-MEAS-01', 'clock_calendar'),
        g1('Thứ mấy đứng sau thứ ba?', 'G1-MEAS-01', 'clock_calendar'),
      ],
    },
  ],
  2: [
    {
      label: 'Số đến 1000',
      icon: '🏗️',
      suggestions: [
        g2('Số 234 gồm mấy trăm mấy chục mấy đơn vị?', 'G2-NUM-01', 'place_value_blocks'),
        g2('Biểu diễn số 150 bằng trăm chục đơn vị', 'G2-NUM-01', 'place_value_blocks'),
        g2('Đọc số 708 trên tia số', 'G2-NUM-01', 'number_line'),
      ],
    },
    {
      label: 'So sánh',
      icon: '📊',
      suggestions: [
        g2('So sánh 342 và 324', 'G2-NUM-02', 'comparison_visual'),
        g2('Số nào lớn nhất: 150, 510, 105?', 'G2-NUM-02', 'comparison_visual'),
        g2('Sắp xếp 231, 312, 213 theo thứ tự tăng dần', 'G2-NUM-02', 'number_line'),
      ],
    },
    {
      label: 'Cộng trừ',
      icon: '🧮',
      suggestions: [
        g2('Minh họa 245 + 132 bằng khối trăm chục đơn vị', 'G2-OPS-01', 'place_value_blocks'),
        g2('Tính 500 - 234 bằng hình', 'G2-OPS-01', 'place_value_blocks'),
        g2('Giải thích phép cộng có nhớ 157 + 46', 'G2-OPS-01', 'operation_story'),
      ],
    },
    {
      label: 'Nhân chia',
      icon: '✖️',
      suggestions: [
        g2('Minh họa 3 x 5 bằng mảng ô vuông', 'G2-OPS-02', 'array_model'),
        g2('Chia đều 20 kẹo cho 5 bạn', 'G2-OPS-02', 'grouping_model'),
        g2('Đếm theo nhóm để tính 4 x 2', 'G2-OPS-02', 'counting_objects'),
      ],
    },
    {
      label: 'Tính nhẩm',
      icon: '⚡',
      suggestions: [
        g2('Tính 38 + 7 bằng cách làm tròn chục', 'G2-OPS-03', 'place_value_blocks'),
        g2('Nhanh 63 - 20', 'G2-OPS-03', 'place_value_blocks'),
        g2('Dùng tia số để tính 27 + 5', 'G2-OPS-03', 'number_line'),
      ],
    },
    {
      label: 'Đo lường',
      icon: '⏰',
      suggestions: [
        g2('Đồng hồ chỉ 8 giờ 30 phút đọc thế nào?', 'G2-MEAS-01', 'clock_calendar'),
        g2('Dùng visual tiền cho 1000 2000 5000', 'G2-MEAS-01', 'money_visual'),
        g2('So sánh 3 kg và 5 kg', 'G2-MEAS-01', 'mass_capacity_visual'),
      ],
    },
    {
      label: 'Biểu đồ & xác suất',
      icon: '🎲',
      suggestions: [
        g2('Đọc biểu đồ tranh: mỗi hình sao bằng 2 bạn', 'G2-STAT-01', 'picture_graph'),
        g2('Lập bảng số liệu màu sắc yêu thích của lớp', 'G2-STAT-01', 'data_table'),
        g2('Lấy bóng từ hộp có 3 bóng đỏ 2 bóng xanh', 'G2-PROB-01', 'probability_experiment'),
      ],
    },
  ],
};

export function getSuggestionGroupsForGrade(grade: number): ChatSuggestionGroup[] {
  return CHAT_SUGGESTION_GROUPS_BY_GRADE[grade] ?? CHAT_SUGGESTION_GROUPS_BY_GRADE[1];
}

export function buildDefaultSuggestionsForGrade(grade: number): ChatSuggestion[] {
  return getSuggestionGroupsForGrade(grade).flatMap((group) => group.suggestions).slice(0, 4);
}

export function findSuggestionByText(text: string, grade: number): ChatSuggestion | null {
  const normalized = text.trim();
  for (const group of getSuggestionGroupsForGrade(grade)) {
    const suggestion = group.suggestions.find((item) => item.text === normalized);
    if (suggestion) return suggestion;
  }
  return null;
}
