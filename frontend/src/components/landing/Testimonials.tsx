"use client";

import ScrollReveal from "@/components/shared/ScrollReveal";

const reviews = [
  {
    text: "Cu Bin nhà mình năm nay lên lớp 2, cứ nhìn thấy trang sách toán đầy chữ số là nhăn mặt khóc thét. Từ ngày chơi app trực quan chạm đĩa kẹo dâu tây này, cháu mê tít. Bé tự kéo chỉnh số lượng và tự cười phá lên bảo hóa ra phép tính thật dễ thở.",
    author: "Chị Mai Lan (Phụ huynh bé Hoàng Minh, Lớp 2 - Q.3, TP.HCM)",
    avatar: "👩‍👦",
  },
  {
    text: "Bản thân là giáo viên tiểu học, tôi cực kỳ coi trọng tính trực quan của đồ vật lúc dạy phân số. Việc app vẽ chiếc bánh pizza cho trẻ chạm từng phần ăn để đổi tử số mẫu số rất trực quan, giúp các con in sâu ký ức hiệu quả.",
    author: "Cô Thu Hương (Giáo viên trường Tiểu học thực nghiệm - Hà Nội)",
    avatar: "🏫",
  },
  {
    text: "Gia đình bận rộn buôn bán không có giờ dạy con học toán lớp 3. Tìm trợ lý gia sư AI có chức năng đọc lên Việt ngữ kèm tiếng kẹo dâu gõ lách cách như thế này làm bé tập trung hẳn, không cần mẹ la rầy nhắc nhở.",
    author: "Anh Quốc Bảo (Ba bé Thùy Dung, Lớp 3 - Ninh Kiều, Cần Thơ)",
    avatar: "👨‍👧",
  },
];

export default function Testimonials() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-natural-bg border-b border-natural-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-xl mx-auto mb-11">
            <h2 className="text-3xl font-serif italic text-natural-dark">
              Phản hồi ân tình của Phụ huynh
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-natural-charcoal/85 max-w-md mx-auto">
              Nghe ba mẹ và các cô giáo tiểu học thuật lại hành trình từ chỗ ghét toán chuyển sang tự
              lập chạm dứt điểm bài học.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((rv, i) => (
            <ScrollReveal key={rv.author} delay={i * 150}>
              <div className="bg-white p-6 rounded-3xl border border-natural-border text-left flex flex-col justify-between shadow-xs h-full">
                <p className="text-[12px] sm:text-[13px] text-natural-charcoal/90 italic leading-relaxed">
                  &ldquo;{rv.text}&rdquo;
                </p>
                <div className="mt-5 pt-4 border-t border-natural-bg flex items-center gap-3">
                  <span className="text-2xl bg-natural-green-tint w-10 h-10 rounded-full flex items-center justify-center border border-natural-green/10 shrink-0">
                    {rv.avatar}
                  </span>
                  <div>
                    <h5 className="text-[10px] sm:text-[11px] font-black text-natural-dark leading-none mb-1">
                      {rv.author}
                    </h5>
                    <span className="text-[9px] text-natural-green font-bold uppercase tracking-widest block">
                      Thành viên Verified
                    </span>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
