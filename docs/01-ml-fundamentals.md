# ML fundamentals for emotion classification

Tài liệu này tóm tắt các khái niệm cần để đọc và kiểm soát một lần fine-tune DistilBERT. Nó không thay thế kết quả đo trên dataset.

## Từ AI đến language model

- **AI** là tên chung cho hệ thống thực hiện tác vụ thường cần năng lực suy luận của con người.
- **Machine Learning (ML)** học quy luật từ ví dụ thay vì chỉ dùng luật viết sẵn.
- **Deep Learning** là nhóm ML dùng mạng neural nhiều lớp.
- **NLP** xử lý ngôn ngữ tự nhiên bằng máy tính.
- **Language model** học biểu diễn hoặc quy luật của ngôn ngữ. DistilBERT là encoder pretrained; ta thêm classification head để dự đoán nhãn cảm xúc.

## Dữ liệu có nhãn và dự đoán

Mỗi sample của bài toán này gồm câu tiếng Anh (`text`) và một nhãn ground truth thuộc `sadness`, `joy`, `love`, `anger`, `fear`, `surprise`. Model nhận văn bản đã token hóa và tạo logits cho sáu lớp. Softmax đổi logits thành sáu điểm có tổng bằng 1; `argmax` chọn lớp có điểm cao nhất. Các điểm này chưa được hiệu chuẩn thành xác suất tin cậy.

Trong supervised learning, training dùng cặp input/label để cập nhật trọng số. Validation dùng để theo dõi chất lượng và chọn checkpoint. Test được giữ độc lập cho lần đánh giá cuối sau khi đã khóa lựa chọn model và hyperparameter.

## Training loop

1. Tokenizer đổi text thành token IDs và attention mask.
2. Model chạy forward pass để tạo logits.
3. Loss so logits với ground truth; Cross-Entropy là loss thường dùng cho phân loại một nhãn.
4. Backpropagation tính gradient của loss theo trọng số.
5. Optimizer dùng gradient và learning rate để cập nhật trọng số.
6. Lặp qua batches trong mỗi epoch; validation đo khả năng tổng quát hóa sau các mốc đã định.

`train()` tối ưu trọng số model để giảm loss trên training data. Learning rate, batch size, epoch và max length là hyperparameter do người chạy chọn. Một batch là nhóm sample xử lý cùng lúc; một step thường là một lần optimizer cập nhật; một epoch là một lượt qua tập training.

## Chia dữ liệu và lỗi thường gặp

- **Overfitting:** training tiếp tục tốt lên nhưng validation xấu đi; model ghi nhớ chi tiết training thay vì tổng quát hóa.
- **Underfitting:** model chưa học đủ quy luật, thường thể hiện ở chất lượng kém cả trên training lẫn validation.
- **Data leakage:** thông tin từ validation/test lọt vào quá trình fit hoặc lựa chọn model, khiến kết quả đánh giá lạc quan.
- **Seed:** giá trị khởi tạo bộ sinh số ngẫu nhiên; ghi seed giúp dễ tái lập, nhưng không đảm bảo mọi phần cứng và kernel cho kết quả bit-for-bit giống nhau.
- **Class imbalance:** số mẫu mỗi nhãn không đều; vì vậy cần xem Macro F1 và metric theo từng lớp, không chỉ Accuracy.

Validation khác test vì validation tham gia quyết định cấu hình/checkpoint. Nếu liên tục điều chỉnh theo test, test không còn là phép đo cuối độc lập.

## Cách đọc chỉ số

- **Accuracy:** phần dự đoán đúng trên tổng số sample; có thể che khuất lớp ít mẫu.
- **Precision:** trong các dự đoán thuộc một lớp, tỷ lệ đúng.
- **Recall:** trong các sample thật thuộc một lớp, tỷ lệ được tìm thấy.
- **F1:** trung bình điều hòa giữa precision và recall.
- **Macro F1:** tính F1 riêng từng lớp rồi lấy trung bình đều; đây là metric chính theo kế hoạch.
- **Confusion matrix:** cho biết nhãn thật thường bị dự đoán nhầm thành nhãn nào.

Training loss thấp tự nó chưa chứng minh model tốt. Cần đối chiếu validation metrics, theo dõi các lớp riêng biệt, kiểm tra lỗi và giữ test set cho đánh giá cuối.
