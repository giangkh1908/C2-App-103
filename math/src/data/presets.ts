import { MathExplanation } from '../types';

export const PRESET_LESSONS: Record<string, MathExplanation> = {
  multiplication: {
    domain: 'multiplication',
    concept: '3 x 4',
    title: 'Phép nhân: 3 đĩa bánh, mỗi đĩa có 4 chiếc bánh kẹp',
    grade: 2,
    shortExplanation: 'Bé ơi, phép nhân thực chất chính là việc cộng các nhóm có số lượng bằng nhau nhiều lần. Thay vì tính 4 + 4 + 4, ta viết là 3 x 4 (nghĩa là 3 nhóm, mỗi nhóm có 4 chiếc bánh).',
    lifeExample: 'Hãy tưởng tượng mẹ chuẩn bị 3 chiếc đĩa xinh xắn để tiếp khách. Trên mỗi đĩa, mẹ xếp đều 4 chiếc bánh kẹo dâu tây thơm phức. Bé đếm xem mẹ có tất cả bao nhiêu chiếc bánh nhé!',
    visualData: {
      type: 'candy',
      primaryCount: 3,
      secondaryCount: 4,
      totalCount: 12,
      groupsLabel: 'Số nhóm (số đĩa bánh)',
      itemsLabel: 'Số bánh trên mỗi đĩa'
    },
    simulationConfig: {
      type: 'groups',
      minX: 1,
      maxX: 5,
      minY: 1,
      maxY: 6,
      defaultX: 3,
      defaultY: 4,
      labelX: 'Số đĩa bánh (Số nhóm)',
      labelY: 'Số bánh mỗi đĩa (Số lượng)'
    },
    practiceQuestion: {
      id: 'mult_practice_1',
      questionText: 'Trong khu vườn, chú thỏ nâu trồng 4 luống cà rốt. Mỗi luống có đúng 5 củ cà rốt béo tròn. Phép tính nhân nào thể hiện tổng số củ cà rốt đó và kết quả là bao nhiêu?',
      options: [
        'A. 4 + 5 = 9 củ cà rốt',
        'B. 4 x 5 = 20 củ cà rốt',
        'C. 5 x 4 = 15 củ cà rốt',
        'D. 4 x 5 = 24 củ cà rốt'
      ],
      correctAnswerIndex: 1,
      successMessage: 'Tuyệt vời ông mặt trời! Chú thỏ đã thu hoạch được 20 củ cà rốt nhờ phép nhân 4 x 5 đấy!',
      failMessage: 'Ối, chưa chính xác rồi bé ơi! Có 4 luống cà rốt, mỗi luống có 5 củ, ta phải lấy 5 cộng với nhau 4 lần, hay viết tắt là 4 x 5. Bé thử lại nhé!',
      hint: 'Hãy nhớ phép nhân là số luống nhân với số củ trên một luống: có 4 nhóm, mỗi nhóm có 5 củ!'
    }
  },
  division: {
    domain: 'division',
    concept: '12 : 3',
    title: 'Phép chia: Chia đều 12 quả táo cho 3 bạn nhỏ',
    grade: 2,
    shortExplanation: 'Phép chia chính là việc chúng ta chia đều một số lượng đồ vật thành các phần bằng nhau. Khi chia đều 12 quả táo cho 3 hộp, mỗi hộp sẽ nhận được số táo bằng nhau là 4 quả.',
    lifeExample: 'Bé có 12 quả táo đỏ mọng nước. Bé muốn chia đều cho 3 người bạn thân là Lan, Minh và Nam. Đố bé biết mỗi bạn sẽ nhận được mấy quả táo để ai cũng vui như nhau?',
    visualData: {
      type: 'apple',
      primaryCount: 12,
      secondaryCount: 3,
      totalCount: 4,
      groupsLabel: 'Tổng số quả táo',
      itemsLabel: 'Số bạn được chia táo'
    },
    simulationConfig: {
      type: 'division',
      minX: 4,
      maxX: 16,
      minY: 2,
      maxY: 5,
      defaultX: 12,
      defaultY: 3,
      labelX: 'Tổng số quả táo',
      labelY: 'Số người bạn'
    },
    practiceQuestion: {
      id: 'div_practice_1',
      questionText: 'Thầy giáo có 15 quyển tập vở thưởng học sinh giỏi. Thầy chia đều số vở này cho 5 bạn có thành tích tốt nhất trong tuần. Hỏi mỗi bạn được phát mấy quyển vở?',
      options: [
        'A. Mỗi bạn được 3 quyển vở',
        'B. Mỗi bạn được 5 quyển vở',
        'C. Mỗi bạn được 4 quyển vở',
        'D. Mỗi bạn được 10 quyển vở'
      ],
      correctAnswerIndex: 0,
      successMessage: 'Chính xác! Thầy giáo lấy 15 chia đều cho 5 bạn, vậy mỗi bạn sẽ nhận được đúng 3 quyển vở xinh xắn!',
      failMessage: 'Chưa đúng rồi bé ơi! Bé hãy thử lấy 15 viên kẹo ra và chia làm 5 nhóm xem mỗi nhóm có bao nhiêu viên nhé? 15 : 5 = ?',
      hint: 'Ta làm tính chia: Lấy tổng số vở là 15 đem chia cho 5 người bạn.'
    }
  },
  fraction_basic: {
    domain: 'fraction_basic',
    concept: '3 / 4',
    title: 'Phân số cơ bản: Ăn mất 3 phần trong một chiếc bánh Pizza 4 phần',
    grade: 3,
    shortExplanation: 'Phân số biểu thị các phần bằng nhau của một tổng thể. Số ở dưới (mẫu số) cho biết chiếc bánh được chia làm bao nhiêu phần bằng nhau. Số ở trên (tử số) cho biết chúng ta đang lấy đi bao nhiêu phần như thế.',
    lifeExample: 'Mẹ mua cho bé một chiếc bánh Pizza thơm ngon hình tròn. Mẹ dùng dao cắt bánh thành đúng 4 phần bằng nhau. Bé ăn hết 3 phần, còn lại 1 phần cho bố. Bé đã ăn 3/4 chiếc bánh!',
    visualData: {
      type: 'pizza',
      primaryCount: 3, // numerator
      secondaryCount: 4, // denominator
      totalCount: 0.75, // value
      groupsLabel: 'Tổng số phần bánh được ăn (Tử số)',
      itemsLabel: 'Tổng số miếng cắt bánh (Mẫu số)'
    },
    simulationConfig: {
      type: 'pizza_slices',
      minX: 1,
      maxX: 8, // numerator maxed by denominator
      minY: 2,
      maxY: 8, // denominator selection
      defaultX: 3,
      defaultY: 4,
      labelX: 'Số miếng tô màu (Tử số)',
      labelY: 'Tổng số phần cắt bánh (Mẫu số)'
    },
    practiceQuestion: {
      id: 'frac_practice_1',
      questionText: 'Một chiếc băng giấy dài được chia thành 6 đoạn thẳng bằng nhau như thước kẻ. Bé Minh đã tô đỏ hết 5 đoạn. Phân số nào dưới đây chỉ phần băng giấy đã được tô đỏ?',
      options: [
        'A. 1/6 băng giấy',
        'B. 5/6 băng giấy',
        'C. 6/5 băng giấy',
        'D. 5/5 băng giấy'
      ],
      correctAnswerIndex: 1,
      successMessage: 'Quá đỉnh luôn bé ơi! Băng giấy chia làm 6 phần (mẫu số = 6), tô màu 5 phần (tử số = 5), ta được phân số 5/6!',
      failMessage: 'Tiếc quá, chưa chính xác rồi. Hãy nhớ số đoạn được tô màu nằm ở trên (Tử số) và tổng số phần nằm ở dưới (Mẫu số). Bé thử đếm lại xem nhé!',
      hint: 'Tô màu 5 phần trên tổng số 6 phần bằng nhau.'
    }
  },
  perimeter_area_basic: {
    domain: 'perimeter_area_basic',
    concept: '4 x 3',
    title: 'Chu vi và Diện tích: Phòng ngủ hình chữ nhật dài 4m, rộng 3m',
    grade: 4,
    shortExplanation: 'Chu vi là độ dài của hàng rào bao quanh toàn bộ hình chữ nhật (cộng tất cả các cạnh bao quanh). Diện tích là toàn bộ phần đất bề mặt phía trong, đo bằng số ô vuông 1m x 1m lấp đầy lòng căn phòng.',
    lifeExample: 'Bố ước muốn trải chiếu trúc lên lòng sàn phòng ngủ rộng dài 4 mét, rộng 3 mét của bé. Diện tích sàn phòng là số ô vuông lót sàn (4 x 3 = 12 mét vuông). Đường nẹp phào chân tường quanh mép sàn là chu vi ((4 + 3) x 2 = 14 mét).',
    visualData: {
      type: 'grid',
      primaryCount: 4, // length
      secondaryCount: 3, // width
      totalCount: 12, // area
      groupsLabel: 'Chiều dài (m)',
      itemsLabel: 'Chiều rộng (m)'
    },
    simulationConfig: {
      type: 'rectangle_grid',
      minX: 2,
      maxX: 6,
      minY: 1,
      maxY: 5,
      defaultX: 4,
      defaultY: 3,
      labelX: 'Chiều dài hình chữ nhật',
      labelY: 'Chiều rộng hình chữ nhật'
    },
    practiceQuestion: {
      id: 'peri_area_practice_1',
      questionText: 'Bác nông dân Minh xây một rào chắn hình chữ nhật trồng súp lơ dài 5 mét và rộng 4 mét. Hỏi diện tích để trồng cà rốt của mảnh đất này rộng bao nhiêu mét vuông?',
      options: [
        'A. Chu vi là 18 mét, Diện tích là 20 mét vuông',
        'B. Chu vi là 9 mét, Diện tích là 20 mét vuông',
        'C. Chu vi là 20 mét, Diện tích là 9 mét vuông',
        'D. Chu vi là 18 mét, Diện tích là 18 mét vuông'
      ],
      correctAnswerIndex: 0,
      successMessage: 'Hoàn hảo! Diện tích = Dài x Rộng = 5 x 4 = 20 m2. Chu vi = (Dài + Rộng) x 2 = (5 + 4) x 2 = 18 m.',
      failMessage: 'Dường như chưa đúng nha bé. Hãy nhớ tính Diện tích bằng cách nhân Chiều dài với Chiều rộng; tính Chu vi bằng cách cộng chiều dài và rộng rồi nhân đôi.',
      hint: 'Diện tích = 5 x 4. Chu vi = (5 + 4) x 2. Hãy áp dụng đúng công thức!'
    }
  }
};
