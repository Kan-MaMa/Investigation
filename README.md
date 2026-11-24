# 🔎 Disease Hunter – Become a Health Detective!

โครงงานวิทยาศาสตร์สุขภาพ: การพัฒนาเว็บไซต์นักสืบป้องกันโรค Disease Hunter เพื่อส่งเสริมความรู้และความตระหนักด้านการดูแลสุขภาพผ่านเกมและปัญญาประดิษฐ์  
**โรงเรียนสวรรค์อนันต์วิทยา**

---

## 🌟 ฟีเจอร์หลัก (Features)

1. **📚 คลังความรู้ 6 โรค (Disease Library):**
   - โรคไข้เลือดออก (Dengue)
   - โรคไข้หวัดใหญ่ (Influenza)
   - โรคเบาหวาน (Diabetes)
   - โรคความดันโลหิตสูง (Hypertension)
   - โรคอาหารเป็นพิษ (Food Poisoning)
   - โรคภูมิแพ้ (Allergy)
   - ข้อมูลเจาะลึก 6 หัวข้อมาตรฐาน: ชื่อโรค, สาเหตุ, การแพร่กระจาย/ปัจจัยเสี่ยง, อาการ, การป้องกัน, และข้อควรรู้

2. **🔎 ห้องสืบสวนโรค 3 ขั้นตอน (Investigation Room):**
   - 3 แฟ้มคดีเสมือนจริง (CASE 001, CASE 002, CASE 003) พร้อมหลักฐานหลายมิติ
   - กระบวนการคิดวิเคราะห์ 3 ขั้น: วิเคราะห์โรค → วิเคราะห์สาเหตุ/พาหะ → วางแผนป้องกัน

3. **📝 แบบทดสอบสุขภาพ (Health Quiz):**
   - แบบทดสอบวัดความรู้ 8 ข้อ พร้อมระบบเฉลยเหตุผลและคำอธิบาย
   - บันทึกคะแนนและสถิติด้วย LocalStorage

4. **🤖 Health AI Assistant: ด็อกเตอร์ฮันเตอร์ (Dr. Hunter):**
   - ขับเคลื่อนด้วย **Typhoon LLM** (`typhoon-v2.5-30b-a3b-instruct`) จาก SCB 10X
   - บุคลิกนักสืบสุขภาพ สุภาพ อบอุ่น เป็นกันเอง และรอบรู้
   - รองรับการสนทนาต่อเนื่อง (Multi-turn Chat) ถามตอบปัญหาสุขภาพและวิเคราะห์อาการ
   - รองรับคำถามด่วน (Quick Prompts) และการแสดงผล Markdown สวยงาม

5. **🏆 ระบบคะแนนและเหรียญตรา (My Score & Badges):**
   - คำนวณความแม่นยำและระดับยศนักสืบ (Rookie -> Junior -> Senior -> Master Detective)
   - ระบบปลดล็อกเหรียญตราความสำเร็จ

---

## ⚙️ การตั้งค่า Environment (.env)

ไฟล์ `.env` อยู่ที่ Root directory:
```env
TYPHOON_API_KEY=sk-EA3ijJufix4p9OyLmzRhwc6Mi5wuZwMOrDWG3LLDdjtcdsri
TYPHOON_API_URL=https://api.opentyphoon.ai/v1/chat/completions
TYPHOON_MODEL=typhoon-v2.5-30b-a3b-instruct
PORT=3000
```

---

## 🚀 วิธีการเปิดใช้งาน (How to Run)

### วิธีที่ 1: รันด้วย Node.js (แนะนำ)
เปิด PowerShell หรือ Command Prompt ที่โฟลเดอร์โปรเจกต์ แล้วพิมพ์:
```bash
npm start
# หรือ
node server.js
```
จากนั้นเปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

### วิธีที่ 2: เปิดไฟล์ HTML โดยตรง (Direct File Opening)
ดับเบิลคลิกเปิดไฟล์ `dist/index.html` หรือ `src/index.html` บนเบราว์เซอร์ (Chrome, Edge) ได้ทันที  
ระบบมีไฟล์ `env.js` รองรับค่าคอนฟิกไว้ ทำให้ระบบ AI และทุกฟังก์ชันทำงานได้สมบูรณ์แบบโดยไม่ต้องติดตั้งโปรแกรมเพิ่มเติม
