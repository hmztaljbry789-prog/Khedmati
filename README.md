<div align="center">
  <h1>KHEDMATI (خدمتي)</h1>
  <p><i>منصة الخدمات المنزلية الفلسطينية الموثوقة / Your Trusted Palestinian Home Services Companion</i></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

## 📑 About / عن المشروع

**منصة خدمتي (Khedmati)** هي تطبيق ويب تقدّمي (PWA) متكامل للخدمات المنزلية عند الطلب، مصمم لتسهيل صيانة المنازل وربط العملاء بأقرب الفنيين المؤهلين في جميع مدن فلسطين. تم بناء المشروع باستخدام بيئة العمل **MERN stack** (MongoDB, Express.js, React, Node.js) لتوفير تجربة مستخدم سريعة، تفاعلية، وآمنة.

**Khedmati (خدمتي)** is a comprehensive Progressive Web App (PWA) for on-demand home services in Palestine. It streamlines home maintenance by connecting customers with the closest qualified service providers/technicians across all major Palestinian cities. The platform is built using the **MERN stack** (MongoDB, Express.js, React, Node.js).

---

## 🌟 Key Features / المميزات الرئيسية

* **bilingual Layout (العربية والانجليزية)**: دعم كامل للغات والاتجاهات (RTL/LTR) مع خط **Cairo** المميّز وتغيير فوري بدون إعادة تحميل الصفحة.
* **Palestine Proximity Auto-Assignment (التعيين التلقائي القائم على القرب الجغرافي)**:
  * يحتوي النظام على خريطة إحداثيات لجميع مدن فلسطين الـ 16 (رام الله، نابلس، الخليل، جنين، القدس، غزة، إلخ).
  * حساب المسافة تلقائياً بين موقع الحجز وموقع الفني باستخدام **معادلة هافيرسين (Haversine Formula)** لترشيح وتعيين الفني الأقرب.
  * يملك مدير النظام (Admin) الصلاحية لتأكيد التعيين أو تعديله يدوياً.
* **Direct Real-Time Chat (نظام المحادثة المباشر)**: دردشة تفاعلية ومباشرة بين العميل والفني داخل لوحة التحكم لتنسيق العمل ومشاركة التفاصيل.
* **Progressive Web App (PWA)**: يدعم التثبيت على شاشات الهواتف والأجهزة الذكية، بالإضافة إلى التخزين المؤقت للملفات للعمل دون إنترنت.
* **Light / Dark Theme (المظهر الداكن والمضيء)**: إمكانية التبديل بسلاسة بين الوضعين الليلي والنهاري.
* **Three-Role Access Control (نظام الصلاحيات الثلاثي)**:
  * **العميل (Customer)**: تصفح الخدمات بـ 8 تصنيفات وأكثر من 300 خدمة فرعية، طلب الخدمة وتحديد موقعه بالمدينة، تتبع الحجوزات والمحادثة مع الفني.
  * **مقدم الخدمة/الفني (Provider)**: لوحة تحكم لعرض الحجوزات المؤكدة له، تفاصيل موقع العميل، إمكانية المحادثة الفورية مع العميل وتحديث حالة الطلب إلى "مكتمل".
  * **المدير (Admin)**: لوحة تحكم كاملة لإدارة الطلبات، وتأكيد تعيين الفنيين حسب الأقرب جغرافياً.
* **Dynamic Currency**: عرض الأسعار تلقائياً بالعملة المحلية الشيكل الفلسطيني (`₪`).

---

## 💻 Tech Stack / التقنيات المستخدمة

### Frontend (الواجهة الأمامية)
* React.js (Vite)
* Tailwind CSS (Styling)
* Progressive Web App (PWA) Service Workers & Manifest

### Backend (الواجهة الخلفية)
* Node.js & Express.js
* MongoDB & Mongoose ODM
* JSON Web Tokens (JWT) & bcryptjs for Authentication
* Haversine Algorithm (Proximity Matching)

---

## 🚀 Setup and Installation / التشغيل والتثبيت

### Prerequisites / المتطلبات الأساسية
* Node.js (v16 or later)
* MongoDB (Local Instance or MongoDB Atlas Cluster)

### Steps / خطوات التشغيل:

1. **Clone the repository / استنساخ المشروع**
   ```bash
   git clone https://github.com/akram98safi/Khedmati.git
   cd Khedmati
   ```

2. **Backend Setup / إعداد الواجهة الخلفية**
   ```bash
   cd server
   npm install
   ```
   * Create a `.env` file in the `server` directory:
     ```env
     PORT=5000
     CLIENT_URL=http://localhost:5173
     NODE_ENV=development
     MONGODB_URI=mongodb://localhost:27017/Khedmati
     JWT_SECRET=your_jwt_secret_key_here
     ```
   * Start the server:
     ```bash
     npm start
     ```

3. **Frontend Setup / إعداد الواجهة الأمامية**
   ```bash
   cd ../client
   npm install
   ```
   * Create a `.env` file in the `client` directory:
     ```env
     VITE_BACKEND_URL=http://localhost:5000
     VITE_PLACES_NEW_API_KEY=YOUR_GOOGLE_PLACES_API_KEY
     ```
   * Run client in development mode:
     ```bash
     npm run dev
     ```

---

## 🔑 Admin Credentials / بيانات حساب المدير

صلاحيات المدير تعتمد على الحقل `role: "admin"` في قاعدة البيانات. لإنشاء (أو ترقية) حساب المدير شغّل الأمر التالي داخل مجلد `server`:

```bash
npm run seed:admin
```

يُنشئ هذا الأمر حساب مدير بالبيانات التالية (أو يحدّث دور حساب موجود بنفس الإيميل إلى `admin`):
* **Email**: `admin@khedmati.ps`
* **Password**: `admin123`

يمكنك تخصيص البيانات عبر متغيّرات البيئة قبل التشغيل:

```bash
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=YourStrongPass npm run seed:admin
```

للتأكد من حسابات المديرين الموجودة: `npm run check:admin`.

**مهم:** بعد ترقية أي حساب إلى `admin` (سواء عبر هذا السكربت أو من صفحة إدارة المستخدمين)، يجب تسجيل الخروج ثم الدخول من جديد حتى تظهر لوحة التحكم وزر **Admin** في الشريط العلوي. ثم توجّه إلى الرابط `/admin`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
