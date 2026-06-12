import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { PRESET_LESSONS } from './src/data/presets.js';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini API Client to prevent crashes when GEMINI_API_KEY is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '') {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }
  return aiClient;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API: Explain Math Visually
app.post('/api/explain', async (req, res) => {
  try {
    const { domain, grade, customQuestion } = req.body;
    
    const targetDomain = domain || 'multiplication';
    const targetGrade = parseInt(grade) || 3;
    const isCustom = !!customQuestion;

    // Get Gemini client
    const ai = getGeminiClient();

    if (!ai || !isCustom) {
      // If there's no custom question, or Gemini is not available, return our outstanding presets
      const preset = PRESET_LESSONS[targetDomain];
      if (preset) {
        // Adapt grade to requested grade if possible
        const adaptedPreset = { ...preset, grade: targetGrade };
        return res.json({
          success: true,
          source: 'presets',
          data: adaptedPreset
        });
      }
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy preset phù hợp và AI chưa được kích hoạt.'
      });
    }

    // Call Gemini to generate a tailored math explanation
    console.log(`Generating visual math explanation for custom question: "${customQuestion}", Grade ${targetGrade}`);
    
    const systemPrompt = `Bạn là một AI Visual Tutor - gia sư Toán trực quan cực kỳ thân thiện và chuyên nghiệp định hướng cho học sinh tiểu học Việt Nam lứa tuổi lớp ${targetGrade}.
Quy tắc hoạt động cốt lõi của bạn:
- KHÔNG làm bài tập hộ học sinh. Bạn phải giải thích bản chất khái niệm toán học đằng sau câu hỏi.
- Luôn chuyển câu hỏi của học sinh thành một bài giảng trực quan ngắn, đễ hiểu, phù hợp với cách trẻ nhìn thế giới quanh chúng.
- Phải liên hệ với các đồ vật quen thuộc trong ví dụ đời sống: kẹo dẻo (candy), quả táo (apple), lát bánh pizza (pizza) hoặc các ô vuông lưới gạch men (grid).
- Phải trả về một cấu trúc dữ liệu JSON chính xác để frontend vẽ hình minh họa và thiết lập Mini Simulation tương tác cho bé học chạm thử.
- Mức độ phức tạp, ngôn từ của bạn phải điều chỉnh hoàn hảo theo cấp lớp đã chọn của học sinh (đang là Lớp ${targetGrade}).

Chọn một trong 4 loại hình ảnh/simulation phù hợp nhất với định dạng nội dung câu hỏi:
1) 'candy' / 'groups': Phù hợp nhất cho Phép Nhân (Multiplication) - biểu diễn số lượng nhóm bằng nhau.
2) 'apple' / 'division': Phù hợp nhất cho Phép Chia (Division) - phân phối đều quả táo vào các nhóm.
3) 'pizza' / 'pizza_slices': Phù hợp nhất cho Phân Số cơ bản (Fraction Basic) - cắt chia phần chiếc bánh pizza tròn.
4) 'grid' / 'rectangle_grid': Phù hợp nhất cho Chu Vi & Diện Tích cơ bản (Perimeter & Area Basic) - lót gạch sàn nhà hình chữ nhật.`;

    const userPrompt = `Hãy giải thích trực quan câu hỏi sau cho học sinh Lớp ${targetGrade}: "${customQuestion}"
Hãy phân tích xem câu hỏi này thuộc chủ đề nào trong 4 chủ đề sau đây và điền vào thuộc tính "domain" phù hợp:
- 'multiplication' (Phép nhân)
- 'division' (Phép chia)
- 'fraction_basic' (Phân số cơ bản)
- 'perimeter_area_basic' (Chu vi & diện tích cơ bản)

Hãy xác định các con số trong đề bài để thiết lập các phần tử visualData và mô phỏng simulationConfig phù hợp nhất (ví dụ: số lượng nhóm, số vật mỗi nhóm, tử số/mẫu số, hoặc chiều dài/rộng). Đồng thời viết 1 câu hỏi trắc nghiệm thực hành ngắn (practiceQuestion) có phản hồi cụ thể khi bé chọn ĐÚNG hoặc SAI.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            domain: {
              type: Type.STRING,
              description: "Chủ đề học thuật, phải là một trong: 'multiplication', 'division', 'fraction_basic', 'perimeter_area_basic'"
            },
            concept: {
              type: Type.STRING,
              description: "Biểu thức toán học rút gọn, ví dụ '3 x 5', '15 : 3', '2/5', hoặc 'Hình chữ nhật 6x4'"
            },
            title: {
              type: Type.STRING,
              description: "Tiêu đề ngắn xinh xắn thu hút trẻ em, ví dụ: 'Phép nhân: 3 đĩa kẹo dâu chín mọng'"
            },
            grade: {
              type: Type.INTEGER,
              description: "Mức lớp học"
            },
            shortExplanation: {
              type: Type.STRING,
              description: "Lời giải thích cực kỳ ngắn gọn, dễ hiểu, tránh thuật ngữ hàn lâm khô khan, dạy hiểu bản chất khái niệm hơn là chỉ đưa đáp án."
            },
            lifeExample: {
              type: Type.STRING,
              description: "Ví dụ lấy bối cảnh đời sống gần gũi với trẻ em, dùng các đồ vật cụ thể để kể một câu chuyện ngắn."
            },
            visualData: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Loại đồ vật trực quan, phải là một trong: 'candy', 'apple', 'pizza', 'grid'"
                },
                primaryCount: {
                  type: Type.INTEGER,
                  description: "Giá trị chính (số nhóm với phép nhân, tổng số vật với phép chia, tử số với phân số, chiều dài với hình chữ nhật)"
                },
                secondaryCount: {
                  type: Type.INTEGER,
                  description: "Giá trị phụ (số lượng mỗi nhóm với nhân, số nhóm chia với chia, mẫu số với phân số, chiều rộng với hình chữ nhật)"
                },
                totalCount: {
                  type: Type.NUMBER,
                  description: "Kết quả tính toán tổng thể (ví dụ: tích với nhân, thương với chia, giá trị phân số thập phân, diện tích với chu vi)"
                },
                groupsLabel: {
                  type: Type.STRING,
                  description: "Nhãn minh họa rõ ràng bằng Việt Ngữ cho giá trị chính"
                },
                itemsLabel: {
                  type: Type.STRING,
                  description: "Nhãn minh họa rõ ràng bằng Việt Ngữ cho giá trị phụ"
                }
              },
              required: ['type', 'primaryCount', 'secondaryCount', 'totalCount', 'groupsLabel', 'itemsLabel']
            },
            simulationConfig: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Loại simulation tương tác, phải là một trong: 'groups', 'division', 'pizza_slices', 'rectangle_grid'"
                },
                minX: { type: Type.INTEGER, description: "Giá trị tối thiểu cho thanh trượt X" },
                maxX: { type: Type.INTEGER, description: "Giá trị tối đa cho thanh trượt X" },
                minY: { type: Type.INTEGER, description: "Giá trị tối thiểu cho thanh trượt Y" },
                maxY: { type: Type.INTEGER, description: "Giá trị tối đa cho thanh trượt Y" },
                defaultX: { type: Type.INTEGER, description: "Mặc định thanh trượt X khớp với đề bài" },
                defaultY: { type: Type.INTEGER, description: "Mặc định thanh trượt Y khớp với đề bài" },
                labelX: { type: Type.STRING, description: "Nhãn hiển thị tiếng Việt phía trên thanh trượt X" },
                labelY: { type: Type.STRING, description: "Nhãn hiển thị tiếng Việt phía trên thanh trượt Y" }
              },
              required: ['type', 'minX', 'maxX', 'minY', 'maxY', 'defaultX', 'defaultY', 'labelX', 'labelY']
            },
            practiceQuestion: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                questionText: { type: Type.STRING, description: "Câu hỏi trắc nghiệm cực ngắn dựa trên khái niệm vừa được học." },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Gồm 4 tùy chọn trắc nghiệm tiếng Việt ghi rõ A, B, C, D"
                },
                correctAnswerIndex: { type: Type.INTEGER, description: "Chỉ mục đáp án đúng (từ 0 đến 3)" },
                successMessage: { type: Type.STRING, description: "Lời khen ngợi reo hò dí dỏm bằng Tiếng Việt khi bé chọn đúng!" },
                failMessage: { type: Type.STRING, description: "Lời động viên dịu dàng chỉ ra chỗ nhầm lẫn và giải thích giúp bé hiểu lại khi chọn sai." },
                hint: { type: Type.STRING, description: "Gợi ý mẹo nhỏ giúp bé suy luận đúng đắn." }
              },
              required: ['id', 'questionText', 'options', 'correctAnswerIndex', 'successMessage', 'failMessage', 'hint']
            }
          },
          required: ['domain', 'concept', 'title', 'grade', 'shortExplanation', 'lifeExample', 'visualData', 'simulationConfig', 'practiceQuestion']
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Không nhận được phản hồi chữ từ mô hình AI.");
    }

    const parsedData = JSON.parse(outputText.trim());
    return res.json({
      success: true,
      source: 'gemini-ai',
      data: parsedData
    });

  } catch (error: any) {
    console.error('Lỗi khi gọi Gemini API:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi hỏi AI gia sư toán học.',
      error: error.message || error
    });
  }
});

// Configure Vite middleware or serve static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Khởi chạy máy chủ Express ở chế độ Development (cùng với Vite middleware)...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Khởi chạy máy chủ Express ở chế độ Production (phục vụ tệp tĩnh)...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Máy chủ đang chạy tại địa chỉ http://localhost:${PORT}`);
  });
}

startServer();
