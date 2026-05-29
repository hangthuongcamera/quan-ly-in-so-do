# Prompt Hoàn Chỉnh Cho Gemini Code

## Mục Tiêu Dự Án

Tôi muốn xây dựng một **web app quản lý dịch vụ ngành may mặc** theo mô hình SaaS nội bộ, phục vụ công việc:

1. Chạy sơ đồ tự động (Auto Marker)
2. Nhảy size (Grading)
3. Thiết kế rập (Pattern Design)
4. Nhập rập (Pattern Digitizing)
5. Quản lý khách hàng
6. Quản lý công nợ
7. Xuất hóa đơn
8. Chốt công nợ

Ứng dụng phải có giao diện hiện đại, dễ sử dụng và dễ mở rộng.

---

# 1. Công Nghệ Sử Dụng

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- MVC Architecture
- REST API
- Multer (upload file)
- ExcelJS hoặc xlsx

## Frontend

- HTML + JavaScript (hoặc Vanilla JS module)
- Tailwind CSS
- Chart.js
- SPA (Single Page Application)
- Không reload trang khi chuyển menu

## UI Components

- Sidebar
- Header
- Dashboard cards
- Data tables
- Modal
- Toast notifications
- Drag & Drop upload

---

# 2. Mô Tả Nghiệp Vụ

## 2.1 Chạy Sơ Đồ Tự Động

Tôi sử dụng phần mềm entity["software","Gerber AccuMark","CAD software for apparel pattern design and marker making"].

Mỗi khách hàng có một thư mục riêng. Trong thư mục có nhiều file `.plt`.

Tôi muốn hệ thống:

- Upload file `.plt`
- Phân tích nội dung file
- Lấy:
  - Tên file
  - Khổ giấy (width)
  - Chiều dài sơ đồ (length)
  - Diện tích
- Tính tiền tự động theo bảng giá.

**Lưu ý quan trọng:** Các file `.plt` chỉ được đọc ở phía client để trích xuất thông tin (tên file, dài, rộng). Hệ thống **không upload và lưu trữ file `.plt`** trên server.

## 2.2 Nhảy Size

Nhập thủ công:

- Mô tả
- Số lượng
- Đơn giá
- Thành tiền

## 2.3 Thiết Kế Rập

Nhập thủ công.

## 2.4 Nhập Rập

Nhập thủ công.

---

# 3. Công Thức Tính Tiền

## Chạy sơ đồ

```text
amount = chargeWidth × length × pricePerMeter
```

Trong đó:
- `chargeWidth`: khổ tính tiền (160, 185 hoặc 200 cm), được xác định tự động theo quy tắc ở mục "Quy Tắc Tính Giá Chạy Sơ Đồ".
- `length`: chiều dài sơ đồ (mét).
- `pricePerMeter`: đơn giá theo mét tương ứng với từng khổ.

Lưu ý:
- Vì đơn giá đã được quy định theo từng khổ giấy, hệ thống cần lưu cả:
  - `width`: chiều rộng thực tế đọc từ file `.plt`.
  - `chargeWidth`: khổ dùng để tính tiền.
  - `unitPrice`: đơn giá VNĐ/mét.
- Thành tiền thực tế được tính theo công thức:

```text
amount = length × unitPrice
```

- Trường `chargeWidth` được lưu để phục vụ tra cứu, kiểm tra và hiển thị trên hóa đơn.

## Dịch vụ thủ công

```text
amount = quantity × unitPrice
```

---

# 4. Cấu Trúc Dữ Liệu MongoDB

## Customer

```js
{
  customerCode: String,
  companyName: String,
  contactPerson: String,
  phone: String,
  address: String,
  note: String,
  createdAt: Date
}
```

## ServiceOrder

```js
{
  customerId: ObjectId,
  serviceType: String, // marker, grading, design, digitizing
  description: String,
  quantity: Number,
  unit: String,
  width: Number,
  length: Number,
  area: Number,
  unitPrice: Number,
  amount: Number,
  status: String, // pending, completed, invoiced, paid
  orderDate: Date,
  dueDate: Date,
  note: String
}
```

## Payment

```js
{
  customerId: ObjectId,
  amount: Number,
  paymentDate: Date,
  note: String
}
```

## Invoice

```js
{
  customerId: ObjectId,
  invoiceNumber: String,
  month: Number,
  year: Number,
  totalAmount: Number,
  paidAmount: Number,
  remainingAmount: Number,
  status: String,
  createdAt: Date
}
```

## PriceSetting

```js
{
  markerRate: Number,
  gradingRate: Number,
  designRate: Number,
  digitizingRate: Number
}
```

---

# 5. Các Trang Giao Diện

## Dashboard

Hiển thị:

- Tổng khách hàng
- Tổng doanh thu tháng
- Công nợ còn lại
- Đơn hàng đang xử lý
- Biểu đồ doanh thu theo tháng
- Top 10 khách hàng doanh thu cao nhất

## Quản lý khách hàng

- Danh sách
- Tìm kiếm
- Thêm / sửa / xoá
- Lịch sử giao dịch
- Công nợ

## Chạy sơ đồ

- Chọn khách hàng
- Upload file `.plt`
- Preview kết quả
- Tính tiền tự động
- Lưu vào hệ thống
- Xuất Excel

## Dịch vụ thủ công

- Chọn loại dịch vụ
- Mô tả
- Số lượng
- Đơn giá
- Thành tiền

## Đơn hàng

- Danh sách
- Lọc theo khách hàng, dịch vụ, thời gian, trạng thái

## Công nợ

- Tổng nợ
- Đã thanh toán
- Còn lại
- Ghi nhận thanh toán

## Hóa đơn

- Tạo hóa đơn theo tháng
- In PDF

## Chốt công nợ

- Theo khách hàng
- Theo khoảng thời gian
- Xuất PDF đối soát

## Cài đặt

- Bảng giá
- Thông tin công ty

---

# 6. Thiết Kế Layout SPA

## Sidebar

- Dashboard
- Khách hàng
- Chạy sơ đồ
- Dịch vụ thủ công
- Đơn hàng
- Công nợ
- Hóa đơn
- Chốt công nợ
- Cài đặt

## Header

- Search
- Notifications
- User avatar
- Dark mode toggle

## Main Content

- Render từng page động.

---

# 7. Phong Cách Giao Diện

## Màu sắc

- Primary: #0f172a
- Accent: #38bdf8
- Background: #f8fafc
- Text: #1e293b
- Muted: #64748b
- Success: #10b981
- Warning: #f59e0b
- Danger: #ef4444

## Style

- Minimal
- Rounded-2xl
- Soft shadow
- Smooth hover
- Responsive
- Lucide Icons

---

# 8. Cấu Trúc Thư Mục

```text
quan-ly-in-so-do/
├── public/           <-- TOÀN BỘ code giao diện (frontend) sẽ nằm ở đây
│   ├── index.html
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── js/
│
├── src/              <-- TOÀN BỘ code logic (backend) MVC sẽ nằm ở đây
│   ├── app.js        (File cấu hình Express chính)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── utils/
│   └── config/
│
├── uploads/          (Thư mục chứa file upload)
├── server.js         (File khởi chạy server)
├── package.json
├── .gitignore
└── .env.example
```

---

# 9. Module Node.js Phân Tích File PLT

## Mục tiêu

Khi upload file `.plt`, hệ thống phải:

1. Đọc file.
2. Trích xuất width và length.
3. Tính area.
4. Tính amount.
5. Trả JSON.
6. Cho phép upload nhiều file.
7. Xuất Excel.

## Service

`src/services/pltParserService.js`

```javascript
async function parsePlt(filePath) {
  return {
    fileName,
    width,
    length,
    area,
    unitPrice,
    amount
  };
}

module.exports = { parsePlt };
```

## API

### POST /api/plt/upload

Upload 1 file `.plt`

### POST /api/plt/upload-multiple

Upload nhiều file `.plt`

### GET /api/plt/export-excel

Xuất Excel.

## Kết quả JSON

```json
{
  "fileName": "A001.plt",
  "width": 160,
  "length": 12.5,
  "area": 2000,
  "unitPrice": 150,
  "amount": 300000
}
```

---

# 10. Giao Diện Upload File PLT

Trang Chạy sơ đồ cần có:

- Chọn khách hàng
- Drag & Drop file `.plt`
- Chọn nhiều file
- Upload progress
- Preview table
- Tổng cộng
- Nút:
  - Upload
  - Lưu vào hệ thống
  - Xuất Excel

### Bảng Preview

- File Name
- Width
- Length
- Area
- Unit Price
- Amount

---

# 11. Backend API

## Customer API

- GET /api/customers
- POST /api/customers
- PUT /api/customers/\:id
- DELETE /api/customers/\:id

## Service Order API

- GET /api/orders
- POST /api/orders
- PUT /api/orders/\:id
- DELETE /api/orders/\:id

## Payment API

- POST /api/payments

## Invoice API

- GET /api/invoices
- POST /api/invoices/generate
- GET /api/invoices/\:id/pdf

## Reports API

- GET /api/reports/revenue-by-month
- GET /api/reports/by-customer
- GET /api/reports/by-service

---

# 12. UI Components

- AppLayout
- Sidebar
- Header
- StatsCard
- DataTable
- ConfirmDialog
- ToastNotification
- LoadingSpinner
- UploadPltModal
- CustomerFormModal
- PaymentModal
- InvoicePreview    

---

# 13. Tính Năng Nâng Cao

- Pagination
- Sorting
- Filtering
- Export Excel
- Export PDF
- Dark Mode
- Form validation
- Error handling
- Loading states
- Seed sample data

---

# 14. Dashboard Widgets

- Revenue chart (Chart.js)
- Receivable summary
- Top customers
- Recent orders

---

# 15. Yêu Cầu Coding

- Clean code
- Modular architecture
- MVC chuẩn
- RESTful API
- Async/await
- try/catch đầy đủ
- Validation dữ liệu
- Comment rõ ràng
- Dễ bảo trì và mở rộng

---

# 16. Kết Quả Mong Muốn

Hãy tạo toàn bộ source code hoàn chỉnh gồm:

1. Backend Node.js + Express + MongoDB
2. Frontend SPA với Tailwind CSS
3. Module đọc file `.plt`
4. CRUD khách hàng
5. CRUD đơn hàng
6. Quản lý công nợ
7. Tạo hóa đơn PDF
8. Chốt công nợ
9. Upload nhiều file `.plt`
10. Xuất Excel
11. Seed dữ liệu mẫu
12. README hướng dẫn cài đặt và chạy dự án

---

# 17. Kế Hoạch Triển Khai Theo 2 Giai Đoạn

## Giai Đoạn 1: Thiết Kế Hoàn Chỉnh Giao Diện SPA

Mục tiêu của giai đoạn này là xây dựng toàn bộ giao diện frontend hoàn chỉnh bằng HTML, JavaScript và Tailwind CSS, sử dụng dữ liệu mẫu (mock data), chưa cần kết nối database.

### Phạm Vi Giai Đoạn 1

1.  [x] Tạo cấu trúc thư mục frontend.
2.  [x] Thiết kế App Layout.
3.  [x] Tạo Sidebar và Header.
4.  [x] Tạo Router SPA.
5.  Thiết kế tất cả các trang:
    -   [x] Dashboard
    -   [x] Khách hàng
    -   [x] Chạy sơ đồ
    -   [x] Dịch vụ thủ công
    -   [x] Đơn hàng (Orders)
    -   [x] Công nợ (Debts)
    -   [ ] Hóa đơn (Invoices)
    -   [x] Chốt công nợ (Debt Settlement)
    -   [x] Cài đặt bảng giá (Pricing Settings)
6.  Tạo các UI Components:
    -   [x] DataTable
    -   [x] Modal
    -   [x] Toast
    -   [x] StatsCard
    -   [x] ConfirmDialog
    -   [x] LoadingSpinner
7.  [x] Tạo mock data để hiển thị.
8.  [x] Dashboard với Chart.js.
9.  [x] Responsive và Dark Mode. (Đã có chức năng cơ bản)

### Kết Quả Mong Muốn Giai Đoạn 1

- Giao diện hoàn chỉnh 100%.
- Chuyển trang không reload.
- Form và bảng hoạt động với dữ liệu giả.
- Có thể demo toàn bộ hệ thống mà chưa cần backend.

### Yêu Cầu Cho Gemini Code

Hãy thực hiện từng bước sau:
1.  [x] Tạo cấu trúc thư mục frontend.
2.  [x] Tạo App Layout.
3.  [x] Tạo SPA Router.
4.  [x] Tạo UI Components. (DataTable, Modal đã xong)
5.  [x] Tạo từng page. (Dashboard, Customers, Marker đã xong)
6.  [x] Tạo mock data.
7.  [x] Hoàn thiện responsive và dark mode. (Cơ bản đã có)

Mỗi bước cần cung cấp:
- Mã nguồn đầy đủ.
- Giải thích ngắn gọn.
- Cách chạy thử.

---

## Giai Đoạn 2: Xây Dựng Backend Và Tích Hợp Chức Năng

Mục tiêu của giai đoạn này là xây dựng backend Node.js + MongoDB và kết nối toàn bộ giao diện ở Giai đoạn 1.

### Phạm Vi Giai Đoạn 2

1.  [x] Tạo cấu trúc thư mục backend.
2.  [x] Cài đặt dependencies.
3.  [x] Kết nối MongoDB.
4.  [x] Tạo Mongoose Models. (Customer model đã xong)
5.  [x] Tạo Controllers, Services, Routes. (Customer API đã xong)
6.  [x] CRUD khách hàng.
7.  [x] Kết nối frontend với API khách hàng.
8.  [x] CRUD đơn hàng. (Tạo, Đọc, Xóa, Xem chi tiết đã xong)
9.  [x] Quản lý công nợ.
10. [ ] Tạo hóa đơn PDF.
11. [x] Chốt công nợ.
12. [x] Cài đặt bảng giá động.
13. [ ] Module phân tích file `.plt`.
14. [ ] Upload nhiều file `.plt`.
15. [ ] Xuất Excel.
16. [ ] API lưu kết quả quét thành một ServiceOrder.
17. [ ] Seed dữ liệu mẫu.
18. [ ] Viết README.

### Kết Quả Mong Muốn Giai Đoạn 2

- Backend hoàn chỉnh.
- Kết nối API với frontend.
- Đọc file `.plt` và tính tiền tự động.
- Tạo đơn hàng tự động.
- Quản lý công nợ và hóa đơn.

### Yêu Cầu Cho Gemini Code

Hãy thực hiện từng bước sau:
1.  [x] Tạo backend structure.
2.  [x] Tạo models. (Customer)
3.  [x] Tạo routes/controllers/services. (Customer)
4.  [x] Tích hợp MongoDB.
5.  [x] Kết nối frontend. (Customer page)
6.  [ ] Tạo module parser `.plt`.
7.  [ ] Tạo API upload và export Excel.
8.  [ ] Seed dữ liệu.
9.  [ ] Viết README.

Mỗi bước cần cung cấp:
- Mã nguồn đầy đủ.
- Giải thích ngắn gọn.
- Hướng dẫn test.

---

# 18. Quy Tắc Tính Giá Chạy Sơ Đồ

## Phân Loại Khách Hàng và Cách Tính Phí

Trong nghiệp vụ chạy sơ đồ, có 2 nhóm khách hàng với cách tính phí khác nhau:

1.  **Nhóm 1: Khách hàng tự cung cấp file `.plt`**
    -   **Mô tả:** Khách hàng đã có sẵn file sơ đồ và chỉ cần dịch vụ in.
    -   **Cách tính phí:** Chỉ tính tiền in dựa trên khổ giấy và chiều dài sơ đồ. (`amount = length × unitPrice`).

2.  **Nhóm 2: Dịch vụ chạy sơ đồ cho khách**
    -   **Mô tả:** Khách hàng cung cấp rập, và tôi (người dùng phần mềm) sẽ thực hiện việc đi sơ đồ để tạo ra file `.plt`.
    -   **Cách tính phí:** Bao gồm **tiền công chạy sơ đồ** CỘNG VỚI **tiền in sơ đồ**.
        -   `total_amount = marker_creation_fee + (length × unitPrice)`
        -   Phí chạy sơ đồ (`marker_creation_fee`) sẽ được định nghĩa trong trang Cài đặt.

## Bảng Giá Theo Khổ Giấy

Bảng giá phải được quản lý động trong trang **Cài đặt > Bảng giá**, cho phép người dùng thay đổi đơn giá bất kỳ lúc nào mà không cần sửa mã nguồn.

| Khổ tính tiền | Đơn giá mặc định (VNĐ/mét dài) |
|-------------:|------------------------------:|
| 160 cm       | 10.000                        |
| 185 cm       | 12.000                        |
| 200 cm       | 15.000                        |

### Yêu Cầu Chức Năng

- Người dùng có thể chỉnh sửa đơn giá cho từng khổ giấy.
- Dữ liệu được lưu vào MongoDB.
- Khi tính tiền file `.plt`, hệ thống luôn lấy giá mới nhất từ cơ sở dữ liệu.
- Không hard-code đơn giá trong source code.
- Cho phép bổ sung thêm khổ giấy mới trong tương lai.

### Schema PriceSetting Đề Xuất

```javascript
{
  markerPricing: [
    {
      chargeWidth: 160,
      maxWidth: 159.99,
      unitPrice: 10000,
      isActive: true
    },
    {
      chargeWidth: 185,
      maxWidth: 169.99,
      unitPrice: 12000,
      isActive: true
    },
    {
      chargeWidth: 200,
      maxWidth: 999,
      unitPrice: 15000,
      isActive: true
    }
  ],
  markerCreationFee: 50000, // Phí dịch vụ chạy sơ đồ (ví dụ)
  gradingRate: Number,
  designRate: Number,
  digitizingRate: Number
}
```

### API Bảng Giá

- GET /api/settings/pricing
- PUT /api/settings/pricing

### Giao Diện Cài Đặt Bảng Giá

Trang Cài đặt cần có bảng:
- Khổ tính tiền
- Chiều rộng tối đa
- Đơn giá (VNĐ/mét)
- Trạng thái hoạt động
- Nút Lưu

### Logic Tính Giá

Khi parse file `.plt`:
1. Đọc `width`.
2. Lấy cấu hình `markerPricing` từ MongoDB.
3. Tìm dòng phù hợp theo `maxWidth`.
4. Lấy `chargeWidth` và `unitPrice`.
5. Tính `amount = length × unitPrice`.

### Ví Dụ

Nếu người dùng sửa giá khổ 160 từ 10.000 thành 11.000 VNĐ/m, mọi file `.plt` mới có `width < 160` sẽ tự động áp dụng đơn giá 11.000 VNĐ/m.

## Quy Tắc Xác Định Khổ Tính Tiền

Dựa vào chiều rộng thực tế (`width`) đọc được từ file `.plt`:

```javascript
function getMarkerPricing(width) {
  if (width < 160) {
    return {
      chargeWidth: 160,
      unitPrice: 10000
    };
  }

  if (width < 170) {
    return {
      chargeWidth: 185,
      unitPrice: 12000
    };
  }

  return {
    chargeWidth: 200,
    unitPrice: 15000
  };
}
```

## Công Thức Tính Thành Tiền

```text
amount = chargeWidth × length × pricePerMeter
```

Trong triển khai thực tế, vì `unitPrice` đã là đơn giá theo mét cho từng khổ, hệ thống sẽ tính ngắn gọn:

```text
amount = length × unitPrice
```

Trong đó:
- `length`: chiều dài sơ đồ (mét)
- `unitPrice`: đơn giá theo khổ tính tiền

## Ví Dụ

### Ví dụ 1
- Width đọc từ PLT: 158 cm
- Length: 12.5 m
- Khổ tính tiền: 160 cm
- Đơn giá: 10.000 VNĐ/m
- Thành tiền: 12.5 × 10.000 = 125.000 VNĐ

### Ví dụ 2
- Width đọc từ PLT: 165 cm
- Length: 8.2 m
- Khổ tính tiền: 185 cm
- Đơn giá: 12.000 VNĐ/m
- Thành tiền: 8.2 × 12.000 = 98.400 VNĐ

### Ví dụ 3
- Width đọc từ PLT: 178 cm
- Length: 15 m
- Khổ tính tiền: 200 cm
- Đơn giá: 15.000 VNĐ/m
- Thành tiền: 15 × 15.000 = 225.000 VNĐ

## Dữ Liệu Lưu Trong ServiceOrder

```javascript
{
  serviceType: 'marker',
  description: 'Auto Marker - file A001.plt',
  width: 158,
  chargeWidth: 160,
  length: 12.5,
  quantity: 12.5,
  unit: 'm',
  unitPrice: 10000,
  amount: 125000,
  fileName: 'A001.plt'
}
```

## Quy Trình Sau Khi Quét File PLT

1. Người dùng chọn khách hàng.
2. Upload một hoặc nhiều file `.plt`.
3. Hệ thống đọc `width` và `length` từ từng file.
4. Xác định `chargeWidth` và `unitPrice` theo bảng giá.
5. Tính `amount = length × unitPrice` cho từng file.
6. Hiển thị bảng preview toàn bộ các file đã quét.
7. Khi nhấn "Lưu vào hệ thống", tất cả file đã quét sẽ được gom lại và tạo thành **một ServiceOrder duy nhất** thuộc khách hàng đã chọn.
8. Trong ServiceOrder này, mỗi file `.plt` sẽ được lưu thành một dòng chi tiết trong mảng `items`.
9. Trường `totalAmount` của ServiceOrder bằng tổng `amount` của tất cả file.

### Cấu Trúc ServiceOrder Cho Nhiều File PLT

```javascript
{
  customerId: '...',
  serviceType: 'marker',
  description: 'Auto Marker batch upload',
  orderDate: new Date(),
  status: 'completed',
  items: [
    {
      fileName: 'A001.plt',
      width: 158,
      chargeWidth: 160,
      length: 12.5,
      quantity: 12.5,
      unit: 'm',
      unitPrice: 10000,
      amount: 125000
    },
    {
      fileName: 'A002.plt',
      width: 165,
      chargeWidth: 185,
      length: 8.2,
      quantity: 8.2,
      unit: 'm',
      unitPrice: 12000,
      amount: 139400
    }
  ],
  totalAmount: 223400,
  note: 'Generated automatically from PLT files'
}
```

### Lợi Ích Của Cách Gom Thành Một ServiceOrder

- Mỗi lần upload tương ứng với một đơn hàng.
- Dễ theo dõi, chỉnh sửa và xuất hóa đơn.
- Có thể xem chi tiết từng file trong đơn hàng.
- Thuận tiện tính công nợ theo từng đợt gửi file.


## API Lưu Đơn Hàng Tự Động

### POST /api/plt/save-to-orders

Request:
```json
{
  "customerId": "...",
  "items": [
    {
      "fileName": "A001.plt",
      "width": 158,
      "chargeWidth": 160,
      "length": 12.5,
      "unitPrice": 10000,
      "amount": 125000
    }
  ]
}
```

Kết quả:
- Tạo nhiều `ServiceOrder` với `serviceType = 'marker'`.
- Gắn đúng `customerId`.
- Trả về danh sách đơn hàng đã tạo.

---

# 19. Quy Tắc Hoạt Động Dành Cho Gemini

- **BẮT BUỘC:** Mỗi lần thực hiện xong một tính năng hoặc một phần công việc, Gemini phải tự động cập nhật tiến trình (đánh dấu `[x]` vào các checkbox tương ứng ở mục Giai Đoạn 1 và Giai Đoạn 2) trực tiếp vào file `prompt_quan_ly_dich_vu_in_so_do.md` này.
