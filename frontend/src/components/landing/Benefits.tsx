"use client";

import ScrollReveal from "@/components/shared/ScrollReveal";

const benefits = [
  {
    icon: "💡",
    title: "Hiểu bản chất trước mới làm bài",
    desc: "Thay vì bắt trẻ thuộc công thức tính diện tích khô cứng, chúng em đưa ra lưới ô để các bé vừa gieo mầm xanh, vừa ngộ ra diện tích thực ra là tổng số ô vuông.",
    tag: "Trải nghiệm trực diện",
  },
  {
    icon: "🍓",
    title: "Ẩn dụ đời thường ngọt ngào",
    desc: "Sử dụng kẹo ngọt, quả táo chín đỏ và những người bạn búp bê đáng yêu để mang toán học về gần thế giới vui thích thường ngày của trẻ.",
    tag: "Gần gũi & vui tươi",
  },
  {
    icon: "🔊",
    title: "Giọng đọc Việt ngữ ân cần",
    desc: "Được tích hợp bộ loa thông minh thuyết minh từng hoạt động, bé lớp 1 vẫn thoải mái tự lập học toán mà không cần ba mẹ kèm cặp.",
    tag: "Tập trung & Thư giãn",
  },
];

export default function Benefits() {
  return (
    <section id="loi-ich" className="py-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-natural-border">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl font-serif italic font-medium tracking-tight text-natural-dark sm:text-4xl">
              Phác họa điểm khác biệt của <br />
              <span className="text-natural-green font-semibold">Gia Sư Toán Trực Quan AI</span>
            </h2>
            <p className="mt-3 text-natural-charcoal max-w-2xl mx-auto text-sm opacity-90">
              Không sinh bài tập tự động mệt mỏi. Chúng em thắp sáng hạt mầm đam mê của bé thông qua
              học cụ trực quan.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 150}>
              <div className="p-6 rounded-3xl border border-natural-border bg-natural-bg/40 text-left flex flex-col justify-between group transition-all duration-150 ease-out hover:-translate-y-1 hover:border-natural-green h-full">
                <div>
                  <span className="text-3xl bg-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs border border-emerald-100 mb-5 inline-flex">
                    {item.icon}
                  </span>
                  <h3 className="text-base font-bold text-natural-dark group-hover:text-natural-green transition-colors">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-xs sm:text-sm text-natural-charcoal/80 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200/55 flex items-center justify-between text-xs font-bold text-natural-green">
                  <span>{item.tag}</span>
                  <span>→</span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
