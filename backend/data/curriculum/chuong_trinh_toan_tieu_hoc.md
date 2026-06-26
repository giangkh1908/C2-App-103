# Chương trình Toán tiểu học Việt Nam - Markdown cho tính năng Visualize

**Nguồn:** *Chương trình giáo dục phổ thông môn Toán*, ban hành kèm Thông tư số 32/2018/TT-BGDĐT.  
**Phạm vi trích xuất:** Nội dung giáo dục Toán cấp tiểu học, lớp 1 đến lớp 5.  
**Trang trong PDF:** Lớp 1: tr. 21-24; Lớp 2: tr. 24-28; Lớp 3: tr. 29-34; Lớp 4: tr. 34-40; Lớp 5: tr. 40-46.

> Ghi chú triển khai: Các trường **visual_templates**, **visual_intent**, **data_params** là lớp dữ liệu đề xuất để phục vụ product visualize. Nội dung **Yêu cầu cần đạt** được giữ theo tinh thần chương trình gốc.

---

## 0. Visual template registry đề xuất

| Template | Dùng cho | Ví dụ concept |
|---|---|---|
| `counting_objects` | Đếm, cộng/trừ trực quan bằng vật thật | 3 quả táo + 2 quả táo |
| `ten_frame` | Cấu tạo số, cộng/trừ trong phạm vi 10/20 | 8 + 5 bằng cách lấp đầy khung 10 |
| `place_value_blocks` | Hàng đơn vị/chục/trăm/nghìn, cấu tạo thập phân | 234 = 2 trăm + 3 chục + 4 đơn vị |
| `number_line` | So sánh số, cộng/trừ, làm tròn, số thập phân | Nhảy từ 35 đến 42 |
| `operation_story` | Bài toán có lời văn | Thêm, bớt, gấp lên, giảm đi |
| `array_model` | Phép nhân, chia, diện tích, bảng nhân | 3 hàng, mỗi hàng 4 ô |
| `grouping_model` | Chia đều, chia có dư, phân nhóm | 17 chia 5 dư 2 |
| `fraction_bar` | Phân số, so sánh, cộng trừ phân số | 1/2 + 1/4 |
| `fraction_circle` | Phân số trực quan bằng phần của hình | 3/4 chiếc bánh |
| `decimal_place_value` | Số thập phân, phần nguyên/phần thập phân | 12,35 |
| `percent_bar` | Tỉ số phần trăm | 25% của 80 |
| `ratio_model` | Tỉ số, tìm hai số khi biết tổng/hiệu và tỉ số | Sơ đồ đoạn thẳng |
| `geometry_shape` | Nhận biết hình phẳng, hình khối | Hình vuông, hình tròn, hình thang |
| `shape_composition` | Gấp, cắt, ghép, xếp hình | Tangram, ghép hình chữ nhật |
| `ruler_measurement` | Đo độ dài, vẽ đoạn thẳng | Đo 8 cm |
| `clock_calendar` | Giờ, phút, ngày, tháng, năm | 7 giờ 30 phút |
| `money_visual` | Tiền Việt Nam, mua bán, đổi tiền | 50 000 đồng + 20 000 đồng |
| `mass_capacity_visual` | Khối lượng, dung tích, nhiệt độ | kg, lít, ml, °C |
| `area_grid` | Chu vi, diện tích, hình chữ nhật/hình vuông | Đếm ô vuông |
| `volume_cubes` | Thể tích, hình hộp chữ nhật, lập phương | Khối hộp 3 x 4 x 2 |
| `angle_protractor` | Góc, đo góc, vẽ góc | 60°, 90°, 120° |
| `data_table` | Bảng số liệu | Bảng chiều cao học sinh |
| `picture_graph` | Biểu đồ tranh | Mỗi hình táo = 2 quả |
| `bar_chart` | Biểu đồ cột | Số học sinh thích từng môn |
| `pie_chart` | Biểu đồ hình quạt tròn | Tỉ lệ phần trăm |
| `probability_experiment` | Xác suất đơn giản | Tung đồng xu, lấy bóng |
| `calculator_demo` | Làm quen máy tính cầm tay | Kiểm tra phép tính |

---

# LỚP 1

## Mạch: Số và phép tính

### G1-NUM-01 — Đếm, đọc, viết các số trong phạm vi 100
- **Chủ đề:** Số tự nhiên
- **Nội dung:** Số tự nhiên; đếm, đọc, viết các số trong phạm vi 100.
- **Yêu cầu cần đạt:**
  - Đếm, đọc, viết được các số trong phạm vi 10; trong phạm vi 20; trong phạm vi 100.
  - Nhận biết được chục và đơn vị, số tròn chục.
- **visual_templates:** `counting_objects`, `ten_frame`, `place_value_blocks`, `number_line`
- **visual_intent:** Giúp học sinh thấy số là số lượng vật, đồng thời hiểu cấu tạo chục - đơn vị.
- **data_params:** `number`, `range_max`, `tens`, `ones`, `objects`.

### G1-NUM-02 — So sánh các số trong phạm vi 100
- **Chủ đề:** Số tự nhiên
- **Nội dung:** So sánh các số trong phạm vi 100.
- **Yêu cầu cần đạt:**
  - Nhận biết được cách so sánh, xếp thứ tự các số trong phạm vi 100 ở các nhóm có không quá 4 số.
- **visual_templates:** `number_line`, `place_value_blocks`, `counting_objects`
- **visual_intent:** So sánh bằng vị trí trên tia số, số lượng vật, hoặc số chục và số đơn vị.
- **data_params:** `numbers`, `order`, `compare_operator`.

### G1-OPS-01 — Phép cộng, phép trừ trong phạm vi 100
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Phép cộng, phép trừ.
- **Yêu cầu cần đạt:**
  - Nhận biết được ý nghĩa của phép cộng, phép trừ.
  - Thực hiện được phép cộng, phép trừ không nhớ các số trong phạm vi 100.
  - Làm quen với việc thực hiện tính toán trong trường hợp có hai dấu phép tính cộng, trừ theo thứ tự từ trái sang phải.
- **visual_templates:** `counting_objects`, `number_line`, `ten_frame`, `place_value_blocks`, `operation_story`
- **visual_intent:** Minh họa “thêm vào” là cộng, “bớt đi” là trừ, và biểu diễn thao tác từng bước.
- **data_params:** `a`, `b`, `operation`, `steps`, `objects`.

### G1-OPS-02 — Tính nhẩm cộng, trừ
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Tính nhẩm.
- **Yêu cầu cần đạt:**
  - Thực hiện được cộng, trừ nhẩm trong phạm vi 10.
  - Thực hiện được cộng, trừ nhẩm các số tròn chục.
- **visual_templates:** `ten_frame`, `number_line`, `place_value_blocks`
- **visual_intent:** Cho học sinh thấy cách gộp hoặc tách nhanh bằng hình.
- **data_params:** `a`, `b`, `operation`, `strategy`.

### G1-WORD-01 — Bài toán có lời văn liên quan cộng, trừ
- **Chủ đề:** Thực hành giải quyết vấn đề liên quan đến phép cộng, phép trừ
- **Nội dung:** Nhận biết ý nghĩa thực tiễn của phép tính cộng, trừ.
- **Yêu cầu cần đạt:**
  - Nhận biết được ý nghĩa thực tiễn của phép tính cộng, trừ thông qua tranh ảnh, hình vẽ hoặc tình huống thực tiễn.
  - Nhận biết và viết được phép tính cộng, trừ phù hợp với câu trả lời của bài toán có lời văn và tính được kết quả đúng.
- **visual_templates:** `operation_story`, `counting_objects`, `bar_model`, `number_line`
- **visual_intent:** Chuyển câu chuyện thành sơ đồ hoặc tranh minh họa.
- **data_params:** `story_objects`, `known_values`, `unknown`, `operation`.

## Mạch: Hình học và đo lường

### G1-GEO-01 — Vị trí, định hướng trong không gian
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Quan sát, nhận biết hình dạng của một số hình phẳng và hình khối đơn giản.
- **Yêu cầu cần đạt:**
  - Nhận biết được vị trí, định hướng trong không gian: trên - dưới, phải - trái, trước - sau, ở giữa.
- **visual_templates:** `geometry_shape`, `spatial_position_scene`
- **visual_intent:** Dùng cảnh lớp học hoặc vật quen thuộc để học sinh chỉ vị trí.
- **data_params:** `object_a`, `object_b`, `relation`.

### G1-GEO-02 — Nhận dạng hình phẳng và hình khối đơn giản
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Hình phẳng và hình khối.
- **Yêu cầu cần đạt:**
  - Nhận dạng được hình vuông, hình tròn, hình tam giác, hình chữ nhật thông qua bộ đồ dùng học tập cá nhân hoặc vật thật.
  - Nhận dạng được khối lập phương, khối hộp chữ nhật thông qua bộ đồ dùng học tập cá nhân hoặc vật thật.
- **visual_templates:** `geometry_shape`, `shape_sorting`, `real_object_match`
- **visual_intent:** Ghép hình học với vật thật: hộp quà, quyển sách, đồng hồ, biển báo.
- **data_params:** `shape_type`, `shape_attributes`, `real_life_examples`.

### G1-GEO-03 — Lắp ghép, xếp hình đơn giản
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Thực hành lắp ghép, xếp hình gắn với một số hình phẳng và hình khối đơn giản.
- **Yêu cầu cần đạt:**
  - Nhận biết và thực hiện được việc lắp ghép, xếp hình gắn với sử dụng bộ đồ dùng học tập cá nhân hoặc vật thật.
- **visual_templates:** `shape_composition`, `drag_drop_shapes`
- **visual_intent:** Cho học sinh kéo thả hình để tạo hình mới.
- **data_params:** `parts`, `target_shape`, `allowed_transforms`.

### G1-MEAS-01 — Độ dài, tuần lễ, giờ đúng
- **Chủ đề:** Đo lường
- **Nội dung:** Biểu tượng về đại lượng và đơn vị đo đại lượng.
- **Yêu cầu cần đạt:**
  - Nhận biết được về “dài hơn”, “ngắn hơn”.
  - Nhận biết được đơn vị đo độ dài cm; đọc và viết được số đo độ dài trong phạm vi 100 cm.
  - Nhận biết được mỗi tuần lễ có 7 ngày và tên gọi, thứ tự các ngày trong tuần lễ.
  - Nhận biết được giờ đúng trên đồng hồ.
- **visual_templates:** `ruler_measurement`, `clock_calendar`, `comparison_visual`
- **visual_intent:** So sánh hai vật, đo bằng thước, xem lịch tuần và đồng hồ kim.
- **data_params:** `length_cm`, `objects`, `weekday`, `hour`.

### G1-MEAS-02 — Thực hành đo đại lượng
- **Chủ đề:** Đo lường
- **Nội dung:** Thực hành đo đại lượng.
- **Yêu cầu cần đạt:**
  - Thực hiện được việc đo và ước lượng độ dài theo đơn vị đo tự quy ước như gang tay, bước chân.
  - Thực hiện được việc đo độ dài bằng thước thẳng với đơn vị đo là cm.
  - Thực hiện được việc đọc giờ đúng trên đồng hồ.
  - Xác định được thứ, ngày trong tuần khi xem lịch loại lịch tờ hằng ngày.
  - Giải quyết được một số vấn đề thực tiễn đơn giản liên quan đến đo độ dài, đọc giờ đúng và xem lịch.
- **visual_templates:** `ruler_measurement`, `clock_calendar`, `operation_story`
- **visual_intent:** Tạo bài tập tương tác đo vật và đọc thời gian.
- **data_params:** `object_length`, `unit`, `clock_time`, `calendar_day`.

## Hoạt động thực hành và trải nghiệm - Lớp 1
- Thực hành đếm, nhận biết số, thực hiện phép tính trong tình huống thực tiễn hằng ngày.
- Thực hành hoạt động liên quan đến vị trí, định hướng không gian.
- Thực hành đo và ước lượng độ dài bằng cm; đọc giờ đúng trên đồng hồ; xem lịch tờ hằng ngày.
- Tổ chức trò chơi học toán để ôn tập, củng cố kiến thức cơ bản.

---

# LỚP 2

## Mạch: Số và phép tính

### G2-NUM-01 — Số và cấu tạo thập phân trong phạm vi 1000
- **Chủ đề:** Số tự nhiên
- **Nội dung:** Số và cấu tạo thập phân của một số.
- **Yêu cầu cần đạt:**
  - Đếm, đọc, viết được các số trong phạm vi 1000.
  - Nhận biết được số tròn trăm.
  - Nhận biết được số liền trước, số liền sau của một số.
  - Thực hiện được việc viết số thành tổng của trăm, chục, đơn vị.
  - Nhận biết được tia số và viết được số thích hợp trên tia số.
- **visual_templates:** `place_value_blocks`, `number_line`, `counting_objects`
- **visual_intent:** Biểu diễn trăm - chục - đơn vị bằng khối hoặc bó que tính.
- **data_params:** `number`, `hundreds`, `tens`, `ones`, `number_line_range`.

### G2-NUM-02 — So sánh, sắp xếp số trong phạm vi 1000
- **Chủ đề:** Số tự nhiên
- **Nội dung:** So sánh các số.
- **Yêu cầu cần đạt:**
  - Nhận biết được cách so sánh hai số trong phạm vi 1000.
  - Xác định được số lớn nhất hoặc số bé nhất trong một nhóm có không quá 4 số trong phạm vi 1000.
  - Sắp xếp được các số theo thứ tự từ bé đến lớn hoặc ngược lại trong một nhóm có không quá 4 số.
- **visual_templates:** `number_line`, `place_value_blocks`, `comparison_visual`
- **visual_intent:** So sánh bằng hàng trăm, hàng chục, hàng đơn vị và vị trí trên tia số.
- **data_params:** `numbers`, `order`, `compare_operator`.

### G2-NUM-03 — Ước lượng số đồ vật theo nhóm 1 chục
- **Chủ đề:** Số tự nhiên
- **Nội dung:** Ước lượng số đồ vật.
- **Yêu cầu cần đạt:**
  - Làm quen với việc ước lượng số đồ vật theo các nhóm 1 chục.
- **visual_templates:** `counting_objects`, `grouping_model`
- **visual_intent:** Nhóm đồ vật theo từng chục để đoán nhanh số lượng.
- **data_params:** `object_count`, `group_size`.

### G2-OPS-01 — Cộng, trừ trong phạm vi 1000
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Phép cộng, phép trừ.
- **Yêu cầu cần đạt:**
  - Nhận biết được các thành phần của phép cộng, phép trừ.
  - Thực hiện được phép cộng, phép trừ không nhớ hoặc có nhớ không quá một lượt các số trong phạm vi 1000.
  - Thực hiện được tính toán trong trường hợp có hai dấu phép tính cộng, trừ theo thứ tự từ trái sang phải.
- **visual_templates:** `place_value_blocks`, `number_line`, `operation_story`
- **visual_intent:** Minh họa nhớ/chuyển chục bằng khối giá trị vị trí.
- **data_params:** `a`, `b`, `operation`, `carry`, `borrow`.

### G2-OPS-02 — Phép nhân, phép chia với bảng 2 và 5
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Phép nhân, phép chia.
- **Yêu cầu cần đạt:**
  - Nhận biết được ý nghĩa của phép nhân, phép chia.
  - Nhận biết được các thành phần của phép nhân, phép chia.
  - Vận dụng được bảng nhân 2 và bảng nhân 5 trong thực hành tính.
  - Vận dụng được bảng chia 2 và bảng chia 5 trong thực hành tính.
- **visual_templates:** `array_model`, `grouping_model`, `counting_objects`
- **visual_intent:** Biểu diễn nhân là các nhóm bằng nhau, chia là chia đều hoặc chia theo nhóm.
- **data_params:** `groups`, `items_per_group`, `total`, `divisor`.

### G2-OPS-03 — Tính nhẩm
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Tính nhẩm.
- **Yêu cầu cần đạt:**
  - Thực hiện được việc cộng, trừ nhẩm trong phạm vi 20.
  - Thực hiện được cộng, trừ nhẩm các số tròn chục, tròn trăm trong phạm vi 1000.
- **visual_templates:** `ten_frame`, `number_line`, `place_value_blocks`
- **visual_intent:** Hỗ trợ chiến lược nhẩm bằng làm tròn chục/trăm hoặc nhảy trên tia số.
- **data_params:** `a`, `b`, `operation`, `mental_strategy`.

### G2-WORD-01 — Bài toán một bước tính
- **Chủ đề:** Thực hành giải quyết vấn đề liên quan đến các phép tính đã học
- **Nội dung:** Bài toán có lời văn một bước tính.
- **Yêu cầu cần đạt:**
  - Nhận biết ý nghĩa thực tiễn của phép tính cộng, trừ, nhân, chia thông qua tranh ảnh, hình vẽ hoặc tình huống thực tiễn.
  - Giải quyết được một số vấn đề gắn với việc giải các bài toán có một bước tính trong phạm vi các số và phép tính đã học, liên quan đến ý nghĩa thực tế của phép tính, ví dụ thêm, bớt, nhiều hơn, ít hơn.
- **visual_templates:** `operation_story`, `bar_model`, `counting_objects`, `array_model`
- **visual_intent:** Chuyển bài toán lời văn thành sơ đồ đơn giản.
- **data_params:** `story`, `known_values`, `unknown`, `operation`.

## Mạch: Hình học và đo lường

### G2-GEO-01 — Điểm, đoạn thẳng, đường thẳng, đường cong, đường gấp khúc
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Quan sát, nhận biết, mô tả hình dạng của một số hình phẳng và hình khối đơn giản.
- **Yêu cầu cần đạt:**
  - Nhận biết được điểm, đoạn thẳng, đường cong, đường thẳng, đường gấp khúc, ba điểm thẳng hàng thông qua hình ảnh trực quan.
  - Nhận dạng được hình tứ giác thông qua bộ đồ dùng học tập cá nhân hoặc vật thật.
  - Nhận dạng được khối trụ, khối cầu thông qua bộ đồ dùng học tập cá nhân hoặc vật thật.
- **visual_templates:** `geometry_shape`, `shape_sorting`, `real_object_match`
- **visual_intent:** Dùng hình vẽ và vật thật để phân biệt đường, điểm, hình, khối.
- **data_params:** `shape_type`, `points`, `line_type`, `solid_type`.

### G2-GEO-02 — Vẽ đoạn thẳng, gấp cắt ghép tạo hình
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Thực hành đo, vẽ, lắp ghép, tạo hình.
- **Yêu cầu cần đạt:**
  - Thực hiện được việc vẽ đoạn thẳng có độ dài cho trước.
  - Nhận biết và thực hiện được việc gấp, cắt, ghép, xếp và tạo hình gắn với bộ đồ dùng học tập cá nhân hoặc vật thật.
  - Giải quyết được một số vấn đề thực tiễn đơn giản liên quan đến hình phẳng và hình khối đã học.
- **visual_templates:** `ruler_measurement`, `shape_composition`, `drag_drop_shapes`
- **visual_intent:** Cho học sinh vẽ đoạn thẳng, ghép hình và kiểm tra kết quả.
- **data_params:** `length_cm`, `parts`, `target_shape`.

### G2-MEAS-01 — Khối lượng, dung tích, độ dài, thời gian, tiền Việt Nam
- **Chủ đề:** Đo lường
- **Nội dung:** Biểu tượng về đại lượng và đơn vị đo đại lượng.
- **Yêu cầu cần đạt:**
  - Nhận biết được về “nặng hơn”, “nhẹ hơn”.
  - Nhận biết được đơn vị đo khối lượng kg; đọc và viết được số đo khối lượng trong phạm vi 1000 kg.
  - Nhận biết được đơn vị đo dung tích lít; đọc và viết được số đo dung tích trong phạm vi 1000 lít.
  - Nhận biết được các đơn vị đo độ dài dm, m, km và quan hệ giữa các đơn vị đo độ dài đã học.
  - Nhận biết được một ngày có 24 giờ; một giờ có 60 phút.
  - Nhận biết được số ngày trong tháng, ngày trong tháng.
  - Nhận biết được tiền Việt Nam thông qua hình ảnh một số tờ tiền.
- **visual_templates:** `mass_capacity_visual`, `ruler_measurement`, `clock_calendar`, `money_visual`
- **visual_intent:** Biểu diễn các đại lượng bằng vật quen thuộc, đồng hồ, lịch và tiền giấy.
- **data_params:** `unit`, `value`, `conversion`, `money_notes`, `date_time`.

### G2-MEAS-02 — Thực hành đo, chuyển đổi và tính toán với số đo
- **Chủ đề:** Đo lường
- **Nội dung:** Thực hành đo đại lượng; tính toán và ước lượng với các số đo đại lượng.
- **Yêu cầu cần đạt:**
  - Sử dụng được một số dụng cụ thông dụng để cân, đo, đong, đếm.
  - Đọc được giờ trên đồng hồ khi kim phút chỉ số 3, số 6.
  - Thực hiện được việc chuyển đổi và tính toán với các số đo độ dài, khối lượng, dung tích đã học.
  - Thực hiện được việc ước lượng các số đo trong một số trường hợp đơn giản.
  - Tính được độ dài đường gấp khúc khi biết độ dài các cạnh.
  - Giải quyết được một số vấn đề thực tiễn liên quan đến đo lường các đại lượng đã học.
- **visual_templates:** `ruler_measurement`, `clock_calendar`, `mass_capacity_visual`, `polyline_length_visual`
- **visual_intent:** Đo, đọc giờ, cộng độ dài các đoạn gấp khúc.
- **data_params:** `segments`, `unit`, `clock_time`, `measurement_values`.

## Mạch: Một số yếu tố thống kê và xác suất

### G2-STAT-01 — Thu thập, phân loại, kiểm đếm, biểu đồ tranh
- **Chủ đề:** Một số yếu tố thống kê
- **Nội dung:** Thu thập, phân loại, sắp xếp các số liệu; đọc biểu đồ tranh; nhận xét về biểu đồ tranh.
- **Yêu cầu cần đạt:**
  - Làm quen với việc thu thập, phân loại, kiểm đếm các đối tượng thống kê trong một số tình huống đơn giản.
  - Đọc và mô tả được các số liệu ở dạng biểu đồ tranh.
  - Nêu được một số nhận xét đơn giản từ biểu đồ tranh.
- **visual_templates:** `picture_graph`, `data_table`, `counting_objects`
- **visual_intent:** Tạo biểu đồ tranh từ dữ liệu đồ vật quen thuộc.
- **data_params:** `categories`, `counts`, `icon_scale`.

### G2-PROB-01 — Khả năng xảy ra của sự kiện
- **Chủ đề:** Một số yếu tố xác suất
- **Nội dung:** Làm quen với các khả năng xảy ra có tính ngẫu nhiên của một sự kiện.
- **Yêu cầu cần đạt:**
  - Làm quen với việc mô tả những hiện tượng liên quan tới các thuật ngữ: có thể, chắc chắn, không thể, thông qua thí nghiệm, trò chơi hoặc thực tiễn.
- **visual_templates:** `probability_experiment`, `scenario_cards`
- **visual_intent:** Dùng tình huống có thể/chắc chắn/không thể để học sinh phân loại.
- **data_params:** `event`, `outcomes`, `probability_label`.

## Hoạt động thực hành và trải nghiệm - Lớp 2
- Thực hành tính toán, đo lường và ước lượng độ dài, khối lượng, dung tích trong thực tiễn; đọc giờ, xem lịch, sắp xếp thời gian biểu.
- Thực hành thu thập, phân loại, ghi chép, kiểm đếm một số đối tượng thống kê trong trường, lớp.
- Tổ chức trò chơi học toán hoặc hoạt động “Học vui - Vui học” để ôn tập, củng cố kiến thức cơ bản.

---

# LỚP 3

## Mạch: Số và phép tính

### G3-NUM-01 — Số tự nhiên trong phạm vi 100 000
- **Chủ đề:** Số tự nhiên
- **Nội dung:** Số và cấu tạo thập phân của một số.
- **Yêu cầu cần đạt:**
  - Đọc, viết được các số trong phạm vi 10 000; trong phạm vi 100 000.
  - Nhận biết được số tròn nghìn, tròn mười nghìn.
  - Nhận biết được cấu tạo thập phân của một số.
  - Nhận biết được chữ số La Mã và viết được các số tự nhiên trong phạm vi 20 bằng chữ số La Mã.
- **visual_templates:** `place_value_blocks`, `number_line`, `roman_numeral_visual`
- **visual_intent:** Biểu diễn số lớn bằng hàng chục nghìn, nghìn, trăm, chục, đơn vị.
- **data_params:** `number`, `place_values`, `roman_value`.

### G3-NUM-02 — So sánh, sắp xếp và làm tròn số
- **Chủ đề:** Số tự nhiên
- **Nội dung:** So sánh các số; làm tròn số.
- **Yêu cầu cần đạt:**
  - Nhận biết được cách so sánh hai số trong phạm vi 100 000.
  - Xác định được số lớn nhất hoặc số bé nhất trong một nhóm có không quá 4 số.
  - Sắp xếp được các số theo thứ tự từ bé đến lớn hoặc ngược lại.
  - Làm quen với việc làm tròn số đến tròn chục, tròn trăm, tròn nghìn, tròn mười nghìn.
- **visual_templates:** `number_line`, `place_value_blocks`, `rounding_visual`
- **visual_intent:** Cho thấy số gần mốc nào hơn khi làm tròn.
- **data_params:** `numbers`, `round_to`, `number_line_range`.

### G3-OPS-01 — Cộng, trừ, nhân, chia số tự nhiên
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Phép cộng, phép trừ; phép nhân, phép chia.
- **Yêu cầu cần đạt:**
  - Thực hiện được phép cộng, phép trừ các số có đến 5 chữ số, có nhớ không quá hai lượt và không liên tiếp.
  - Nhận biết được tính chất giao hoán, tính chất kết hợp của phép cộng và mối quan hệ giữa phép cộng với phép trừ.
  - Vận dụng được các bảng nhân, bảng chia 2, 3, ..., 9 trong thực hành tính.
  - Thực hiện được phép nhân với số có một chữ số, có nhớ không quá hai lượt và không liên tiếp.
  - Thực hiện được phép chia cho số có một chữ số.
  - Nhận biết và thực hiện được phép chia hết và phép chia có dư.
  - Nhận biết được tính chất giao hoán, tính chất kết hợp của phép nhân và mối quan hệ giữa phép nhân với phép chia.
- **visual_templates:** `place_value_blocks`, `array_model`, `grouping_model`, `number_line`
- **visual_intent:** Minh họa phép tính cột, bảng nhân/chia, chia có dư.
- **data_params:** `a`, `b`, `operation`, `carry`, `remainder`.

### G3-OPS-02 — Tính nhẩm, biểu thức số và thành phần chưa biết
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Tính nhẩm; biểu thức số.
- **Yêu cầu cần đạt:**
  - Thực hiện được cộng, trừ, nhân, chia nhẩm trong những trường hợp đơn giản.
  - Làm quen với biểu thức số.
  - Tính được giá trị của biểu thức số có đến hai dấu phép tính và không có dấu ngoặc.
  - Tính được giá trị của biểu thức số có đến hai dấu phép tính và có dấu ngoặc theo nguyên tắc thực hiện trong dấu ngoặc trước.
  - Xác định được thành phần chưa biết của phép tính thông qua các giá trị đã biết.
- **visual_templates:** `expression_tree`, `number_line`, `balance_model`
- **visual_intent:** Hiển thị thứ tự thực hiện phép tính và tìm ô trống.
- **data_params:** `expression`, `steps`, `unknown_position`.

### G3-WORD-01 — Bài toán đến hai bước tính
- **Chủ đề:** Thực hành giải quyết vấn đề liên quan đến các phép tính đã học
- **Nội dung:** Bài toán có đến hai bước tính.
- **Yêu cầu cần đạt:**
  - Giải quyết được một số vấn đề gắn với bài toán có đến hai bước tính trong phạm vi số và phép tính đã học; liên quan đến ý nghĩa thực tế của phép tính, thành phần và kết quả của phép tính, các quan hệ so sánh trực tiếp và đơn giản như gấp một số lên một số lần, giảm một số đi một số lần, so sánh số lớn gấp mấy lần số bé.
- **visual_templates:** `bar_model`, `operation_story`, `array_model`, `grouping_model`
- **visual_intent:** Tách đề bài thành các bước và biểu diễn bằng sơ đồ đoạn thẳng.
- **data_params:** `story`, `steps`, `known_values`, `unknown`.

### G3-FRAC-01 — Làm quen với phân số
- **Chủ đề:** Phân số
- **Nội dung:** Làm quen với phân số.
- **Yêu cầu cần đạt:**
  - Nhận biết được về phân số thông qua các hình ảnh trực quan.
  - Xác định được một phần của một nhóm đồ vật bằng việc chia thành các phần đều nhau.
- **visual_templates:** `fraction_bar`, `fraction_circle`, `grouping_model`
- **visual_intent:** Cho học sinh thấy phân số là phần bằng nhau của một hình hoặc một nhóm.
- **data_params:** `numerator`, `denominator`, `whole_type`, `group_count`.

## Mạch: Hình học và đo lường

### G3-GEO-01 — Góc, tam giác, tứ giác, hình tròn, khối hộp
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Quan sát, nhận biết, mô tả hình dạng và đặc điểm của một số hình phẳng và hình khối đơn giản.
- **Yêu cầu cần đạt:**
  - Nhận biết được điểm ở giữa, trung điểm của đoạn thẳng.
  - Nhận biết được góc, góc vuông, góc không vuông.
  - Nhận biết được tam giác, tứ giác.
  - Nhận biết được một số yếu tố cơ bản như đỉnh, cạnh, góc của hình chữ nhật, hình vuông; tâm, bán kính, đường kính của hình tròn.
  - Nhận biết được một số yếu tố cơ bản như đỉnh, cạnh, mặt của khối lập phương, khối hộp chữ nhật.
- **visual_templates:** `geometry_shape`, `angle_protractor`, `shape_attribute_highlight`, `solid_shape`
- **visual_intent:** Highlight đỉnh, cạnh, góc, bán kính, đường kính và mặt của hình.
- **data_params:** `shape_type`, `attributes`, `angle_type`.

### G3-GEO-02 — Vẽ góc vuông, đường tròn, hình vuông, hình chữ nhật
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Thực hành đo, vẽ, lắp ghép, tạo hình.
- **Yêu cầu cần đạt:**
  - Thực hiện được việc vẽ góc vuông, đường tròn, vẽ trang trí.
  - Sử dụng được êke để kiểm tra góc vuông, sử dụng được compa để vẽ đường tròn.
  - Thực hiện được việc vẽ hình vuông, hình chữ nhật bằng lưới ô vuông.
  - Giải quyết được một số vấn đề liên quan đến gấp, cắt, ghép, xếp, vẽ và tạo hình trang trí.
- **visual_templates:** `angle_protractor`, `geometry_shape`, `area_grid`, `shape_composition`
- **visual_intent:** Mô phỏng thao tác êke, compa, lưới ô vuông.
- **data_params:** `tool`, `shape_type`, `grid_size`, `radius`.

### G3-MEAS-01 — Diện tích, mm, g, ml, °C, tiền, tháng trong năm
- **Chủ đề:** Đo lường
- **Nội dung:** Biểu tượng về đại lượng và đơn vị đo đại lượng.
- **Yêu cầu cần đạt:**
  - Nhận biết được “diện tích” thông qua một số biểu tượng cụ thể.
  - Nhận biết được đơn vị đo diện tích cm².
  - Nhận biết được đơn vị đo độ dài mm và quan hệ giữa m, dm, cm, mm.
  - Nhận biết được đơn vị đo khối lượng g và quan hệ giữa g và kg.
  - Nhận biết được đơn vị đo dung tích ml và quan hệ giữa l và ml.
  - Nhận biết được đơn vị đo nhiệt độ °C.
  - Nhận biết được mệnh giá của các tờ tiền Việt Nam trong phạm vi 100 000 đồng; nhận biết được tờ 200 000 đồng và 500 000 đồng, không yêu cầu đọc, viết số chỉ mệnh giá.
  - Nhận biết được tháng trong năm.
- **visual_templates:** `area_grid`, `ruler_measurement`, `mass_capacity_visual`, `thermometer_visual`, `money_visual`, `clock_calendar`
- **visual_intent:** Dùng lưới ô vuông cho diện tích, nhiệt kế cho nhiệt độ, lịch cho tháng.
- **data_params:** `unit`, `value`, `conversion`, `money_note`, `month`.

### G3-MEAS-02 — Đo, chuyển đổi, chu vi, diện tích
- **Chủ đề:** Đo lường
- **Nội dung:** Thực hành đo đại lượng; tính toán và ước lượng với số đo đại lượng.
- **Yêu cầu cần đạt:**
  - Sử dụng được một số dụng cụ thông dụng để cân, đo, đong, đếm.
  - Đọc được giờ chính xác đến 5 phút và từng phút trên đồng hồ.
  - Thực hiện được việc chuyển đổi và tính toán với số đo độ dài, diện tích, khối lượng, dung tích, thời gian, tiền Việt Nam đã học.
  - Tính được chu vi của hình tam giác, hình tứ giác, hình chữ nhật, hình vuông khi biết độ dài các cạnh.
  - Tính được diện tích hình chữ nhật, hình vuông.
  - Thực hiện được việc ước lượng kết quả đo lường trong một số trường hợp đơn giản.
  - Giải quyết được một số vấn đề thực tiễn liên quan đến đo lường.
- **visual_templates:** `ruler_measurement`, `clock_calendar`, `area_grid`, `geometry_shape`, `money_visual`
- **visual_intent:** Đếm ô vuông để hiểu diện tích; cộng cạnh để hiểu chu vi.
- **data_params:** `shape_type`, `side_lengths`, `area_unit`, `perimeter`, `clock_time`.

## Mạch: Một số yếu tố thống kê và xác suất

### G3-STAT-01 — Bảng số liệu
- **Chủ đề:** Một số yếu tố thống kê
- **Nội dung:** Thu thập, phân loại, sắp xếp số liệu; đọc, mô tả bảng số liệu; nhận xét từ bảng.
- **Yêu cầu cần đạt:**
  - Nhận biết được cách thu thập, phân loại, ghi chép số liệu thống kê theo tiêu chí cho trước.
  - Đọc và mô tả được các số liệu ở dạng bảng.
  - Nêu được một số nhận xét đơn giản từ bảng số liệu.
- **visual_templates:** `data_table`, `bar_chart`
- **visual_intent:** Tạo bảng số liệu đơn giản và sinh câu hỏi nhận xét.
- **data_params:** `columns`, `rows`, `categories`, `values`.

### G3-PROB-01 — Khả năng xảy ra trong thí nghiệm đơn giản
- **Chủ đề:** Một số yếu tố xác suất
- **Nội dung:** Nhận biết và mô tả khả năng xảy ra của một sự kiện.
- **Yêu cầu cần đạt:**
  - Nhận biết và mô tả được các khả năng xảy ra có tính ngẫu nhiên của một sự kiện khi thực hiện một lần thí nghiệm đơn giản, ví dụ tung đồng xu một lần, lấy bóng từ hộp kín có hai màu.
- **visual_templates:** `probability_experiment`, `scenario_cards`
- **visual_intent:** Mô phỏng một lần thử và các kết quả có thể xảy ra.
- **data_params:** `experiment`, `outcomes`, `trial_count`.

## Hoạt động thực hành và trải nghiệm - Lớp 3
- Thực hành tính toán, đo lường và ước lượng chu vi, diện tích của một số hình phẳng trong thực tế; thực hành đo, cân, đong và ước lượng độ dài, khối lượng, dung tích, nhiệt độ.
- Thực hành thu thập, phân loại, sắp xếp số liệu thống kê theo tiêu chí cho trước.
- Tổ chức trò chơi học Toán hoặc hoạt động “Học vui - Vui học”; trò chơi mua bán, trao đổi hàng hoá; lắp ghép, gấp, xếp hình; tung đồng xu, xúc xắc.

---

# LỚP 4

## Mạch: Số và phép tính

### G4-NUM-01 — Số tự nhiên đến lớp triệu
- **Chủ đề:** Số tự nhiên
- **Nội dung:** Số và cấu tạo thập phân của một số.
- **Yêu cầu cần đạt:**
  - Đọc, viết được các số có nhiều chữ số đến lớp triệu.
  - Nhận biết được cấu tạo thập phân của một số và giá trị theo vị trí của từng chữ số.
  - Nhận biết được số chẵn, số lẻ.
  - Làm quen với dãy số tự nhiên và đặc điểm.
- **visual_templates:** `place_value_blocks`, `number_line`, `parity_visual`
- **visual_intent:** Biểu diễn lớp đơn vị, lớp nghìn, lớp triệu; phân biệt chẵn/lẻ bằng cặp đồ vật.
- **data_params:** `number`, `place_values`, `is_even`.

### G4-NUM-02 — So sánh, sắp xếp, làm tròn số tự nhiên
- **Chủ đề:** Số tự nhiên
- **Nội dung:** So sánh các số; làm tròn số.
- **Yêu cầu cần đạt:**
  - Nhận biết được cách so sánh hai số trong phạm vi lớp triệu.
  - Sắp xếp được các số theo thứ tự từ bé đến lớn hoặc ngược lại trong nhóm có không quá 4 số.
  - Làm tròn được số đến tròn chục, tròn trăm, tròn nghìn, tròn mười nghìn, tròn trăm nghìn.
- **visual_templates:** `number_line`, `rounding_visual`, `place_value_blocks`
- **visual_intent:** Minh họa vị trí số giữa hai mốc làm tròn.
- **data_params:** `number`, `round_to`, `numbers`.

### G4-OPS-01 — Cộng, trừ, nhân, chia số tự nhiên nhiều chữ số
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Phép cộng, phép trừ; phép nhân, phép chia.
- **Yêu cầu cần đạt:**
  - Thực hiện được phép cộng, phép trừ các số tự nhiên có nhiều chữ số, có nhớ không quá ba lượt và không liên tiếp.
  - Vận dụng được tính chất giao hoán, kết hợp của phép cộng và quan hệ giữa phép cộng và phép trừ.
  - Tính được số trung bình cộng của hai hay nhiều số.
  - Thực hiện được phép nhân với số có không quá hai chữ số.
  - Thực hiện được phép chia cho số có không quá hai chữ số.
  - Thực hiện được nhân với 10, 100, 1000,... và chia cho 10, 100, 1000,...
  - Vận dụng được tính chất giao hoán, kết hợp của phép nhân và quan hệ giữa phép nhân với phép chia.
- **visual_templates:** `place_value_blocks`, `array_model`, `grouping_model`, `mean_balance_visual`
- **visual_intent:** Biểu diễn nhân/chia theo mô hình diện tích hoặc nhóm; trung bình cộng bằng cân bằng cột.
- **data_params:** `a`, `b`, `operation`, `factor`, `divisor`, `values`.

### G4-OPS-02 — Tính nhẩm, ước lượng, biểu thức chữ
- **Chủ đề:** Các phép tính với số tự nhiên
- **Nội dung:** Tính nhẩm; biểu thức số và biểu thức chữ.
- **Yêu cầu cần đạt:**
  - Vận dụng được tính chất của phép tính để tính nhẩm và tính bằng cách thuận tiện nhất.
  - Ước lượng được trong những tính toán đơn giản.
  - Làm quen với biểu thức chứa một, hai, ba chữ và tính được giá trị của biểu thức trong trường hợp đơn giản.
  - Vận dụng được tính chất phân phối của phép nhân đối với phép cộng trong tính giá trị biểu thức.
- **visual_templates:** `expression_tree`, `area_model_distributive`, `number_line`
- **visual_intent:** Dùng mô hình diện tích để giải thích tính chất phân phối.
- **data_params:** `expression`, `variables`, `values`, `strategy`.

### G4-WORD-01 — Bài toán hai hoặc ba bước tính
- **Chủ đề:** Thực hành giải quyết vấn đề liên quan đến phép tính đã học
- **Nội dung:** Bài toán có đến hai hoặc ba bước tính.
- **Yêu cầu cần đạt:**
  - Giải quyết được một số vấn đề gắn với bài toán có đến hai hoặc ba bước tính trong phạm vi số và phép tính đã học; liên quan đến thành phần, kết quả của phép tính, quan hệ so sánh trực tiếp hoặc quan hệ phụ thuộc trực tiếp và đơn giản, ví dụ tìm số trung bình cộng, tìm hai số khi biết tổng và hiệu, rút về đơn vị.
- **visual_templates:** `bar_model`, `operation_story`, `mean_balance_visual`, `unit_rate_visual`
- **visual_intent:** Dùng sơ đồ đoạn thẳng và bảng bước giải để biểu diễn quan hệ.
- **data_params:** `problem_type`, `known_values`, `unknowns`, `steps`.

### G4-FRAC-01 — Khái niệm và tính chất cơ bản của phân số
- **Chủ đề:** Phân số
- **Nội dung:** Khái niệm ban đầu về phân số; tính chất cơ bản của phân số.
- **Yêu cầu cần đạt:**
  - Nhận biết được khái niệm ban đầu về phân số, tử số, mẫu số.
  - Đọc, viết được các phân số.
  - Nhận biết được tính chất cơ bản của phân số.
  - Rút gọn phân số trong trường hợp đơn giản.
  - Quy đồng mẫu số hai phân số trong trường hợp có một mẫu số chia hết cho mẫu số còn lại.
- **visual_templates:** `fraction_bar`, `fraction_circle`, `equivalent_fraction_visual`
- **visual_intent:** Cho thấy các phân số bằng nhau khi chia phần nhỏ hơn.
- **data_params:** `numerator`, `denominator`, `equivalent_form`, `common_denominator`.

### G4-FRAC-02 — So sánh và phép tính với phân số
- **Chủ đề:** Phân số
- **Nội dung:** So sánh phân số; cộng, trừ, nhân, chia phân số.
- **Yêu cầu cần đạt:**
  - So sánh và sắp xếp được thứ tự các phân số trong trường hợp cùng mẫu số hoặc có một mẫu số chia hết cho các mẫu số còn lại.
  - Xác định được phân số lớn nhất, bé nhất trong nhóm có không quá 4 phân số ở các trường hợp trên.
  - Thực hiện được phép cộng, phép trừ phân số trong các trường hợp có cùng mẫu số hoặc có một mẫu số chia hết cho các mẫu số còn lại.
  - Thực hiện được phép nhân, phép chia hai phân số.
  - Giải quyết được một số vấn đề gắn với bài toán có đến hai hoặc ba bước tính liên quan đến bốn phép tính với phân số, ví dụ tìm phân số của một số.
- **visual_templates:** `fraction_bar`, `fraction_circle`, `number_line`, `bar_model`
- **visual_intent:** So sánh, cộng trừ bằng thanh phân số; nhân phân số bằng mô hình diện tích.
- **data_params:** `fractions`, `operation`, `common_denominator`, `whole_number`.

## Mạch: Hình học và đo lường

### G4-GEO-01 — Góc, đường thẳng vuông góc/song song, hình bình hành, hình thoi
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Quan sát, nhận biết, mô tả hình dạng và đặc điểm của một số hình phẳng đơn giản.
- **Yêu cầu cần đạt:**
  - Nhận biết được góc nhọn, góc tù, góc bẹt.
  - Nhận biết được hai đường thẳng vuông góc, hai đường thẳng song song.
  - Nhận biết được hình bình hành, hình thoi.
- **visual_templates:** `geometry_shape`, `angle_protractor`, `parallel_perpendicular_visual`
- **visual_intent:** Highlight góc và quan hệ đường thẳng trên hình.
- **data_params:** `angle_type`, `line_relation`, `shape_type`.

### G4-GEO-02 — Vẽ đường vuông góc, song song, lắp ghép hình
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Thực hành đo, vẽ, lắp ghép, tạo hình.
- **Yêu cầu cần đạt:**
  - Vẽ được đường thẳng vuông góc, đường thẳng song song bằng thước thẳng và êke.
  - Thực hiện được việc đo, vẽ, lắp ghép, tạo lập một số hình phẳng và hình khối đã học.
  - Giải quyết được một số vấn đề liên quan đến đo góc, vẽ hình, lắp ghép, tạo lập hình.
- **visual_templates:** `geometry_shape`, `angle_protractor`, `shape_composition`, `drag_drop_shapes`
- **visual_intent:** Mô phỏng thao tác dùng thước và êke.
- **data_params:** `tool`, `line_relation`, `shape_type`, `angle_degree`.

### G4-MEAS-01 — Đơn vị khối lượng, diện tích, thời gian, góc
- **Chủ đề:** Đo lường
- **Nội dung:** Biểu tượng về đại lượng và đơn vị đo đại lượng.
- **Yêu cầu cần đạt:**
  - Nhận biết được các đơn vị đo khối lượng: yến, tạ, tấn và quan hệ với kg.
  - Nhận biết được các đơn vị đo diện tích dm², m², mm² và quan hệ giữa các đơn vị đó.
  - Nhận biết được các đơn vị đo thời gian: giây, thế kỉ và quan hệ giữa các đơn vị thời gian đã học.
  - Nhận biết được đơn vị đo góc: độ.
- **visual_templates:** `mass_capacity_visual`, `area_grid`, `clock_calendar`, `angle_protractor`
- **visual_intent:** Bảng chuyển đổi đơn vị kết hợp mô hình trực quan.
- **data_params:** `unit`, `value`, `conversion`, `angle_degree`.

### G4-MEAS-02 — Đo, chuyển đổi, tính toán và ước lượng đại lượng
- **Chủ đề:** Đo lường
- **Nội dung:** Thực hành đo đại lượng; tính toán và ước lượng với số đo đại lượng.
- **Yêu cầu cần đạt:**
  - Sử dụng được một số dụng cụ thông dụng để cân, đo, đong, đếm, xem thời gian với đơn vị đo đã học.
  - Sử dụng được thước đo góc để đo các góc 60°, 90°, 120°, 180°.
  - Chuyển đổi và tính toán với các số đo độ dài, diện tích, khối lượng, dung tích, thời gian, tiền Việt Nam đã học.
  - Ước lượng được kết quả đo lường trong một số trường hợp đơn giản.
  - Giải quyết được một số vấn đề thực tiễn liên quan đến đo độ dài, diện tích, khối lượng, dung tích, thời gian, tiền Việt Nam.
- **visual_templates:** `ruler_measurement`, `area_grid`, `angle_protractor`, `money_visual`, `mass_capacity_visual`
- **visual_intent:** Tạo bài tập đo, đổi đơn vị và ước lượng từ tình huống đời sống.
- **data_params:** `measurement_values`, `unit_from`, `unit_to`, `angle_degree`.

## Mạch: Một số yếu tố thống kê và xác suất

### G4-STAT-01 — Dãy số liệu và biểu đồ cột
- **Chủ đề:** Một số yếu tố thống kê
- **Nội dung:** Thu thập, phân loại, sắp xếp số liệu; đọc, mô tả biểu đồ cột; biểu diễn số liệu vào biểu đồ cột.
- **Yêu cầu cần đạt:**
  - Nhận biết được về dãy số liệu thống kê.
  - Nhận biết được cách sắp xếp dãy số liệu thống kê theo tiêu chí cho trước.
  - Đọc và mô tả được các số liệu ở dạng biểu đồ cột.
  - Sắp xếp được số liệu vào biểu đồ cột, không yêu cầu học sinh vẽ biểu đồ.
- **visual_templates:** `data_table`, `bar_chart`
- **visual_intent:** Tạo biểu đồ cột từ bảng và cho học sinh đọc giá trị.
- **data_params:** `categories`, `values`, `sort_criteria`.

### G4-STAT-02 — Nhận xét và giải quyết vấn đề từ biểu đồ cột
- **Chủ đề:** Một số yếu tố thống kê
- **Nội dung:** Hình thành và giải quyết vấn đề đơn giản từ số liệu và biểu đồ cột.
- **Yêu cầu cần đạt:**
  - Nêu được một số nhận xét đơn giản từ biểu đồ cột.
  - Tính được giá trị trung bình của các số liệu trong bảng hay biểu đồ cột.
  - Làm quen với việc phát hiện vấn đề hoặc quy luật đơn giản dựa trên quan sát số liệu từ biểu đồ cột.
  - Giải quyết được những vấn đề đơn giản liên quan đến các số liệu thu được từ biểu đồ cột.
- **visual_templates:** `bar_chart`, `data_table`, `mean_balance_visual`
- **visual_intent:** Highlight cột lớn nhất, nhỏ nhất, tính trung bình.
- **data_params:** `categories`, `values`, `question_type`.

### G4-PROB-01 — Kiểm đếm khả năng xảy ra nhiều lần
- **Chủ đề:** Một số yếu tố xác suất
- **Nội dung:** Kiểm đếm số lần lặp lại của một khả năng xảy ra nhiều lần của một sự kiện.
- **Yêu cầu cần đạt:**
  - Kiểm đếm được số lần lặp lại của một khả năng xảy ra nhiều lần của một sự kiện khi thực hiện nhiều lần thí nghiệm, trò chơi đơn giản như tung đồng xu, lấy bóng từ hộp kín.
- **visual_templates:** `probability_experiment`, `data_table`, `bar_chart`
- **visual_intent:** Mô phỏng nhiều lần thử và đếm tần suất kết quả.
- **data_params:** `experiment`, `trials`, `outcomes`, `counts`.

## Hoạt động thực hành và trải nghiệm - Lớp 4
- Thực hành tính toán, đo lường và ước lượng chu vi, diện tích, góc của một số hình phẳng trong thực tế; ước lượng khối lượng, dung tích.
- Thực hành thu thập, phân tích, biểu diễn số liệu thống kê trong tình huống đơn giản gắn với kinh tế, xã hội, biến đổi khí hậu, phát triển bền vững, giáo dục tài chính, chủ quyền biển đảo, biên giới, giáo dục STEM.
- Thực hành mua bán, trao đổi tiền tệ.
- Tổ chức trò chơi học toán, lắp ghép, gấp, xếp hình, tung đồng xu, xúc xắc; giao lưu với học sinh có năng khiếu toán nếu có điều kiện.

---

# LỚP 5

## Mạch: Số và phép tính

### G5-NUM-01 — Ôn tập số tự nhiên và phép tính với số tự nhiên
- **Chủ đề:** Số tự nhiên
- **Nội dung:** Ôn tập về số tự nhiên và các phép tính với số tự nhiên.
- **Yêu cầu cần đạt:**
  - Đọc, viết, so sánh, xếp thứ tự được các số tự nhiên.
  - Thực hiện được các phép tính cộng, trừ, nhân, chia số tự nhiên; vận dụng tính chất của phép tính với số tự nhiên để tính nhẩm và tính hợp lí.
  - Ước lượng và làm tròn được số trong những tính toán đơn giản.
  - Giải quyết được vấn đề gắn với bài toán có đến bốn bước tính liên quan đến phép tính về số tự nhiên và quan hệ phụ thuộc trực tiếp, đơn giản.
- **visual_templates:** `place_value_blocks`, `number_line`, `bar_model`, `operation_story`
- **visual_intent:** Tổng hợp thao tác số tự nhiên, làm tròn, bài toán nhiều bước.
- **data_params:** `numbers`, `operation`, `round_to`, `steps`.

### G5-FRAC-01 — Ôn tập phân số và phép tính với phân số
- **Chủ đề:** Phân số
- **Nội dung:** Ôn tập về phân số và các phép tính với phân số.
- **Yêu cầu cần đạt:**
  - Rút gọn được phân số.
  - Quy đồng, so sánh, xếp thứ tự được các phân số trong trường hợp có một mẫu số chia hết cho các mẫu số còn lại.
  - Thực hiện được phép cộng, phép trừ các phân số trong trường hợp có một mẫu số chia hết cho các mẫu số còn lại và nhân, chia phân số.
  - Thực hiện được phép cộng, phép trừ hai phân số bằng cách lấy mẫu số chung là tích của hai mẫu số.
  - Nhận biết được phân số thập phân và cách viết phân số thập phân ở dạng hỗn số.
  - Giải quyết được vấn đề gắn với bài toán liên quan đến các phép tính về phân số.
- **visual_templates:** `fraction_bar`, `fraction_circle`, `number_line`, `bar_model`
- **visual_intent:** Dùng thanh phân số để quy đồng, so sánh, cộng trừ; mô hình diện tích cho nhân phân số.
- **data_params:** `fractions`, `operation`, `common_denominator`, `mixed_number`.

### G5-DEC-01 — Số thập phân
- **Chủ đề:** Số thập phân
- **Nội dung:** Số thập phân; so sánh số thập phân; làm tròn số thập phân.
- **Yêu cầu cần đạt:**
  - Đọc, viết được số thập phân.
  - Nhận biết được số thập phân gồm phần nguyên, phần thập phân và hàng của số thập phân.
  - Thể hiện được các số đo đại lượng bằng cách dùng số thập phân.
  - Nhận biết được cách so sánh hai số thập phân.
  - Sắp xếp được các số thập phân theo thứ tự từ bé đến lớn hoặc ngược lại trong nhóm có không quá 4 số.
  - Làm tròn được một số thập phân tới số tự nhiên gần nhất hoặc tới số thập phân có một hoặc hai chữ số ở phần thập phân.
- **visual_templates:** `decimal_place_value`, `number_line`, `rounding_visual`, `ruler_measurement`
- **visual_intent:** Biểu diễn phần nguyên - phần thập phân bằng bảng hàng và vị trí trên tia số.
- **data_params:** `decimal`, `place_values`, `round_to`, `measure_unit`.

### G5-DEC-02 — Phép tính với số thập phân
- **Chủ đề:** Số thập phân
- **Nội dung:** Cộng, trừ, nhân, chia với số thập phân.
- **Yêu cầu cần đạt:**
  - Thực hiện được phép cộng, phép trừ hai số thập phân.
  - Thực hiện được phép nhân một số với số thập phân có không quá hai chữ số ở dạng a,b và 0,ab.
  - Thực hiện được phép chia một số với số thập phân có không quá hai chữ số khác không ở dạng a,b và 0,ab.
  - Vận dụng được tính chất của các phép tính với số thập phân và quan hệ giữa các phép tính đó trong thực hành tính toán.
  - Thực hiện được phép nhân, chia nhẩm một số thập phân với hoặc cho 10, 100, 1000,... hoặc với/cho 0,1; 0,01; 0,001; ...
  - Giải quyết vấn đề gắn với bài toán liên quan đến phép tính với số thập phân.
- **visual_templates:** `decimal_place_value`, `number_line`, `area_model_decimal`, `operation_story`
- **visual_intent:** Hiển thị dịch chuyển dấu phẩy khi nhân/chia 10, 100, 1000 và thao tác cột.
- **data_params:** `a`, `b`, `operation`, `decimal_places`, `scale_factor`.

### G5-RATIO-01 — Tỉ số, tỉ số phần trăm, tỉ lệ bản đồ
- **Chủ đề:** Tỉ số; tỉ số phần trăm
- **Nội dung:** Tỉ số, tỉ số phần trăm.
- **Yêu cầu cần đạt:**
  - Nhận biết được tỉ số, tỉ số phần trăm của hai đại lượng cùng loại.
  - Giải quyết được một số vấn đề gắn với bài toán liên quan đến tìm hai số khi biết tổng hoặc hiệu và tỉ số; tính tỉ số phần trăm của hai số; tìm giá trị phần trăm của một số cho trước.
  - Nhận biết được tỉ lệ bản đồ và vận dụng tỉ lệ bản đồ để giải quyết một số tình huống thực tiễn.
- **visual_templates:** `ratio_model`, `percent_bar`, `bar_model`, `map_scale_visual`
- **visual_intent:** Biểu diễn tỉ số bằng sơ đồ đoạn thẳng, phần trăm bằng thanh 100%, tỉ lệ bản đồ bằng đoạn đo.
- **data_params:** `ratio`, `percent`, `whole`, `part`, `map_scale`.

### G5-CALC-01 — Làm quen máy tính cầm tay
- **Chủ đề:** Sử dụng máy tính cầm tay
- **Nội dung:** Làm quen máy tính cầm tay.
- **Yêu cầu cần đạt:**
  - Làm quen với việc sử dụng máy tính cầm tay để thực hiện phép tính cộng, trừ, nhân, chia các số tự nhiên; tính tỉ số phần trăm của hai số; tính giá trị phần trăm của một số cho trước.
- **visual_templates:** `calculator_demo`, `step_by_step_input`
- **visual_intent:** Mô phỏng bấm máy tính và đối chiếu với cách tính tay.
- **data_params:** `expression`, `calculator_steps`.

## Mạch: Hình học và đo lường

### G5-GEO-01 — Hình thang, đường tròn, tam giác, hình khai triển
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Quan sát, nhận biết, mô tả hình dạng và đặc điểm của một số hình phẳng và hình khối đơn giản.
- **Yêu cầu cần đạt:**
  - Nhận biết được hình thang, đường tròn, một số loại hình tam giác như tam giác nhọn, tam giác vuông, tam giác tù, tam giác đều.
  - Nhận biết được hình khai triển của hình lập phương, hình hộp chữ nhật và hình trụ.
- **visual_templates:** `geometry_shape`, `shape_attribute_highlight`, `net_3d_visual`
- **visual_intent:** Highlight cạnh đáy, chiều cao, bán kính, loại tam giác; gấp mở hình khai triển.
- **data_params:** `shape_type`, `attributes`, `net_type`.

### G5-GEO-02 — Vẽ, lắp ghép, tạo hình
- **Chủ đề:** Hình học trực quan
- **Nội dung:** Thực hành vẽ, lắp ghép, tạo hình.
- **Yêu cầu cần đạt:**
  - Vẽ được hình thang, hình bình hành, hình thoi bằng lưới ô vuông.
  - Vẽ được đường cao của hình tam giác.
  - Vẽ được đường tròn có tâm và độ dài bán kính hoặc đường kính cho trước.
  - Giải quyết được một số vấn đề về đo, vẽ, lắp ghép, tạo hình gắn với hình phẳng và hình khối đã học, liên quan đến ứng dụng hình học trong thực tiễn và các môn Mĩ thuật, Công nghệ, Tin học.
- **visual_templates:** `area_grid`, `geometry_shape`, `shape_composition`, `net_3d_visual`
- **visual_intent:** Cho học sinh vẽ trên lưới, kéo thả đường cao, vẽ đường tròn bằng tâm/bán kính.
- **data_params:** `grid_size`, `shape_type`, `radius`, `diameter`, `height_line`.

### G5-MEAS-01 — Diện tích, thể tích, vận tốc
- **Chủ đề:** Đo lường
- **Nội dung:** Biểu tượng về đại lượng và đơn vị đo đại lượng.
- **Yêu cầu cần đạt:**
  - Nhận biết được các đơn vị đo diện tích: km², ha.
  - Nhận biết được “thể tích” thông qua một số biểu tượng cụ thể.
  - Nhận biết được một số đơn vị đo thể tích thông dụng: cm³, dm³, m³.
  - Nhận biết được vận tốc của một chuyển động đều; tên gọi, kí hiệu của một số đơn vị đo vận tốc: km/h, m/s.
- **visual_templates:** `area_grid`, `volume_cubes`, `speed_distance_time_visual`
- **visual_intent:** Dùng lưới diện tích, khối lập phương đơn vị và mô phỏng chuyển động đều.
- **data_params:** `area_unit`, `volume_unit`, `speed`, `distance`, `time`.

### G5-MEAS-02 — Diện tích, chu vi, thể tích, chuyển động đều
- **Chủ đề:** Đo lường
- **Nội dung:** Thực hành đo đại lượng; tính toán và ước lượng với số đo đại lượng.
- **Yêu cầu cần đạt:**
  - Sử dụng được một số dụng cụ thông dụng để cân, đo, đong, đếm, xem thời gian, mua bán với đơn vị đo đại lượng và tiền tệ đã học.
  - Thực hiện được việc chuyển đổi và tính toán với số đo thể tích và số đo thời gian.
  - Tính được diện tích hình tam giác, hình thang.
  - Tính được chu vi và diện tích hình tròn.
  - Tính được diện tích xung quanh, diện tích toàn phần, thể tích của hình hộp chữ nhật, hình lập phương.
  - Ước lượng được thể tích trong một số trường hợp đơn giản.
  - Giải quyết được một số vấn đề thực tiễn liên quan đến đo thể tích, dung tích, thời gian.
  - Giải quyết được bài toán liên quan đến chuyển động đều: tìm vận tốc, quãng đường, thời gian.
- **visual_templates:** `area_grid`, `geometry_shape`, `volume_cubes`, `speed_distance_time_visual`, `money_visual`
- **visual_intent:** Trực quan hóa công thức bằng lưới, khối lập phương và mô phỏng chuyển động.
- **data_params:** `shape_type`, `dimensions`, `area`, `volume`, `speed`, `distance`, `time`.

## Mạch: Một số yếu tố thống kê và xác suất

### G5-STAT-01 — Biểu đồ hình quạt tròn
- **Chủ đề:** Một số yếu tố thống kê
- **Nội dung:** Thu thập, phân loại, sắp xếp số liệu; đọc, mô tả và biểu diễn số liệu bằng biểu đồ thống kê hình quạt tròn.
- **Yêu cầu cần đạt:**
  - Thực hiện được việc thu thập, phân loại, so sánh, sắp xếp số liệu thống kê theo tiêu chí cho trước.
  - Đọc và mô tả được các số liệu ở dạng biểu đồ hình quạt tròn.
  - Sắp xếp được số liệu vào biểu đồ hình quạt tròn, không yêu cầu học sinh vẽ hình.
  - Lựa chọn được cách biểu diễn số liệu bằng dãy số liệu, bảng số liệu hoặc biểu đồ.
- **visual_templates:** `data_table`, `pie_chart`, `bar_chart`
- **visual_intent:** Chuyển bảng số liệu thành biểu đồ tròn và giải thích tỉ lệ phần trăm.
- **data_params:** `categories`, `values`, `percentages`, `chart_type`.

### G5-STAT-02 — Nhận xét và giải quyết vấn đề từ biểu đồ hình quạt tròn
- **Chủ đề:** Một số yếu tố thống kê
- **Nội dung:** Hình thành và giải quyết vấn đề đơn giản từ số liệu và biểu đồ hình quạt tròn.
- **Yêu cầu cần đạt:**
  - Nêu được một số nhận xét đơn giản từ biểu đồ hình quạt tròn.
  - Làm quen với việc phát hiện vấn đề hoặc quy luật đơn giản dựa trên quan sát số liệu từ biểu đồ hình quạt tròn.
  - Giải quyết được những vấn đề đơn giản liên quan đến số liệu thu được từ biểu đồ hình quạt tròn.
  - Nhận biết được mối liên hệ giữa thống kê với kiến thức khác trong môn Toán và thực tiễn, ví dụ số thập phân, tỉ số phần trăm.
- **visual_templates:** `pie_chart`, `data_table`, `percent_bar`
- **visual_intent:** Liên hệ phần trăm trong biểu đồ với số liệu thực tế.
- **data_params:** `categories`, `values`, `percentages`, `question_type`.

### G5-PROB-01 — Tỉ số mô tả số lần lặp lại của khả năng xảy ra
- **Chủ đề:** Một số yếu tố xác suất
- **Nội dung:** Tỉ số mô tả số lần lặp lại của một khả năng xảy ra nhiều lần của một sự kiện trong một thí nghiệm so với tổng số lần thực hiện.
- **Yêu cầu cần đạt:**
  - Sử dụng được tỉ số để mô tả số lần lặp lại của một khả năng xảy ra nhiều lần của một sự kiện trong thí nghiệm so với tổng số lần thực hiện thí nghiệm đó ở trường hợp đơn giản, ví dụ dùng tỉ số 2/5 để mô tả 2 lần xảy ra khả năng “mặt sấp đồng xu xuất hiện” khi tung đồng xu 5 lần.
- **visual_templates:** `probability_experiment`, `fraction_bar`, `data_table`
- **visual_intent:** Mô phỏng nhiều lần thử và biểu diễn kết quả bằng tỉ số/phân số.
- **data_params:** `experiment`, `success_count`, `trial_count`, `ratio`.

## Hoạt động thực hành và trải nghiệm - Lớp 5
- Thực hành tổng hợp tính toán, đo lường và ước lượng thể tích của hình khối trong thực tiễn; tính toán và ước lượng vận tốc, quãng đường, thời gian trong chuyển động đều.
- Thực hành thu thập, phân tích, biểu diễn số liệu thống kê trong tình huống đơn giản gắn với phát triển kinh tế - xã hội, biến đổi khí hậu, phát triển bền vững, giáo dục tài chính, chủ quyền biên giới, biển đảo, giáo dục STEM.
- Thực hành mua bán, trao đổi, chi tiêu hợp lí; tính tiền lãi, lỗ trong mua bán; tính lãi suất trong tiền gửi tiết kiệm và vay vốn.
- Tổ chức trò chơi như tangram, “Học vui - Vui học”, mua bán hàng hoá, lắp ghép, gấp, xếp hình, tung đồng xu, xúc xắc; giao lưu với học sinh có khả năng và yêu thích môn Toán nếu có điều kiện.

---

## 6. Gợi ý mapping nhanh từ concept sang visual engine

| Nhóm concept | Lớp xuất hiện mạnh | Visual engine nên ưu tiên |
|---|---:|---|
| Đếm, số tự nhiên, cấu tạo thập phân | 1-5 | `counting_objects`, `place_value_blocks`, `number_line` |
| Cộng, trừ | 1-5 | `ten_frame`, `place_value_blocks`, `number_line`, `operation_story` |
| Nhân, chia | 2-5 | `array_model`, `grouping_model`, `bar_model` |
| Phân số | 3-5 | `fraction_bar`, `fraction_circle`, `number_line` |
| Số thập phân | 5 | `decimal_place_value`, `number_line`, `area_model_decimal` |
| Tỉ số, phần trăm | 5 | `ratio_model`, `percent_bar`, `pie_chart` |
| Hình học trực quan | 1-5 | `geometry_shape`, `shape_attribute_highlight`, `shape_composition` |
| Đo lường | 1-5 | `ruler_measurement`, `clock_calendar`, `money_visual`, `mass_capacity_visual` |
| Chu vi, diện tích, thể tích | 2-5 | `area_grid`, `volume_cubes`, `geometry_shape` |
| Thống kê | 2-5 | `data_table`, `picture_graph`, `bar_chart`, `pie_chart` |
| Xác suất | 2-5 | `probability_experiment`, `fraction_bar`, `data_table` |

## 7. Cấu trúc JSON gợi ý khi import vào database

```json
{
  "id": "G3-FRAC-01",
  "grade": 3,
  "strand": "Số và phép tính",
  "topic": "Phân số",
  "content": "Làm quen với phân số",
  "learning_outcomes": [
    "Nhận biết được về phân số thông qua các hình ảnh trực quan.",
    "Xác định được một phần của một nhóm đồ vật bằng việc chia thành các phần đều nhau."
  ],
  "visual_templates": ["fraction_bar", "fraction_circle", "grouping_model"],
  "visual_intent": "Cho học sinh thấy phân số là phần bằng nhau của một hình hoặc một nhóm.",
  "data_params": ["numerator", "denominator", "whole_type", "group_count"],
  "source": {
    "document": "Chương trình giáo dục phổ thông môn Toán, 2018",
    "page_range": "31-33"
  }
}
```
