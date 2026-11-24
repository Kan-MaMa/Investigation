// ==========================================
// Disease Hunter - Main JavaScript Application
// ขับเคลื่อนด้วย Typhoon LLM & LocalStorage
// ==========================================

// ------------------------------------------
// 0. การโหลดการตั้งค่า Environment (.env / env.js)
// ------------------------------------------
window.ENV = window.ENV || {
  TYPHOON_API_KEY: 'sk-EA3ijJufix4p9OyLmzRhwc6Mi5wuZwMOrDWG3LLDdjtcdsri',
  TYPHOON_API_URL: 'https://api.opentyphoon.ai/v1/chat/completions',
  TYPHOON_MODEL: 'typhoon-v2.5-30b-a3b-instruct'
};

async function loadEnvConfig() {
  try {
    const res = await fetch('.env');
    if (res.ok) {
      const text = await res.text();
      text.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const idx = trimmed.indexOf('=');
          if (idx > 0) {
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (key) window.ENV[key] = val;
          }
        }
      });
      console.log('✅ โหลดการตั้งค่าจาก .env สำเร็จ');
    }
  } catch {
    // กรณีเปิดผ่าน file:// หรือไม่มี .env จะใช้ค่าจาก env.js อัตโนมัติ
  }
}

function getEnv(key, defaultVal) {
  return (window.ENV && window.ENV[key]) ? window.ENV[key] : defaultVal;
}

// ==========================================
// 1. ระบบเปลี่ยนหน้า (SPA Navigation)
// ==========================================
function navigateTo(pageId) {
  document.querySelectorAll('.page').forEach(sec => sec.classList.remove('active'));
  const target = document.getElementById(`page-${pageId}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('#mainNav a').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  if (pageId === 'score') updateScoreDashboard();
  if (pageId === 'home') updateHomeScore();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// 2. ฐานข้อมูลโรค 6 โรค (ครบ 6 หัวข้อ)
// ==========================================
const DISEASES_DATA = [
  {
    id: 'dengue',
    name: 'โรคไข้เลือดออก (Dengue)',
    icon: '🦟',
    type: 'infectious',
    typeLabel: 'โรคติดต่อนำโดยแมลง',
    cause: 'เกิดจากเชื้อไวรัสเดงกี (Dengue virus) ซึ่งมี 4 สายพันธุ์ (DENV-1 ถึง DENV-4)',
    spread: 'ติดต่อผ่านการกัดของยุงลายตัวเมีย โดยเฉพาะยุงลายบ้าน (Aedes aegypti) ที่มักออกหากินในเวลากลางวัน',
    symptom: 'ไข้สูงลอยเฉียบพลัน ปวดศีรษะ ปวดกระบอกตา ปวดเมื่อยกล้ามเนื้อ คลื่นไส้ อาเจียน และอาจมีจุดเลือดออกหรืออาการช็อกเมื่อไข้ลด',
    prevent: 'กำจัดแหล่งน้ำขัง ปิดฝาภาชนะ เปลี่ยนน้ำแจกันทุก 7 วัน ใส่ทรายอะเบท และทายากันยุงหรือนอนในมุ้ง',
    note: 'ไม่ควรซื้อยาแก้ปวดกลุ่ม NSAIDs เช่น แอสไพริน หรือไอบูโพรเฟน รับประทานเอง เพราะอาจทำให้เลือดออกง่ายขึ้น'
  },
  {
    id: 'influenza',
    name: 'โรคไข้หวัดใหญ่ (Influenza)',
    icon: '🤧',
    type: 'infectious',
    typeLabel: 'โรคติดต่อระบบทางเดินหายใจ',
    cause: 'เกิดจากเชื้อไวรัสไข้หวัดใหญ่ (Influenza virus) เช่น ชนิด A และ B',
    spread: 'แพร่กระจายผ่านละอองฝอยจากการไอ จาม หรือพูดคุย และการสัมผัสสิ่งของที่ปนเปื้อนสารคัดหลั่งแล้วขยี้ตาหรือแคะจมูก',
    symptom: 'มีไข้สูงกะทันหัน หนาวสั่น ปวดศีรษะ ปวดเมื่อยตามตัว อ่อนเพลีย ไอแห้ง หรือเจ็บคอ',
    prevent: 'ล้างมือบ่อย ๆ สวมหน้ากากอนามัยเมื่ออยู่ในที่แออัดหรือมีอาการป่วย หลีกเลี่ยงการใช้ของร่วมกัน และฉีดวัคซีนป้องกันไข้หวัดใหญ่ประจำปี',
    note: 'มักมีอาการรุนแรงและปวดเมื่อยกล้ามเนื้อมากกว่าไข้หวัดทั่วไป และอาจเกิดภาวะแทรกซ้อนอย่างปอดอักเสบได้'
  },
  {
    id: 'diabetes',
    name: 'โรคเบาหวาน (Diabetes)',
    icon: '🩸',
    type: 'non-infectious',
    typeLabel: 'โรคไม่ติดต่อเรื้อรัง (NCDs)',
    cause: 'เกิดจากตับอ่อนผลิตฮอร์โมนอินซูลินได้ไม่เพียงพอ หรือร่างกายดื้อต่ออินซูลิน ทำให้ระดับน้ำตาลในเลือดสูงกว่าปกติ',
    spread: 'ไม่ใช่โรคติดต่อ แต่มีปัจจัยเสี่ยงจากพันธุกรรม ภาวะน้ำหนักเกิน ขาดการออกกำลังกาย และพฤติกรรมการบริโภคน้ำตาลหรือแป้งขัดสีมากเกินไป',
    symptom: 'ปัสสาวะบ่อย กระหายน้ำมาก หิวบ่อย น้ำหนักลดโดยไม่ทราบสาเหตุ อ่อนเพลีย หรือแผลหายช้า',
    prevent: 'ควบคุมน้ำหนักให้อยู่ในเกณฑ์ เลือกรับประทานอาหารที่มีใยอาหาร ลดหวานมันเค็ม ออกกำลังกายสม่ำเสมอ และตรวจระดับน้ำตาลในเลือด',
    note: 'หากปล่อยให้ระดับน้ำตาลในเลือดสูงเป็นเวลานาน อาจส่งผลต่อหลอดเลือด ดวงตา ไต และระบบประสาท'
  },
  {
    id: 'hypertension',
    name: 'โรคความดันโลหิตสูง (Hypertension)',
    icon: '❤️',
    type: 'non-infectious',
    typeLabel: 'โรคไม่ติดต่อเรื้อรัง (NCDs)',
    cause: 'เกิดจากแรงดันของเลือดที่กระทบต่อผนังหลอดเลือดสูงต่อเนื่อง มักสัมพันธ์กับหลายปัจจัยร่วมกัน เช่น อายุ พันธุกรรม และพฤติกรรม',
    spread: 'ไม่ใช่โรคติดต่อ ปัจจัยเสี่ยงสำคัญคือ การรับประทานอาหารรสเค็มจัด (โซเดียมสูง) ภาวะอ้วน ความเครียดสะสม การสูบบุหรี่ และการดื่มแอลกอฮอล์',
    symptom: 'ส่วนใหญ่ไม่มีอาการแสดงชัดเจนในระยะแรก บางรายอาจมีอาการปวดท้ายทอย มึนงง เวียนศีรษะ หรือใจสั่น',
    prevent: 'ลดอาหารเค็มและเครื่องปรุงรสจัด เพิ่มผักผลไม้ ออกกำลังกายสม่ำเสมอ จัดการความเครียด และหมั่นตรวจวัดความดันโลหิต',
    note: 'มักถูกเรียกว่า "เพชฌฆาตเงียบ" เพราะผู้ป่วยจำนวนมากไม่รู้ตัวจนกระทั่งเกิดภาวะแทรกซ้อนต่อหัวใจ สมอง หรือไต'
  },
  {
    id: 'food-poisoning',
    name: 'โรคอาหารเป็นพิษ (Food Poisoning)',
    icon: '🍱',
    type: 'infectious',
    typeLabel: 'โรคระบบทางเดินอาหาร / สิ่งแวดล้อม',
    cause: 'เกิดจากการรับประทานอาหารหรือน้ำที่ปนเปื้อนเชื้อแบคทีเรีย ไวรัส ปรสิต หรือสารพิษที่สร้างจากจุลินทรีย์',
    spread: 'ติดต่อผ่านการกินอาหารดิบหรือสุก ๆ ดิบ ๆ อาหารค้างคืนที่เก็บไม่เหมาะสม การใช้อุปกรณ์ปนเปื้อน หรือไม่ล้างมือก่อนหยิบจับอาหาร',
    symptom: 'คลื่นไส้ อาเจียน ปวดท้องบิด ถ่ายเหลวหรือถ่ายเป็นน้ำ อาจมีไข้หรือปวดศีรษะร่วมด้วย',
    prevent: 'ยึดหลัก "กินร้อน ช้อนกลาง ล้างมือ" ปรุงอาหารให้สุกทั่วถึง เก็บอาหารในอุณหภูมิที่เหมาะสม และดื่มน้ำสะอาด',
    note: 'ควรจิบสารละลายเกลือแร่ (ORS) เพื่อชดเชยน้ำและเกลือแร่ หากถ่ายเป็นมูกเลือด มีไข้สูง หรืออาเจียนจนกินน้ำไม่ได้ควรรีบพบแพทย์'
  },
  {
    id: 'allergy',
    name: 'โรคภูมิแพ้ (Allergy)',
    icon: '🌼',
    type: 'non-infectious',
    typeLabel: 'ภูมิคุ้มกัน / สิ่งแวดล้อม',
    cause: 'เกิดจากระบบภูมิคุ้มกันของร่างกายตอบสนองไวผิดปกติต่อสารก่อภูมิแพ้ (Allergens) ที่โดยทั่วไปไม่เป็นอันตรายต่อคนส่วนใหญ่',
    spread: 'ไม่ใช่โรคติดต่อ มักมีแนวโน้มทางพันธุกรรมร่วมกับสิ่งกระตุ้น เช่น ไรฝุ่น เกสรดอกไม้ ขนสัตว์ เชื้อรา อาหารทะเล หรือนมวัว',
    symptom: 'จาม คัดจมูก น้ำมูกใส คันตาหรือคันผิวหนัง มีผื่นลมพิษ หรือในบางรายอาจมีอาการหอบหืดหายใจลำบาก',
    prevent: 'สังเกตและหลีกเลี่ยงสารก่อภูมิแพ้ที่กระตุ้นอาการ ทำความสะอาดที่นอนและห้องพักสม่ำเสมอ ใช้เครื่องฟอกอากาศหรือผ้าคลุมกันไรฝุ่น',
    note: 'ควรพกยาตามที่แพทย์แนะนำหากมีประวัติแพ้รุนแรง และสังเกตอาการบวมบริเวณใบหน้าหรือหายใจติดขัดซึ่งเป็นสัญญาณอันตราย'
  }
];

let currentDiseaseFilter = 'all';

function renderDiseases() {
  const grid = document.getElementById('diseaseGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = DISEASES_DATA.filter(d => {
    if (currentDiseaseFilter === 'all') return true;
    return d.type === currentDiseaseFilter;
  });

  filtered.forEach(disease => {
    const card = document.createElement('div');
    card.className = 'card clickable disease-card';
    card.onclick = () => openDiseaseModal(disease.id);

    card.innerHTML = `
      <span class="tag">${disease.typeLabel}</span>
      <div class="big-icon" style="margin-top:10px;">${disease.icon}</div>
      <h3>${disease.name}</h3>
      <p><strong>สาเหตุย่อ:</strong> ${disease.cause}</p>
      <p style="margin-top:8px; color:var(--mint); font-weight:600;">คลิกเพื่อดูข้อมูลครบ 6 หัวข้อ →</p>
    `;
    grid.appendChild(card);
  });
}

function filterDiseases(type, btnElement) {
  currentDiseaseFilter = type;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btnElement) btnElement.classList.add('active');
  renderDiseases();
}

function openDiseaseModal(id) {
  const d = DISEASES_DATA.find(item => item.id === id);
  if (!d) return;

  document.getElementById('modalIcon').textContent = d.icon;
  document.getElementById('modalCategory').textContent = d.typeLabel;
  document.getElementById('modalTitle').textContent = d.name;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-section">
      <h4>🏷️ 1. ชื่อโรค</h4>
      <p>${d.name}</p>
    </div>
    <div class="modal-section">
      <h4>🦠 2. สาเหตุของโรค</h4>
      <p>${d.cause}</p>
    </div>
    <div class="modal-section">
      <h4>🔄 3. วิธีการแพร่กระจายหรือปัจจัยเสี่ยง</h4>
      <p>${d.spread}</p>
    </div>
    <div class="modal-section">
      <h4>🤒 4. อาการสำคัญ</h4>
      <p>${d.symptom}</p>
    </div>
    <div class="modal-section">
      <h4>🛡️ 5. วิธีป้องกัน</h4>
      <p>${d.prevent}</p>
    </div>
    <div class="modal-section">
      <h4>💡 6. ข้อควรรู้</h4>
      <p>${d.note}</p>
    </div>
  `;

  document.getElementById('diseaseModal').classList.add('open');
}

function closeDiseaseModal(event) {
  if (!event || event.target.id === 'diseaseModal') {
    document.getElementById('diseaseModal').classList.remove('open');
  }
}

// ==========================================
// 3. ระบบบันทึกคะแนนและสถานะ (LocalStorage)
// ==========================================
const STORAGE_KEY = 'diseaseHunterState_v1';

function getDefaultState() {
  return {
    totalScore: 0,
    quizCount: 0,
    bestQuizScore: 0,
    totalCorrectAnswers: 0,
    totalAnsweredQuestions: 0,
    solvedCases: [],
    history: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch {
    return getDefaultState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addPoints(points) {
  const state = loadState();
  state.totalScore += points;
  saveState(state);
  updateHomeScore();
}

function getDetectiveRank(score) {
  if (score >= 60) return 'Master Health Detective 🏅';
  if (score >= 35) return 'Senior Health Detective 🔍';
  if (score >= 15) return 'Junior Health Detective 🕵️';
  return 'Rookie Detective 🌱';
}

function updateHomeScore() {
  const state = loadState();
  const scoreEl = document.getElementById('homeScore');
  const rankEl = document.getElementById('homeRank');
  if (scoreEl) scoreEl.textContent = state.totalScore;
  if (rankEl) rankEl.textContent = getDetectiveRank(state.totalScore);
}

function updateScoreDashboard() {
  const state = loadState();

  document.getElementById('totalScore').textContent = state.totalScore;
  document.getElementById('quizCount').textContent = state.quizCount;
  document.getElementById('bestScore').textContent = state.bestQuizScore;

  const accuracy = state.totalAnsweredQuestions > 0
    ? Math.round((state.totalCorrectAnswers / state.totalAnsweredQuestions) * 100)
    : 0;
  document.getElementById('accuracyRate').textContent = `${accuracy}%`;

  // เหรียญตรา (Badges)
  const badges = [
    {
      title: '🕵️ Rookie Detective',
      desc: 'เริ่มต้นสะสมคะแนนอย่างน้อย 10 คะแนน',
      unlocked: state.totalScore >= 10
    },
    {
      title: '🔍 Case Solver',
      desc: 'ไขแฟ้มคดีสืบสวนสำเร็จอย่างน้อย 1 คดี',
      unlocked: state.solvedCases.length >= 1
    },
    {
      title: '🏅 Master Investigator',
      desc: 'ไขแฟ้มคดีสืบสวนครบทั้ง 3 คดี',
      unlocked: state.solvedCases.length >= 3
    },
    {
      title: '🎓 Health Scholar',
      desc: 'สะสมคะแนนรวมได้ถึง 40 คะแนนขึ้นไป',
      unlocked: state.totalScore >= 40
    }
  ];

  const badgesGrid = document.getElementById('badgesGrid');
  badgesGrid.innerHTML = badges.map(b => `
    <div class="badge-item ${b.unlocked ? 'unlocked' : ''}">
      <strong>${b.title}</strong>
      <p style="font-size:13px; color:var(--muted); margin-top:4px;">${b.desc}</p>
      <small style="display:block; margin-top:6px; font-weight:600; color:${b.unlocked ? '#0e7a66' : 'var(--muted)'};">
        ${b.unlocked ? '✓ ปลดล็อกแล้ว' : '🔒 ยังไม่ปลดล็อก'}
      </small>
    </div>
  `).join('');

  // สรุปผลและคำแนะนำทบทวน
  const summaryEl = document.getElementById('summary');
  const adviceEl = document.getElementById('reviewAdvice');

  if (state.totalScore === 0 && state.quizCount === 0) {
    summaryEl.textContent = 'คุณยังไม่มีประวัติการทำภารกิจ ลองเข้าสู่ห้องสืบสวนหรือทำแบบทดสอบเพื่อเริ่มต้นสะสมคะแนน!';
    adviceEl.textContent = '';
  } else {
    summaryEl.textContent = `ยศปัจจุบัน: ${getDetectiveRank(state.totalScore)} • ไขคดีสำเร็จ ${state.solvedCases.length}/${CASES_DATA.length} คดี • ทำแบบทดสอบแล้ว ${state.quizCount} ครั้ง`;
    if (accuracy >= 80) {
      adviceEl.textContent = 'คำแนะนำ: ยอดเยี่ยมมาก! ความแม่นยำสูง ลองท้าทายแฟ้มคดีระดับกลาง-ยาก หรือปรึกษาเพิ่มเติมกับด็อกเตอร์ฮันเตอร์ใน AI Chat';
    } else {
      adviceEl.textContent = 'คำแนะนำ: ลองกลับไปทบทวนข้อมูล 6 โรคในหน้า Disease Library และสังเกตหลักฐานในแต่ละแฟ้มคดีให้ครบถ้วนก่อนเลือกคำตอบ';
    }
  }

  // ประวัติการทำแบบทดสอบ
  const historyList = document.getElementById('historyList');
  if (!state.history.length) {
    historyList.innerHTML = '<p style="color:var(--muted); font-size:14px;">ยังไม่มีประวัติการทำแบบทดสอบ</p>';
  } else {
    historyList.innerHTML = state.history.slice().reverse().map(item => `
      <div class="history-item">
        <span>📝 ทำแบบทดสอบเมื่อ ${item.date}</span>
        <strong>ได้ ${item.score} / ${item.maxScore} ข้อ (+${item.bonusPoints} คะแนน)</strong>
      </div>
    `).join('');
  }
}

function openResetModal() {
  document.getElementById('resetConfirmModal').classList.add('open');
}

function closeResetModal() {
  document.getElementById('resetConfirmModal').classList.remove('open');
}

function confirmResetScores() {
  saveState(getDefaultState());
  closeResetModal();
  renderCaseSelector();
  resetCurrentCase();
  updateHomeScore();
  updateScoreDashboard();
}

// ==========================================
// 4. เกมสืบสวนโรคแบบหลายเหตุผลและ 3 ขั้นตอน
// ==========================================
const CASES_DATA = [
  {
    id: 'case-001',
    code: 'CASE 001',
    difficulty: 'ระดับเริ่มต้น (Easy)',
    title: 'ปริศนายุงลายในโรงเรียน',
    summary: 'มีนักเรียนห้อง ม.4/2 จำนวน 4 คน เริ่มมีอาการไข้สูงและปวดเมื่อยพร้อมกันในช่วงสัปดาห์ที่ผ่านมา',
    evidences: [
      {
        label: 'หลักฐานที่ 1: อาการผู้ป่วย',
        detail: 'นักเรียนมีไข้สูงลอย 39–40°C ปวดศีรษะ ปวดกระบอกตา และปวดเมื่อยตามตัว โดยไม่มีอาการไอหรือน้ำมูกเด่น'
      },
      {
        label: 'หลักฐานที่ 2: สิ่งแวดล้อมรอบโรงเรียน',
        detail: 'หลังอาคารเรียนมีถังน้ำเปิดฝา จานรองกระถางต้นไม้ และยางรถยนต์เก่าที่มีน้ำขังและพบลูกน้ำยุงลาย'
      },
      {
        label: 'หลักฐานที่ 3: ช่วงเวลาที่เกิดอาการ',
        detail: 'นักเรียนมักนั่งอ่านหนังสือใต้ร่มไม้และสนามหน้าอาคารช่วงเวลา 09.00–15.00 น. โดยไม่ได้ทายากันยุง'
      }
    ],
    steps: [
      {
        question: 'ขั้นที่ 1: จากอาการและหลักฐานทั้งหมด นักสืบสงสัยว่าเกิดโรคใด?',
        options: [
          'โรคไข้เลือดออก (Dengue)',
          'โรคเบาหวาน (Diabetes)',
          'โรคความดันโลหิตสูง (Hypertension)',
          'โรคภูมิแพ้เกสรดอกไม้ (Allergy)'
        ],
        correctIndex: 0,
        explanation: 'ไข้สูงเฉียบพลัน ปวดศีรษะ ปวดกระบอกตา ปวดเมื่อย และไม่มีอาการหวัดทางเดินหายใจ สอดคล้องกับโรคไข้เลือดออก'
      },
      {
        question: 'ขั้นที่ 2: สาเหตุและพาหะนำโรคหลักในเหตุการณ์นี้คืออะไร?',
        options: [
          'การรับประทานอาหารทะเลค้างคืน',
          'เชื้อไวรัสเดงกีที่มี "ยุงลาย" เป็นพาหะนำโรค',
          'ภาวะขาดฮอร์โมนอินซูลิน',
          'การสัมผัสละอองเกสรดอกไม้'
        ],
        correctIndex: 1,
        explanation: 'เชื้อไวรัสเดงกีแพร่สู่คนผ่านยุงลาย ซึ่งมักพบลูกน้ำในแหล่งน้ำขังรอบที่พักอาศัยและโรงเรียน'
      },
      {
        question: 'ขั้นที่ 3: มาตรการใดเหมาะสมที่สุดในการควบคุมและป้องกันโรคในโรงเรียน?',
        options: [
          'ปิดห้องเรียนทุกห้องและเปิดเครื่องปรับอากาศตลอดวัน',
          'กำจัดแหล่งน้ำขัง ปิดฝาภาชนะ ใส่ทรายกำจัดลูกน้ำ และป้องกันไม่ให้ถูกยุงกัด',
          'ให้ผู้ป่วยรับประทานยาแอสไพรินเพื่อลดไข้ทันที',
          'เพิ่มปริมาณขนมหวานในโรงอาหาร'
        ],
        correctIndex: 1,
        explanation: 'การตัดวงจรยุงลายด้วยการกำจัดแหล่งเพาะพันธุ์และป้องกันการถูกกัดเป็นหัวใจสำคัญของการควบคุมไข้เลือดออก'
      }
    ],
    reportSummary: 'สรุปสำนวน CASE 001: โรคไข้เลือดออกเกิดจากเชื้อไวรัสเดงกี โดยมีลูกน้ำและยุงลายในแหล่งน้ำขังเป็นปัจจัยสำคัญ การกำจัดแหล่งเพาะพันธุ์ยุงและการเฝ้าระวังอาการเตือนช่วยลดการระบาดได้อย่างมีประสิทธิภาพ'
  },
  {
    id: 'case-002',
    code: 'CASE 002',
    difficulty: 'ระดับกลาง (Medium)',
    title: 'คลื่นอาการปวดท้องหลังงานเลี้ยงรุ่น',
    summary: 'หลังงานเลี้ยงกลางวันของชมรม มีสมาชิก 9 คน มีอาการคลื่นไส้ อาเจียน และปวดท้องถ่ายเหลวภายใน 4–8 ชั่วโมง',
    evidences: [
      {
        label: 'หลักฐานที่ 1: อาการของผู้ป่วย',
        detail: 'ผู้ป่วยส่วนใหญ่มีอาการคลื่นไส้ อาเจียน ปวดบิดในท้อง และถ่ายอุจจาระเหลว บางรายมีไข้ต่ำร่วมด้วย'
      },
      {
        label: 'หลักฐานที่ 2: รายการอาหารและจุดบริการ',
        detail: 'อาหารกลางวันถูกจัดเตรียมตั้งแต่ช่วงเช้า วางทิ้งไว้ที่อุณหภูมิห้องหลายชั่วโมง มีเมนูยำทะเลและอาหารปรุงไม่สุกทั่วถึง'
      },
      {
        label: 'หลักฐานที่ 3: สุขอนามัยในการเตรียมอาหาร',
        detail: 'ตรวจสอบพบว่าผู้หยิบจับอาหารบางส่วนไม่ได้ล้างมือก่อนจัดจาน และไม่ได้ใช้ช้อนกลางตักแบ่ง'
      }
    ],
    steps: [
      {
        question: 'ขั้นที่ 1: กลุ่มอาการที่เกิดขึ้นอย่างรวดเร็วหลังรับประทานอาหารบ่งชี้ถึงโรคใด?',
        options: [
          'โรคอาหารเป็นพิษ (Food Poisoning)',
          'โรคความดันโลหิตสูง (Hypertension)',
          'โรคเบาหวาน (Diabetes)',
          'โรคภูมิแพ้ฝุ่นละออง'
        ],
        correctIndex: 0,
        explanation: 'อาการคลื่นไส้ อาเจียน ปวดท้อง และท้องเสียที่เกิดหลังกินอาหารที่อาจปนเปื้อน เป็นลักษณะเด่นของโรคอาหารเป็นพิษ'
      },
      {
        question: 'ขั้นที่ 2: ปัจจัยใดเอื้อให้เกิดปัญหานี้มากที่สุด?',
        options: [
          'การดื่มน้ำเปล่าสะอาดมากเกินไป',
          'การเก็บอาหารไว้ในอุณหภูมิห้องนานและสุขอนามัยการหยิบจับอาหารที่ไม่เหมาะสม',
          'การเดินออกกำลังกายหลังมื้ออาหาร',
          'ระดับน้ำตาลในเลือดต่ำ'
        ],
        correctIndex: 1,
        explanation: 'อาหารที่ปรุงทิ้งไว้นานในอุณหภูมิห้องและการปนเปื้อนจากมือหรือภาชนะทำให้เชื้อโรคและสารพิษเจริญเติบโตได้ง่าย'
      },
      {
        question: 'ขั้นที่ 3: แนวทางป้องกันและดูแลเบื้องต้นที่ถูกต้องคือข้อใด?',
        options: [
          'กินร้อน ช้อนกลาง ล้างมือ ปรุงให้สุกสะอาด และจิบน้ำเกลือแร่ชดเชยหากท้องเสีย',
          'งดดื่มน้ำทุกชนิดจนกว่าจะหยุดถ่าย',
          'นำอาหารค้างคืนที่เริ่มมีกลิ่นเปรี้ยวมาอุ่นกินซ้ำโดยไม่ตรวจสภาพ',
          'รับประทานยาปฏิชีวนะทุกครั้งโดยไม่ประเมินอาการ'
        ],
        correctIndex: 0,
        explanation: 'หลักสุขาภิบาลอาหาร "กินร้อน ช้อนกลาง ล้างมือ" ช่วยป้องกันการปนเปื้อน และการจิบ ORS ช่วยทดแทนน้ำและเกลือแร่'
      }
    ],
    reportSummary: 'สรุปสำนวน CASE 002: โรคอาหารเป็นพิษสัมพันธ์กับการปนเปื้อนของเชื้อโรคหรือสารพิษในอาหารและการเก็บรักษาที่ไม่เหมาะสม การยึดหลักสุขาภิบาลอาหารช่วยป้องกันได้อย่างมีประสิทธิภาพ'
  },
  {
    id: 'case-003',
    code: 'CASE 003',
    difficulty: 'ระดับท้าทาย (Hard)',
    title: 'แฟ้มสุขภาพคุณลุงผู้ไม่ค่อยออกกำลังกาย',
    summary: 'ในการตรวจสุขภาพประจำปีของชุมชน พบผู้ใหญ่รายหนึ่งมีค่าความดันโลหิตสูงต่อเนื่องและเริ่มมีอาการกระหายน้ำ ปัสสาวะบ่อย',
    evidences: [
      {
        label: 'หลักฐานที่ 1: ข้อมูลการตรวจคัดกรอง',
        detail: 'วัดความดันโลหิตซ้ำ 2 ครั้งได้ค่าสูงกว่าเกณฑ์ปกติ และผลตรวจระดับน้ำตาลในเลือดหลังงดอาหารสูงกว่าค่ามาตรฐาน'
      },
      {
        label: 'หลักฐานที่ 2: พฤติกรรมการกินและการใช้ชีวิต',
        detail: 'มักรับประทานบะหมี่กึ่งสำเร็จรูป อาหารแปรรูปรสเค็มจัด และชานมหวานเกือบทุกวัน ไม่ค่อยได้ออกกำลังกาย'
      },
      {
        label: 'หลักฐานที่ 3: ประวัติครอบครัวและอาการ',
        detail: 'มีประวัติคนในครอบครัวเป็นเบาหวานและความดันโลหิตสูง เริ่มสังเกตว่าปัสสาวะบ่อยและเหนื่อยง่ายเวลาเดินขึ้นบันได'
      }
    ],
    steps: [
      {
        question: 'ขั้นที่ 1: จากข้อมูลคัดกรองและพฤติกรรมเสี่ยง ควรเฝ้าระวังโรคกลุ่มใดเป็นพิเศษ?',
        options: [
          'โรคไข้หวัดใหญ่และโรคอาหารเป็นพิษ',
          'โรคเบาหวานและโรคความดันโลหิตสูง (กลุ่มโรคไม่ติดต่อเรื้อรัง)',
          'โรคไข้เลือดออกและโรคภูมิแพ้ละอองเกสร',
          'โรคติดเชื้อจากยุงลาย'
        ],
        correctIndex: 1,
        explanation: 'ความดันโลหิตและระดับน้ำตาลในเลือดที่สูงสัมพันธ์กับพฤติกรรมอาหารและพันธุกรรม ซึ่งเป็นลักษณะของโรคไม่ติดต่อเรื้อรัง (NCDs)'
      },
      {
        question: 'ขั้นที่ 2: พฤติกรรมใดเพิ่มความเสี่ยงต่อภาวะเหล่านี้โดยตรง?',
        options: [
          'การรับประทานอาหารเค็มจัดและหวานจัดร่วมกับการขาดการออกกำลังกาย',
          'การถูกยุงลายกัดในตอนกลางวัน',
          'การหายใจเอาละอองฝอยจากการจาม',
          'การล้างมือก่อนรับประทานอาหาร'
        ],
        correctIndex: 0,
        explanation: 'โซเดียมสูงสัมพันธ์กับความดันโลหิตสูง ขณะที่น้ำตาลสูงและขาดการเคลื่อนไหวร่างกายสัมพันธ์กับภาวะดื้อต่ออินซูลินและเบาหวาน'
      },
      {
        question: 'ขั้นที่ 3: แผนการดูแลสุขภาพระยะยาวที่เหมาะสมที่สุดคือข้อใด?',
        options: [
          'ปรับลดเค็มและหวาน เพิ่มผักและใยอาหาร ออกกำลังกายสม่ำเสมอ และติดตามผลกับบุคลากรทางการแพทย์',
          'หยุดยาหรือหยุดตรวจสุขภาพทันทีเมื่อรู้สึกว่าอาการดีขึ้นเอง',
          'เพิ่มเครื่องปรุงรสเค็มและน้ำเชื่อมเพื่อชดเชยพลังงาน',
          'นอนพักบนเตียงตลอดทั้งวันโดยไม่ต้องขยับร่างกาย'
        ],
        correctIndex: 0,
        explanation: 'การปรับพฤติกรรมอย่างต่อเนื่องร่วมกับการติดตามค่าความดันและระดับน้ำตาลเป็นหลักสำคัญในการควบคุมโรคกลุ่มนี้'
      }
    ],
    reportSummary: 'สรุปสำนวน CASE 003: โรคเบาหวานและความดันโลหิตสูงเป็นโรคไม่ติดต่อเรื้อรังที่ได้รับอิทธิพลจากพฤติกรรมการกิน การออกกำลังกาย และพันธุกรรม การปรับวิถีชีวิตและการติดตามสุขภาพสม่ำเสมอช่วยลดภาวะแทรกซ้อนได้'
  }
];

let activeCaseIndex = 0;
let activeStepIndex = 0;
let casePointsEarnedThisRun = 0;
let stepLocked = false;
let caseCompletedThisRun = false;

function renderCaseSelector() {
  const selector = document.getElementById('caseSelector');
  if (!selector) return;
  const state = loadState();

  selector.innerHTML = '';
  CASES_DATA.forEach((c, idx) => {
    const btn = document.createElement('button');
    const isSolved = state.solvedCases.includes(c.id);
    btn.className = `case-tab ${idx === activeCaseIndex ? 'active' : ''} ${isSolved ? 'solved' : ''}`;
    btn.innerHTML = `${c.code} ${isSolved ? '✓' : ''}`;
    btn.onclick = () => selectCase(idx);
    selector.appendChild(btn);
  });
}

function selectCase(idx) {
  activeCaseIndex = idx;
  renderCaseSelector();
  resetCurrentCase();
}

function resetCurrentCase() {
  activeStepIndex = 0;
  casePointsEarnedThisRun = 0;
  stepLocked = false;
  caseCompletedThisRun = false;
  renderCaseDossier();
  renderInvestigationStep();
}

function renderCaseDossier() {
  const c = CASES_DATA[activeCaseIndex];
  document.getElementById('caseCode').textContent = c.code;
  document.getElementById('caseDifficulty').textContent = c.difficulty;
  document.getElementById('caseTitle').textContent = c.title;
  document.getElementById('caseSummary').textContent = c.summary;

  const evList = document.getElementById('evidenceList');
  evList.innerHTML = c.evidences.map(ev => `
    <div class="evidence-card">
      <h4>${ev.label}</h4>
      <p>${ev.detail}</p>
    </div>
  `).join('');
}

function updateStepTracker() {
  document.querySelectorAll('#stepTracker .step-pill').forEach(pill => {
    const stepNum = Number(pill.dataset.step);
    pill.classList.remove('active', 'done');
    if (caseCompletedThisRun || stepNum < activeStepIndex) {
      pill.classList.add('done');
    } else if (stepNum === activeStepIndex) {
      pill.classList.add('active');
    }
  });
}

function renderInvestigationStep() {
  updateStepTracker();
  const stage = document.getElementById('investigationStage');
  const c = CASES_DATA[activeCaseIndex];

  if (caseCompletedThisRun) {
    stage.innerHTML = `
      <div class="case-report-card">
        <h3>🎉 ปิดสำนวนคดีสำเร็จ (${c.code})!</h3>
        <p>${c.reportSummary}</p>
        <ul style="margin: 12px 0 16px 20px;">
          <li><strong>คะแนนที่ได้รับจากรอบนี้:</strong> +${casePointsEarnedThisRun} คะแนน (ขั้นละ 5 คะแนน)</li>
          <li><strong>สถานะแฟ้มคดี:</strong> บันทึกความสำเร็จลงระบบเรียบร้อยแล้ว</li>
        </ul>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${activeCaseIndex < CASES_DATA.length - 1
            ? `<button onclick="selectCase(${activeCaseIndex + 1})">ไปต่อคดีถัดไป (${CASES_DATA[activeCaseIndex + 1].code}) →</button>`
            : `<button onclick="navigateTo('quiz')">ไปทำแบบทดสอบสุขภาพต่อ →</button>`}
        </div>
      </div>
    `;
    return;
  }

  const step = c.steps[activeStepIndex];
  stepLocked = false;

  stage.innerHTML = `
    <span class="tag">STEP ${activeStepIndex + 1} OF ${c.steps.length}</span>
    <h3 style="margin-top:8px;">${step.question}</h3>
    <div id="stepOptions"></div>
    <div id="stepFeedback"></div>
  `;

  const optionsContainer = document.getElementById('stepOptions');
  step.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => handleStepAnswer(idx, btn);
    optionsContainer.appendChild(btn);
  });
}

function handleStepAnswer(chosenIdx, clickedBtn) {
  if (stepLocked || caseCompletedThisRun) return;

  const c = CASES_DATA[activeCaseIndex];
  const step = c.steps[activeStepIndex];
  const feedback = document.getElementById('stepFeedback');
  const allOptionBtns = document.querySelectorAll('#stepOptions button');

  if (chosenIdx === step.correctIndex) {
    stepLocked = true;
    allOptionBtns.forEach(b => (b.disabled = true));
    clickedBtn.classList.add('correct-choice');

    addPoints(5);
    casePointsEarnedThisRun += 5;

    const isLastStep = activeStepIndex === c.steps.length - 1;
    feedback.className = 'feedback-box ok';
    feedback.innerHTML = `
      <strong>✅ วิเคราะห์ถูกต้อง (+5 คะแนน):</strong> ${step.explanation}
      <div style="margin-top:10px;">
        <button onclick="advanceInvestigationStep()">
          ${isLastStep ? 'ปิดสำนวนคดี' : 'ดำเนินการวิเคราะห์ขั้นถัดไป →'}
        </button>
      </div>
    `;
  } else {
    clickedBtn.classList.add('wrong-choice');
    clickedBtn.disabled = true;
    feedback.className = 'feedback-box err';
    feedback.innerHTML = `
      <strong>❌ ยังไม่ตรงกับหลักฐาน:</strong> ลองตรวจสอบข้อมูลในแฟ้มหลักฐานด้านซ้ายอีกครั้ง แล้วเลือกคำตอบใหม่อีกครั้งครับ
    `;
  }
}

function advanceInvestigationStep() {
  const c = CASES_DATA[activeCaseIndex];
  if (activeStepIndex < c.steps.length - 1) {
    activeStepIndex++;
    renderInvestigationStep();
  } else {
    caseCompletedThisRun = true;
    const state = loadState();
    if (!state.solvedCases.includes(c.id)) {
      state.solvedCases.push(c.id);
      saveState(state);
    }
    renderCaseSelector();
    renderInvestigationStep();
  }
}

// ==========================================
// 5. ระบบแบบทดสอบสุขภาพ (Health Quiz)
// ==========================================
const QUIZ_QUESTIONS = [
  {
    q: 'พาหะนำโรคไข้เลือดออกที่สำคัญคือสัตว์ชนิดใด?',
    options: ['ยุงลาย', 'ยุงรำคาญ', 'แมลงวัน', 'หนู'],
    answer: 0,
    explain: 'โรคไข้เลือดออกมีเชื้อไวรัสเดงกีเป็นสาเหตุ และมียุงลายเป็นพาหะนำโรค'
  },
  {
    q: 'ข้อใดเป็นวิธีป้องกันโรคไข้เลือดออกที่มีประสิทธิภาพ?',
    options: [
      'ปล่อยน้ำขังไว้ในจานรองกระถาง',
      'กำจัดแหล่งน้ำขังและป้องกันยุงกัด',
      'เปิดหน้าต่างทิ้งไว้ตลอดคืนโดยไม่ปิดมุ้งลวด',
      'รับประทานยาปฏิชีวนะล่วงหน้า'
    ],
    answer: 1,
    explain: 'การกำจัดแหล่งเพาะพันธุ์ลูกน้ำยุงลายและป้องกันการถูกยุงกัดช่วยลดความเสี่ยงของโรคไข้เลือดออก'
  },
  {
    q: 'โรคไข้หวัดใหญ่ติดต่อผ่านช่องทางใดเป็นหลัก?',
    options: [
      'ละอองฝอยจากการไอ จาม และสัมผัสสารคัดหลั่ง',
      'การรับประทานอาหารรสหวานจัด',
      'การเดินตากแดดตอนเที่ยง',
      'การสวมเสื้อแขนยาว'
    ],
    answer: 0,
    explain: 'เชื้อไวรัสไข้หวัดใหญ่แพร่กระจายผ่านละอองฝอยทางเดินหายใจและการสัมผัสสารคัดหลั่งที่ปนเปื้อน'
  },
  {
    q: 'โรคเบาหวานเกี่ยวข้องกับฮอร์โมนหรือความผิดปกติใด?',
    options: [
      'ความผิดปกติของอินซูลินและการควบคุมระดับน้ำตาลในเลือด',
      'การขาดวิตามินซีเฉียบพลัน',
      'เชื้อไวรัสเดงกี',
      'การแพ้ละอองเกสรดอกไม้'
    ],
    answer: 0,
    explain: 'โรคเบาหวานเกิดจากร่างกายมีภาวะดื้อต่ออินซูลินหรือผลิตอินซูลินไม่เพียงพอ ทำให้ระดับน้ำตาลในเลือดสูง'
  },
  {
    q: 'พฤติกรรมใดช่วยลดความเสี่ยงโรคความดันโลหิตสูงได้?',
    options: [
      'เพิ่มผงชูรสและอาหารเค็มจัด',
      'ลดอาหารเค็มจัด ออกกำลังกายสม่ำเสมอ และตรวจวัดความดัน',
      'งดการตรวจสุขภาพทุกกรณี',
      'นอนดึกและสะสมความเครียด'
    ],
    answer: 1,
    explain: 'การลดปริมาณโซเดียม ออกกำลังกาย และติดตามค่าความดันโลหิตช่วยลดความเสี่ยงของโรคความดันโลหิตสูง'
  },
  {
    q: 'หลักสุขาภิบาลอาหารข้อใดช่วยป้องกันโรคอาหารเป็นพิษ?',
    options: [
      'กินร้อน ช้อนกลาง ล้างมือ และเลือกอาหารปรุงสุกสะอาด',
      'วางอาหารปรุงสุกไว้ในที่อุ่นตลอดทั้งวัน',
      'รับประทานอาหารดิบหรือค้างคืนที่มีกลิ่นผิดปกติ',
      'ไม่ล้างมือก่อนหยิบจับอาหาร'
    ],
    answer: 0,
    explain: 'การปรุงอาหารให้สุกสะอาด ล้างมือ และเก็บรักษาอาหารอย่างเหมาะสมช่วยลดความเสี่ยงอาหารเป็นพิษ'
  },
  {
    q: 'ข้อใดอธิบาย "โรคภูมิแพ้" ได้ถูกต้องที่สุด?',
    options: [
      'เป็นโรคติดต่อจากคนสู่คนผ่านการสัมผัส',
      'เกิดจากระบบภูมิคุ้มกันตอบสนองไวต่อสารก่อภูมิแพ้ เช่น ไรฝุ่น เกสร หรืออาหารบางชนิด',
      'เกิดจากเชื้อแบคทีเรียในกระแสเลือดเสมอ',
      'ผู้ป่วยทุกคนมีอาการเหมือนกันทุกประการ'
    ],
    answer: 1,
    explain: 'โรคภูมิแพ้ไม่ใช่โรคติดต่อ แต่เกิดจากภูมิคุ้มกันตอบสนองไวผิดปกติต่อสารก่อภูมิแพ้และหลีกเลี่ยงสิ่งกระตุ้นได้'
  },
  {
    q: 'ข้อใดกล่าวถูกต้องเกี่ยวกับข้อมูลสุขภาพบนเว็บไซต์ Disease Hunter?',
    options: [
      'ใช้แทนการตรวจวินิจฉัยหรือรักษาโดยแพทย์',
      'เป็นสื่อเพื่อการศึกษาเรียนรู้เบื้องต้น ไม่ใช่เครื่องมือวินิจฉัยโรคทางการแพทย์',
      'สามารถใช้รักษาโรคแทนยาแพทย์ได้ทุกกรณี',
      'ใช้ได้เฉพาะผู้ป่วยในโรงพยาบาลเท่านั้น'
    ],
    answer: 1,
    explain: 'เนื้อหาบนเว็บไซต์จัดทำขึ้นเพื่อการเรียนรู้ด้านวิทยาศาสตร์สุขภาพ ไม่ใช่เครื่องมือวินิจฉัยหรือรักษาโรค'
  }
];

let quizIndex = 0;
let quizScore = 0;
let quizRunning = false;

function startQuiz() {
  quizIndex = 0;
  quizScore = 0;
  quizRunning = true;
  document.getElementById('quizResult').textContent = '';
  document.getElementById('quizControls').innerHTML = '';
  updateQuizProgress();
  renderQuizQuestion();
}

function updateQuizProgress() {
  const bar = document.getElementById('quizProgressBar');
  if (!bar) return;
  const pct = quizRunning
    ? Math.round((quizIndex / QUIZ_QUESTIONS.length) * 100)
    : 0;
  bar.style.width = `${pct}%`;
}

function renderQuizQuestion() {
  const area = document.getElementById('quizArea');
  if (quizIndex >= QUIZ_QUESTIONS.length) {
    finishQuiz();
    return;
  }

  const qItem = QUIZ_QUESTIONS[quizIndex];
  area.innerHTML = `
    <span class="tag">ข้อที่ ${quizIndex + 1} / ${QUIZ_QUESTIONS.length}</span>
    <h3 style="margin-top:8px;">${qItem.q}</h3>
    <div id="quizOptions"></div>
  `;

  const optsDiv = document.getElementById('quizOptions');
  qItem.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.onclick = () => submitQuizAnswer(idx, btn);
    optsDiv.appendChild(btn);
  });
}

function submitQuizAnswer(chosenIdx, clickedBtn) {
  if (!quizRunning) return;
  quizRunning = false;

  const qItem = QUIZ_QUESTIONS[quizIndex];
  const isCorrect = chosenIdx === qItem.answer;
  const allBtns = document.querySelectorAll('#quizOptions button');
  allBtns.forEach((b, i) => {
    b.disabled = true;
    if (i === qItem.answer) b.classList.add('correct-choice');
    else if (i === chosenIdx && !isCorrect) b.classList.add('wrong-choice');
  });

  if (isCorrect) quizScore++;

  const area = document.getElementById('quizArea');
  const fb = document.createElement('div');
  fb.className = `feedback-box ${isCorrect ? 'ok' : 'err'}`;
  fb.innerHTML = `
    <strong>${isCorrect ? '✅ ถูกต้อง!' : '❌ ยังไม่ถูกต้อง'}</strong>
    <p style="margin-top:4px;">${qItem.explain}</p>
    <button style="margin-top:10px;" onclick="nextQuizQuestion()">
      ${quizIndex === QUIZ_QUESTIONS.length - 1 ? 'ดูผลสรุปคะแนน' : 'ข้อถัดไป →'}
    </button>
  `;
  area.appendChild(fb);
}

function nextQuizQuestion() {
  quizIndex++;
  if (quizIndex < QUIZ_QUESTIONS.length) {
    quizRunning = true;
    updateQuizProgress();
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  quizRunning = false;
  const bar = document.getElementById('quizProgressBar');
  if (bar) bar.style.width = '100%';

  const bonusPoints = quizScore * 2;
  const state = loadState();
  state.totalScore += bonusPoints;
  state.quizCount += 1;
  state.bestQuizScore = Math.max(state.bestQuizScore, quizScore);
  state.totalCorrectAnswers += quizScore;
  state.totalAnsweredQuestions += QUIZ_QUESTIONS.length;

  const nowStr = new Date().toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  state.history.push({
    date: nowStr,
    score: quizScore,
    maxScore: QUIZ_QUESTIONS.length,
    bonusPoints
  });
  saveState(state);
  updateHomeScore();

  document.getElementById('quizArea').innerHTML = '';
  document.getElementById('quizResult').textContent =
    `🎉 ทำแบบทดสอบเสร็จสิ้น! คุณได้ ${quizScore} / ${QUIZ_QUESTIONS.length} ข้อ (ได้รับโบนัส +${bonusPoints} คะแนน)`;

  document.getElementById('quizControls').innerHTML = `
    <button onclick="startQuiz()">🔄 ทำแบบทดสอบใหม่อีกครั้ง</button>
    <button class="secondary" onclick="navigateTo('score')">🏆 ไปที่หน้าสรุปคะแนน</button>
  `;
}

// ==========================================
// 6. ระบบ AI Assistant: ด็อกเตอร์ฮันเตอร์ (Dr. Hunter)
// เชื่อมต่อ Typhoon LLM ผ่าน API
// ==========================================

const DR_HUNTER_SYSTEM_PROMPT = `คุณคือ "ด็อกเตอร์ฮันเตอร์" (Dr. Hunter) 🕵️‍♂️🩺 ผู้ช่วย AI อัจฉริยะประจำศูนย์สืบสวนและป้องกันโรค Disease Hunter ของโครงงานวิทยาศาสตร์สุขภาพระดับมัธยมศึกษาตอนปลาย

บุคลิกและลักษณะนิสัย:
- สุภาพ อบอุ่น เป็นมิตร กระตือรือร้น และมีความเชี่ยวชาญด้านวิทยาศาสตร์สุขภาพและการแพทย์เบื้องต้น
- เรียกผู้ใช้ว่า "คุณนักสืบ" หรือ "นักสืบสุขภาพ" อยู่เสมอ เพื่อให้เข้ากับธีมของเว็บไซต์ Disease Hunter
- ใช้คำเปรียบเทียบในธีมนักสืบสุขภาพ เช่น เปรียบเทียบอาการป่วยเป็น "เบาะแส", ปัจจัยเสี่ยงและเชื้อโรคเป็น "ต้นตอผู้ร้าย", การดูแลตนเองและวัคซีนเป็น "มาตรการป้องกันเพื่อปิดคดีโรคภัย"
- มีความรู้ครอบคลุม 6 โรคสำคัญของโปรเจกต์ ได้แก่:
  1. โรคไข้เลือดออก (Dengue - ไวรัสเดงกี ยุงลาย อาการไข้สูงลอย ปวดกระบอกตา จุดเลือดออก ห้ามกิน NSAIDs เด็ดขาด)
  2. โรคไข้หวัดใหญ่ (Influenza - ไวรัสไข้หวัดใหญ่ A/B ละอองฝอย วัคซีนประจำปี ล้างมือ หน้ากาก)
  3. โรคเบาหวาน (Diabetes - โรคไม่ติดต่อเรื้อรัง NCDs อินซูลิน คุมน้ำตาล ออกกำลังกาย)
  4. โรคความดันโลหิตสูง (Hypertension - โรค NCDs "เพชฌฆาตเงียบ" ลดเค็ม/โซเดียม ตรวจวัดความดันสม่ำเสมอ)
  5. โรคอาหารเป็นพิษ (Food Poisoning - แบคทีเรีย/สารพิษ กินร้อน ช้อนกลาง ล้างมือ ดื่มผงเกลือแร่ ORS)
  6. โรคภูมิแพ้ (Allergy - สารก่อภูมิแพ้ ไรฝุ่น เกสร หลีกเลี่ยงสิ่งกระตุ้น ไม่ใช่โรคติดต่อ)
  และสามารถตอบคำถามสุขภาพทั่วไป สุขอนามัย การปฐมพยาบาลเบื้องต้นได้อย่างถูกต้องตามหลักการแพทย์

สไตล์การตอบ:
- ใช้ภาษาไทยเป็นหลัก ภาษาชัดเจน เป็นระเบียบ อ่านง่าย
- ใช้ตัวหนา (**ข้อความ**) เพื่อเน้นคำสำคัญ และใช้ bullet points (- หรือ •) จัดเป็นประเด็น
- ใช้ emoji ประกอบที่เหมาะสม (เช่น 🕵️‍♂️, 🩺, 🔍, ⚠️, 💡, 🛡️, 💊)
- หากพบอาการที่อาจเป็นอันตราย (Red Flags) ให้เตือนอย่างชัดเจนและแนะนำให้ไปพบแพทย์ทันที
- ลงท้ายคำตอบด้วยคำเตือนเพื่อความปลอดภัยเสมอว่า:
  "*💡 หมายเหตุเพื่อความปลอดภัย: ข้อมูลนี้เป็นความรู้เพื่อการศึกษาและการดูแลสุขภาพเบื้องต้น ไม่สามารถใช้ทดแทนการตรวจวินิจฉัยหรือการรักษาโดยแพทย์ผู้เชี่ยวชาญได้ครับ*"`;

const QUICK_QUESTIONS = [
  '🦟 ไข้สูง ปวดกระบอกตา เสี่ยงไข้เลือดออกไหม?',
  '🍱 ท้องเสีย ปวดบิดท้อง หลังกินยำทะเล ควรดูแลเบื้องต้นอย่างไร?',
  '🩸 ทำไมความดันโลหิตสูงถึงถูกเรียกว่า "เพชฌฆาตเงียบ"?',
  '🤧 ไข้หวัดใหญ่กับไข้หวัดธรรมดา สังเกตความต่างอย่างไร?',
  '🩸 ผู้ป่วยเบาหวานควรคุมอาหารและสังเกตอาการเตือนอะไรบ้าง?',
  '🌼 โรคภูมิแพ้ป้องกันและหลีกเลี่ยงสิ่งกระตุ้นได้อย่างไร?'
];

// เก็บประวัติการสนทนาเพื่อบริบทต่อเนื่อง (Multi-turn conversation)
let chatHistory = [
  { role: 'system', content: DR_HUNTER_SYSTEM_PROMPT }
];

let isGeneratingResponse = false;

function renderQuickPrompts() {
  const wrap = document.getElementById('quickPrompts');
  if (!wrap) return;
  wrap.innerHTML = '';

  QUICK_QUESTIONS.forEach(q => {
    const btn = document.createElement('button');
    btn.className = 'quick-btn';
    btn.textContent = q;
    btn.onclick = () => {
      const input = document.getElementById('chatInput');
      if (input) {
        input.value = q;
        sendMessage();
      }
    };
    wrap.appendChild(btn);
  });
}

// แปลง Markdown อย่างง่ายให้แสดงผลเป็น HTML สวยงาม
function formatMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // หัวข้อ ###
  html = html.replace(/^### (.*$)/gim, '<h4 class="md-h4">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="md-h3">$1</h3>');

  // ตัวหนา **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // ตัวเอียง *text*
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

  // เส้นคั่น ---
  html = html.replace(/^---$/gim, '<hr class="md-hr">');

  // รายการ Bullet points (- หรือ •)
  const lines = html.split('\n');
  let inList = false;
  let formattedLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      if (!inList) {
        formattedLines.push('<ul class="md-ul">');
        inList = true;
      }
      formattedLines.push(`<li>${trimmed.substring(2)}</li>`);
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (!inList) {
        formattedLines.push('<ol class="md-ol">');
        inList = true;
      }
      formattedLines.push(`<li>${trimmed.replace(/^\d+\.\s/, '')}</li>`);
    } else {
      if (inList) {
        formattedLines.push('</ul>');
        inList = false;
      }
      formattedLines.push(line);
    }
  }
  if (inList) formattedLines.push('</ul>');

  html = formattedLines.join('<br>').replace(/(<br>){2,}/g, '<br><br>');
  // ลบ <br> ที่อยู่ติดกับ tags ของ list
  html = html.replace(/<br><(ul|ol|li|\/ul|\/ol)>/g, '<$1>');
  html = html.replace(/<\/(ul|ol|li)><br>/g, '</$1>');

  return html;
}

async function sendMessage() {
  if (isGeneratingResponse) return;

  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const text = input.value.trim();
  if (!text) return;

  // เพิ่มข้อความของผู้ใช้ลงในหน้าแชท
  appendChatMessage(text, 'user-message', 'คุณนักสืบ');
  input.value = '';

  // เพิ่มลงใน history
  chatHistory.push({ role: 'user', content: text });

  // จำกัดประวัติการสนทนาไว้ที่ 10 ล่าสุด (บวก system prompt) เพื่อรักษาประสิทธิภาพและ Token
  if (chatHistory.length > 11) {
    chatHistory = [
      chatHistory[0],
      ...chatHistory.slice(chatHistory.length - 10)
    ];
  }

  // แสดง Typing indicator ของด็อกเตอร์ฮันเตอร์
  isGeneratingResponse = true;
  if (sendBtn) sendBtn.disabled = true;
  if (input) input.disabled = true;

  const typingId = showTypingIndicator();

  try {
    const apiUrl = getEnv('TYPHOON_API_URL', 'https://api.opentyphoon.ai/v1/chat/completions');
    const apiKey = getEnv('TYPHOON_API_KEY', 'sk-EA3ijJufix4p9OyLmzRhwc6Mi5wuZwMOrDWG3LLDdjtcdsri');
    const model = getEnv('TYPHOON_MODEL', 'typhoon-v2.5-30b-a3b-instruct');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: chatHistory,
        max_tokens: 800,
        temperature: 0.6
      })
    });

    removeTypingIndicator(typingId);

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || response.statusText || 'เกิดข้อผิดพลาดในการเชื่อมต่อ API';
      throw new Error(`(HTTP ${response.status}) ${errMsg}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || 'ขออภัยครับ ด็อกเตอร์ฮันเตอร์ไม่สามารถประมวลผลคำตอบได้ในขณะนี้';

    // บันทึกลง history
    chatHistory.push({ role: 'assistant', content: replyText });

    // แสดงข้อความในแชท
    appendChatMessage(replyText, 'bot-message', '🕵️‍♂️ ด็อกเตอร์ฮันเตอร์', true);

  } catch (error) {
    console.error('Typhoon API Error:', error);
    removeTypingIndicator(typingId);

    const errorHtml = `
      ขออภัยครับคุณนักสืบ เกิดปัญหาในการติดต่อศูนย์ข้อมูล AI:
      <br><span style="color:#e05252; font-family:monospace; font-size:12px;">${error.message}</span>
      <br><br>💡 คำแนะนำ: ตรวจสอบสัญญาณอินเทอร์เน็ตหรือการตั้งค่าในไฟล์ <code style="background:#eaf1f7; padding:2px 6px; border-radius:4px;">.env</code> แล้วลองใหม่อีกครั้งครับ
      <div style="margin-top:10px;">
        <button class="small-btn" onclick="retryLastMessage()">🔄 ลองส่งอีกครั้ง</button>
      </div>
    `;
    appendChatMessage(errorHtml, 'bot-message', '⚠️ ศูนย์แจ้งเตือน', true);
  } finally {
    isGeneratingResponse = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) {
      input.disabled = false;
      input.focus();
    }
  }
}

function retryLastMessage() {
  const lastUserMsg = [...chatHistory].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    document.getElementById('chatInput').value = lastUserMsg.content;
    sendMessage();
  }
}

function showTypingIndicator() {
  const container = document.getElementById('chatMessages');
  const indicator = document.createElement('div');
  const id = 'typing-' + Date.now();
  indicator.id = id;
  indicator.className = 'bot-message typing-indicator-bubble';
  indicator.innerHTML = `
    <div class="message-sender">🕵️‍♂️ ด็อกเตอร์ฮันเตอร์</div>
    <div class="typing-dots-wrapper">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <span class="typing-text">กำลังวิเคราะห์ข้อมูลเบาะแสสุขภาพ...</span>
    </div>
  `;
  container.appendChild(indicator);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function appendChatMessage(text, className, sender = '', isHtml = false) {
  const container = document.getElementById('chatMessages');
  const bubble = document.createElement('div');
  bubble.className = className;

  let contentHtml = isHtml ? formatMarkdown(text) : escapeHtml(text);

  bubble.innerHTML = `
    ${sender ? `<div class="message-sender">${sender}</div>` : ''}
    <div class="message-content">${contentHtml}</div>
  `;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}

function resetChat() {
  chatHistory = [
    { role: 'system', content: DR_HUNTER_SYSTEM_PROMPT }
  ];

  const container = document.getElementById('chatMessages');
  container.innerHTML = `
    <div class="bot-message">
      <div class="message-sender">🕵️‍♂️ ด็อกเตอร์ฮันเตอร์</div>
      <div class="message-content">
        เริ่มต้นบทสนทนาใหม่เรียบร้อยครับคุณนักสืบ! 🩺<br><br>
        ผมพร้อมช่วยคุณวิเคราะห์เบาะแสอาการ ตอบข้อสงสัยเกี่ยวกับ 6 โรคสำคัญ หรือแนะนำการดูแลสุขภาพเบื้องต้น วันนี้มีคำถามเรื่องใดให้ผมช่วยสืบไหมครับ?
      </div>
    </div>
  `;
}

// ==========================================
// 7. เริ่มต้นระบบเมื่อโหลดหน้าเว็บ
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  await loadEnvConfig();
  renderDiseases();
  renderCaseSelector();
  resetCurrentCase();
  renderQuickPrompts();
  updateHomeScore();
  updateScoreDashboard();

  const chatInput = document.getElementById('chatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});
