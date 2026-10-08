# English Emotion Classification

Dự án phân loại cảm xúc trong câu tiếng Anh bằng DistilBERT đã fine-tune trên DAIR.AI và GoEmotions. Model trả về một nhãn cao nhất trong sáu nhãn `sadness`, `joy`, `love`, `anger`, `fear`, `surprise` cùng điểm softmax. Điểm này chưa được hiệu chuẩn như xác suất tin cậy.

## Dataset và kết quả

- **DAIR.AI Emotion:** 20.000 câu tiếng Anh từ Twitter, gán một trong sáu nhãn cảm xúc; gồm 16.000 train, 2.000 validation và 2.000 test.
- **GoEmotions:** bình luận Reddit, dữ liệu gốc có nhiều nhãn cảm xúc trên mỗi câu. Để khớp classifier sáu lớp đơn nhãn, giữ lại các câu có đúng một nhãn trong sáu lớp; còn 5.272 train, 625 validation và 638 test. Tập này không đại diện cho toàn bộ GoEmotions.

Kết quả test của checkpoint fine-tune kết hợp:

| Tập test | Số câu | Accuracy | Macro F1 |
|---|---:|---:|---:|
| DAIR.AI | 2.000 | **92,85%** | **88,18%** |
| GoEmotions đã lọc | 638 | **83,54%** | **81,99%** |

Trên cùng GoEmotions test đã lọc, baseline chỉ đạt 50,00% accuracy và 0,4737 Macro F1 trước khi fine-tune kết hợp. Hai bộ test khác miền và phân bố nhãn nên không nên so trực tiếp như cùng điều kiện. GoEmotions test baseline đã được xem trước khi chọn dữ liệu fine-tune, vì vậy so sánh trước/sau chỉ mang tính tham khảo. [Báo cáo chi tiết](docs/results/result.md).

## Chạy ứng dụng local

Yêu cầu Python 3.10 trở lên. Từ thư mục dự án trên Windows PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-api.txt
python -m uvicorn app.backend.main:app --reload --host 127.0.0.1 --port 8000
```

Mở giao diện tại <http://127.0.0.1:8000> và API docs tại <http://127.0.0.1:8000/docs>. Backend nạp checkpoint local từ `models/distilbert-emotion-mixed-v1`; để dùng thư mục model khác, đặt biến `EMOTION_MODEL_DIR`.

Hướng dẫn chi tiết ở [docs/local-app.md](docs/local-app.md).

## Cấu trúc dự án

```text
app/
  backend/       FastAPI và quy tắc nhãn
  frontend/      HTML, CSS và JavaScript
configs/         Cấu hình training tham khảo
docs/            Tài liệu, báo cáo, hình và log thí nghiệm
notebooks/       Notebook train và đánh giá trên Colab
models/          Checkpoint local; được Git ignore
requirements*.txt
```

Các tài liệu hiện có:

- [Tài liệu nền tảng ML](docs/01-ml-fundamentals.md)
- [Báo cáo kết quả](docs/results/result.md)
- [Hướng dẫn chạy API](docs/local-app.md)
