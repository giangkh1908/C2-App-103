"use client";

export default function Footer() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <footer className="bg-natural-dark text-natural-border/80 py-12 px-4 sm:px-6 lg:px-8 border-t border-natural-border/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-1">
          <span className="font-serif italic font-bold text-lg text-white">
            Toán Trực Quan AI © {new Date().getFullYear()}
          </span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            Hiểu Bản Chất - Khơi Nguồn Niềm Vui Học Tập
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-7 text-[11px] font-bold">
          <button onClick={() => scrollTo("hero")} className="hover:text-white transition-colors cursor-pointer">
            Về đầu trang
          </button>
          <button onClick={() => scrollTo("loi-ich")} className="hover:text-white transition-colors cursor-pointer">
            Lợi ích
          </button>
          <button onClick={() => scrollTo("hoc-thu")} className="hover:text-white transition-colors cursor-pointer">
            Học mô phỏng
          </button>
          <button onClick={() => scrollTo("lo-trinh")} className="hover:text-white transition-colors cursor-pointer">
            Lộ trình phổ thông
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-7 text-center">
        <p className="text-[10px] text-gray-500 leading-relaxed font-mono">
          Sản phẩm được tối ưu hoàn chỉnh, tích hợp gia sư AI phát thanh trực quan Việt ngữ bám sát
          chương trình tiểu học hiện hành.
        </p>
      </div>
    </footer>
  );
}
