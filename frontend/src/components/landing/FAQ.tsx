"use client";

import { useState } from "react";
import ScrollReveal from "@/components/shared/ScrollReveal";

const faqs = [
  {
    q: "Bé học gia sư AI trực quan này có sợ quá ỷ lại và lười làm bài không?",
    a: "Tuyệt đối KHÔNG ba mẹ nhé! Hệ thống không giải giùm bài hay điền hộ đáp án. Nhiệm vụ chính của AI là vẽ hình ảnh hóa bản chất toán học từ đĩa kẹo, chiếc bánh pizza để kích thích tư duy, sau đó bé vẫn phải tự lập suy luận đặt bút làm trắc nghiệm.",
  },
  {
    q: "Chương trình trực quan này có bám sát đúng chuẩn của Bộ Giáo Dục VN không?",
    a: "Có, lộ trình được tinh chỉnh bám sát theo chuẩn chương trình Giáo dục Phổ thông mới. Toàn bộ các mốc học thuật lớp 1-5 từ bảng tính cộng dồn, phép nhân gộp nhóm, phân số hay chu vi diện tích đều tương thích 100% với bài học sách giáo khoa hiện hành.",
  },
  {
    q: "Lợi ích lớn nhất của việc nghe giọng kể truyền cảm hứng (Loa phát)?",
    a: "Đối với các bé lớp 1 và lớp 2, kỹ năng đọc hiểu văn bản chữ nhiều hẵng còn bỡ ngỡ. Có loa đọc bằng tiếng Việt sẽ ân cần dắt lối bé tự lập bấm nghe giảng bài mà không cảm thấy cô đơn hay cần ba mẹ kè kè bên cạnh.",
  },
  {
    q: "Làm thế nào để sử dụng thử tính năng này đạt hiệu quả cao nhất?",
    a: "Hãy để bé tự nắm quyền kiểm soát! Ba mẹ khích lệ con tự click chuột nếm trải miếng bánh pizza dâu, tự chạm nệm lót đất gieo hạt mầm mọc cây 🌱 lên màn hình. Động chạm cơ học xúc giác luôn khêu gợi vết hằn tư duy tối ưu trong trí tuệ trẻ.",
  },
];

export default function FAQ() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  return (
    <section id="cau-hoi" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-natural-border">
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-11">
            <h2 className="text-3xl font-serif italic text-natural-dark">
              Gỡ rối khúc mắc của Ba Mẹ
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-500">
              Giải đáp nhanh chóng những bận tâm phổ biến nhất khi ứng dụng mô hình gia sư tương tác
              thông minh cho các bé.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <div className="space-y-3">
            {faqs.map((faq, fIdx) => {
              const isOpen = activeFaq === fIdx;
              return (
                <div
                  key={fIdx}
                  className="border border-natural-border bg-natural-bg/30 rounded-2xl overflow-hidden transition-all text-left"
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : fIdx)}
                    className="w-full flex items-center justify-between p-5 font-semibold text-xs sm:text-sm text-natural-dark hover:bg-natural-bg transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <svg
                      className={`h-4 w-4 text-slate-400 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? "rotate-180 text-natural-green" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <div className="border-t border-natural-border bg-white p-5 text-xs text-natural-charcoal/95 leading-relaxed">
                      {faq.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
