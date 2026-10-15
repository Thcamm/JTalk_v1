/**
 * Vietnamese & Latin Name to Japanese Katakana / Romaji Transliteration Engine (Frontend)
 *
 * Accurately converts Vietnamese names (first name, full name) into standard Katakana
 * and polite Japanese address formats (e.g. "カムさん", "トゥアンさん", "リンさん").
 */

export interface JapaneseLearnerIdentity {
  originalName: string;
  givenName: string;
  katakanaName: string;
  katakanaFullName: string;
  romajiName: string;
  callingName: string;
  callingNameRomaji: string;
  furiganaOpening: string;
}

export const VIETNAMESE_KATAKANA_DICT: Record<string, { kata: string; romaji: string }> = {
  // Common Surnames (Họ)
  nguyen: { kata: "グエン", romaji: "Guen" },
  nguyễn: { kata: "グエン", romaji: "Guen" },
  tran: { kata: "チャン", romaji: "Chan" },
  trần: { kata: "チャン", romaji: "Chan" },
  le: { kata: "レ", romaji: "Re" },
  lê: { kata: "レ", romaji: "Re" },
  pham: { kata: "ファム", romaji: "Famu" },
  phạm: { kata: "ファム", romaji: "Famu" },
  hoang: { kata: "ホアン", romaji: "Hoan" },
  hoàng: { kata: "ホアン", romaji: "Hoan" },
  huynh: { kata: "フイン", romaji: "Huin" },
  huỳnh: { kata: "フイン", romaji: "Huin" },
  phan: { kata: "ファン", romaji: "Fan" },
  vu: { kata: "ヴー", romaji: "Vuu" },
  vũ: { kata: "ヴー", romaji: "Vuu" },
  vo: { kata: "ヴォ", romaji: "Vo" },
  võ: { kata: "ヴォ", romaji: "Vo" },
  dang: { kata: "ダン", romaji: "Dan" },
  đặng: { kata: "ダン", romaji: "Dan" },
  bui: { kata: "ブイ", romaji: "Bui" },
  bùi: { kata: "ブイ", romaji: "Bui" },
  do: { kata: "ドー", romaji: "Doo" },
  đỗ: { kata: "ドー", romaji: "Doo" },
  ho: { kata: "ホー", romaji: "Hoo" },
  hồ: { kata: "ホー", romaji: "Hoo" },
  ngo: { kata: "ゴー", romaji: "Goo" },
  ngô: { kata: "ゴー", romaji: "Goo" },
  duong: { kata: "ズオン", romaji: "Zuon" },
  dương: { kata: "ズオン", romaji: "Zuon" },
  ly: { kata: "リー", romaji: "Rii" },
  lý: { kata: "リー", romaji: "Rii" },
  dinh: { kata: "ディン", romaji: "Din" },
  đinh: { kata: "ディン", romaji: "Din" },
  định: { kata: "ディン", romaji: "Din" },
  doan: { kata: "ドアン", romaji: "Doan" },
  đoàn: { kata: "ドアン", romaji: "Doan" },
  lam: { kata: "ラム", romaji: "Ramu" },
  lâm: { kata: "ラム", romaji: "Ramu" },
  mai: { kata: "マイ", romaji: "Mai" },
  trinh: { kata: "チン", romaji: "Chin" },
  trịnh: { kata: "チン", romaji: "Chin" },
  dao: { kata: "ダオ", romaji: "Dao" },
  đào: { kata: "ダオ", romaji: "Dao" },
  cao: { kata: "カオ", romaji: "Kao" },
  ha: { kata: "ハ", romaji: "Ha" },
  hà: { kata: "ハ", romaji: "Ha" },
  luu: { kata: "ルウ", romaji: "Ruu" },
  lưu: { kata: "ルウ", romaji: "Ruu" },
  thai: { kata: "タイ", romaji: "Tai" },
  thái: { kata: "タイ", romaji: "Tai" },
  luong: { kata: "ルオン", romaji: "Ruon" },
  lương: { kata: "ルオン", romaji: "Ruon" },

  // Common Middle Names (Tên đệm)
  thi: { kata: "ティ", romaji: "Ti" },
  thị: { kata: "ティ", romaji: "Ti" },
  van: { kata: "ヴァン", romaji: "Van" },
  văn: { kata: "ヴァン", romaji: "Van" },
  huu: { kata: "フウ", romaji: "Huu" },
  hữu: { kata: "フウ", romaji: "Huu" },
  quoc: { kata: "クオック", romaji: "Kuokku" },
  quốc: { kata: "クオック", romaji: "Kuokku" },
  duc: { kata: "ドゥック", romaji: "Dukku" },
  đức: { kata: "ドゥック", romaji: "Dukku" },

  // Common First Names (Tên gọi)
  an: { kata: "アン", romaji: "An" },
  anh: { kata: "アン", romaji: "An" },
  ánh: { kata: "アン", romaji: "An" },
  bach: { kata: "バック", romaji: "Bakku" },
  bách: { kata: "バック", romaji: "Bakku" },
  bao: { kata: "バオ", romaji: "Bao" },
  bảo: { kata: "バオ", romaji: "Bao" },
  bac: { kata: "バック", romaji: "Bakku" },
  bắc: { kata: "バック", romaji: "Bakku" },
  bang: { kata: "バン", romaji: "Ban" },
  bằng: { kata: "バン", romaji: "Ban" },
  bich: { kata: "ビック", romaji: "Bikku" },
  bích: { kata: "ビック", romaji: "Bikku" },
  binh: { kata: "ビン", romaji: "Bin" },
  bình: { kata: "ビン", romaji: "Bin" },
  cam: { kata: "カム", romaji: "Kamu" },
  cẩm: { kata: "カム", romaji: "Kamu" },
  camm: { kata: "カム", romaji: "Kamu" },
  thcam: { kata: "カム", romaji: "Kamu" },
  thcamm: { kata: "カム", romaji: "Kamu" },
  tcamm: { kata: "カム", romaji: "Kamu" },
  canh: { kata: "カイン", romaji: "Kain" },
  cảnh: { kata: "カイン", romaji: "Kain" },
  chi: { kata: "チ", romaji: "Chi" },
  chien: { kata: "チエン", romaji: "Chien" },
  chiến: { kata: "チエン", romaji: "Chien" },
  chinh: { kata: "チン", romaji: "Chin" },
  chính: { kata: "チン", romaji: "Chin" },
  chung: { kata: "チュン", romaji: "Chun" },
  cuong: { kata: "クオン", romaji: "Kuon" },
  cường: { kata: "クオン", romaji: "Kuon" },
  danh: { kata: "ザイン", romaji: "Zain" },
  diem: { kata: "ディエム", romaji: "Diemu" },
  diễm: { kata: "ディエム", romaji: "Diemu" },
  diep: { kata: "ディエップ", romaji: "Dieppu" },
  diệp: { kata: "ディエップ", romaji: "Dieppu" },
  duy: { kata: "ズイ", romaji: "Zui" },
  duyen: { kata: "ズエン", romaji: "Zuen" },
  duyên: { kata: "ズエン", romaji: "Zuen" },
  dung: { kata: "ズン", romaji: "Zun" },
  dũng: { kata: "ズン", romaji: "Zun" },
  dụng: { kata: "ズン", romaji: "Zun" },
  dat: { kata: "ダット", romaji: "Datto" },
  đạt: { kata: "ダット", romaji: "Datto" },
  dan: { kata: "ダン", romaji: "Dan" },
  đan: { kata: "ダン", romaji: "Dan" },
  giang: { kata: "ザン", romaji: "Zan" },
  giao: { kata: "ザオ", romaji: "Zao" },
  hai: { kata: "ハイ", romaji: "Hai" },
  hải: { kata: "ハイ", romaji: "Hai" },
  hao: { kata: "ハオ", romaji: "Hao" },
  hào: { kata: "ハオ", romaji: "Hao" },
  hanh: { kata: "ハイン", romaji: "Hain" },
  hạnh: { kata: "ハイン", romaji: "Hain" },
  hang: { kata: "ハン", romaji: "Han" },
  hằng: { kata: "ハン", romaji: "Han" },
  hau: { kata: "ハウ", romaji: "Hau" },
  hậu: { kata: "ハウ", romaji: "Hau" },
  hien: { kata: "ヒエン", romaji: "Hien" },
  hiền: { kata: "ヒエン", romaji: "Hien" },
  hiep: { kata: "ヒエップ", romaji: "Hieppu" },
  hiệp: { kata: "ヒエップ", romaji: "Hieppu" },
  hieu: { kata: "ヒエウ", romaji: "Hieu" },
  hiếu: { kata: "ヒエウ", romaji: "Hieu" },
  hoa: { kata: "ホア", romaji: "Hoa" },
  hòa: { kata: "ホア", romaji: "Hoa" },
  hoan: { kata: "ホアン", romaji: "Hoan" },
  hoàn: { kata: "ホアン", romaji: "Hoan" },
  hong: { kata: "ホン", romaji: "Hon" },
  hồng: { kata: "ホン", romaji: "Hon" },
  hue: { kata: "フエ", romaji: "Fue" },
  huệ: { kata: "フエ", romaji: "Fue" },
  hung: { kata: "フン", romaji: "Fun" },
  hùng: { kata: "フン", romaji: "Fun" },
  huy: { kata: "フイ", romaji: "Hui" },
  huyen: { kata: "フエン", romaji: "Fuen" },
  huyền: { kata: "フエン", romaji: "Fuen" },
  huong: { kata: "フオン", romaji: "Fuon" },
  hương: { kata: "フオン", romaji: "Fuon" },
  hường: { kata: "フオン", romaji: "Fuon" },
  khang: { kata: "カン", romaji: "Kan" },
  khanh: { kata: "カイン", romaji: "Kain" },
  khánh: { kata: "カイン", romaji: "Kain" },
  khiem: { kata: "キエム", romaji: "Kiemu" },
  khiêm: { kata: "キエム", romaji: "Kiemu" },
  khoa: { kata: "コア", romaji: "Koa" },
  khoi: { kata: "コイ", romaji: "Koi" },
  khôi: { kata: "コイ", romaji: "Koi" },
  kien: { kata: "キエン", romaji: "Kien" },
  kiên: { kata: "キエン", romaji: "Kien" },
  kiet: { kata: "キエット", romaji: "Kietto" },
  kiệt: { kata: "キエット", romaji: "Kietto" },
  lan: { kata: "ラン", romaji: "Ran" },
  lanh: { kata: "ライン", romaji: "Rain" },
  lành: { kata: "ライン", romaji: "Rain" },
  linh: { kata: "リン", romaji: "Rin" },
  loan: { kata: "ロアン", romaji: "Roan" },
  loc: { kata: "ロック", romaji: "Rokku" },
  lộc: { kata: "ロック", romaji: "Rokku" },
  loi: { kata: "ロイ", romaji: "Roi" },
  lợi: { kata: "ロイ", romaji: "Roi" },
  long: { kata: "ロン", romaji: "Ron" },
  luan: { kata: "ルアン", romaji: "Ruan" },
  luân: { kata: "ルアン", romaji: "Ruan" },
  man: { kata: "マン", romaji: "Man" },
  mẫn: { kata: "マン", romaji: "Man" },
  manh: { kata: "マイン", romaji: "Main" },
  mạnh: { kata: "マイン", romaji: "Main" },
  minh: { kata: "ミン", romaji: "Min" },
  my: { kata: "ミー", romaji: "Mii" },
  mỵ: { kata: "ミー", romaji: "Mii" },
  nam: { kata: "ナム", romaji: "Namu" },
  nga: { kata: "ガ", romaji: "Ga" },
  ngan: { kata: "ガン", romaji: "Gan" },
  ngân: { kata: "ガン", romaji: "Gan" },
  nghi: { kata: "ギー", romaji: "Gii" },
  nghị: { kata: "ギー", romaji: "Gii" },
  nghia: { kata: "ギア", romaji: "Gia" },
  nghĩa: { kata: "ギア", romaji: "Gia" },
  nguyet: { kata: "グエット", romaji: "Guetto" },
  nguyệt: { kata: "グエット", romaji: "Guetto" },
  nhan: { kata: "ニャン", romaji: "Nyan" },
  nhàn: { kata: "ニャン", romaji: "Nyan" },
  nhân: { kata: "ニャン", romaji: "Nyan" },
  nhat: { kata: "ニャット", romaji: "Nyatto" },
  nhật: { kata: "ニャット", romaji: "Nyatto" },
  nhu: { kata: "ニュー", romaji: "Nyuu" },
  như: { kata: "ニュー", romaji: "Nyuu" },
  nhung: { kata: "ニュン", romaji: "Nyun" },
  ninh: { kata: "ニン", romaji: "Nin" },
  oanh: { kata: "オアン", romaji: "Oan" },
  phat: { kata: "ファット", romaji: "Fatto" },
  phát: { kata: "ファット", romaji: "Fatto" },
  phi: { kata: "フィ", romaji: "Fi" },
  phong: { kata: "フォン", romaji: "Fon" },
  phu: { kata: "フー", romaji: "Fuu" },
  phú: { kata: "フー", romaji: "Fuu" },
  phuc: { kata: "フック", romaji: "Fukku" },
  phúc: { kata: "フック", romaji: "Fukku" },
  phuoc: { kata: "フオック", romaji: "Fuokku" },
  phước: { kata: "フオック", romaji: "Fuokku" },
  phuong: { kata: "フオン", romaji: "Fuon" },
  phương: { kata: "フオン", romaji: "Fuon" },
  phung: { kata: "フン", romaji: "Fun" },
  phụng: { kata: "フン", romaji: "Fun" },
  quan: { kata: "クアン", romaji: "Kuan" },
  quân: { kata: "クアン", romaji: "Kuan" },
  quang: { kata: "クアン", romaji: "Kuan" },
  quảng: { kata: "クアン", romaji: "Kuan" },
  quy: { kata: "クイ", romaji: "Kui" },
  quý: { kata: "クイ", romaji: "Kui" },
  quyen: { kata: "クエン", romaji: "Kuen" },
  quyên: { kata: "クエン", romaji: "Kuen" },
  quynh: { kata: "クイン", romaji: "Kuin" },
  quỳnh: { kata: "クイン", romaji: "Kuin" },
  sang: { kata: "サン", romaji: "San" },
  son: { kata: "ソン", romaji: "Son" },
  sơn: { kata: "ソン", romaji: "Son" },
  tai: { kata: "タイ", romaji: "Tai" },
  tài: { kata: "タイ", romaji: "Tai" },
  tam: { kata: "タム", romaji: "Tamu" },
  tâm: { kata: "タム", romaji: "Tamu" },
  tan: { kata: "タン", romaji: "Tan" },
  tân: { kata: "タン", romaji: "Tan" },
  tấn: { kata: "タン", romaji: "Tan" },
  thach: { kata: "タック", romaji: "Takku" },
  thạch: { kata: "タック", romaji: "Takku" },
  thang: { kata: "タン", romaji: "Tan" },
  thắng: { kata: "タン", romaji: "Tan" },
  thanh: { kata: "タイン", romaji: "Tain" },
  thành: { kata: "タイン", romaji: "Tain" },
  thao: { kata: "タオ", romaji: "Tao" },
  thảo: { kata: "タオ", romaji: "Tao" },
  tham: { kata: "タム", romaji: "Tamu" },
  thắm: { kata: "タム", romaji: "Tamu" },
  thien: { kata: "ティエン", romaji: "Tien" },
  thiên: { kata: "ティエン", romaji: "Tien" },
  thiện: { kata: "ティエン", romaji: "Tien" },
  thinh: { kata: "ティン", romaji: "Tin" },
  thịnh: { kata: "ティン", romaji: "Tin" },
  thoa: { kata: "トア", romaji: "Toa" },
  thong: { kata: "トン", romaji: "Ton" },
  thông: { kata: "トン", romaji: "Ton" },
  thu: { kata: "トゥー", romaji: "Tuu" },
  thư: { kata: "トゥー", romaji: "Tuu" },
  thuan: { kata: "トゥアン", romaji: "Tuan" },
  thuận: { kata: "トゥアン", romaji: "Tuan" },
  thuy: { kata: "トゥイ", romaji: "Tui" },
  thủy: { kata: "トゥイ", romaji: "Tui" },
  thụy: { kata: "トゥイ", romaji: "Tui" },
  tien: { kata: "ティエン", romaji: "Tien" },
  tiên: { kata: "ティエン", romaji: "Tien" },
  tiến: { kata: "ティエン", romaji: "Tien" },
  toan: { kata: "トアン", romaji: "Toan" },
  toàn: { kata: "トアン", romaji: "Toan" },
  tra: { kata: "チャ", romaji: "Cha" },
  trà: { kata: "チャ", romaji: "Cha" },
  tram: { kata: "チャム", romaji: "Chamu" },
  trâm: { kata: "チャム", romaji: "Chamu" },
  trang: { kata: "チャン", romaji: "Chan" },
  tri: { kata: "チ", romaji: "Chi" },
  trí: { kata: "チ", romaji: "Chi" },
  trieu: { kata: "チエウ", romaji: "Chieu" },
  triệu: { kata: "チエウ", romaji: "Chieu" },
  trong: { kata: "チョン", romaji: "Chon" },
  trọng: { kata: "チョン", romaji: "Chon" },
  truc: { kata: "チュック", romaji: "Chukku" },
  trúc: { kata: "チュック", romaji: "Chukku" },
  trung: { kata: "チュン", romaji: "Chun" },
  tu: { kata: "トゥー", romaji: "Tuu" },
  tú: { kata: "トゥー", romaji: "Tuu" },
  tuan: { kata: "トゥアン", romaji: "Tuan" },
  tuấn: { kata: "トゥアン", romaji: "Tuan" },
  tung: { kata: "トゥン", romaji: "Tun" },
  tùng: { kata: "トゥン", romaji: "Tun" },
  tuyet: { kata: "トゥエット", romaji: "Tuetto" },
  tuyết: { kata: "トゥエット", romaji: "Tuetto" },
  uyen: { kata: "ウエン", romaji: "Uen" },
  uyên: { kata: "ウエン", romaji: "Uen" },
  viet: { kata: "ヴィエット", romaji: "Vietto" },
  việt: { kata: "ヴィエット", romaji: "Vietto" },
  vinh: { kata: "ヴィン", romaji: "Vin" },
  vuong: { kata: "ヴオン", romaji: "Vuon" },
  vương: { kata: "ヴオン", romaji: "Vuon" },
  vy: { kata: "ヴィ", romaji: "Vi" },
  xuan: { kata: "スアン", romaji: "Suan" },
  xuân: { kata: "スアン", romaji: "Suan" },
  xuyen: { kata: "スエン", romaji: "Suen" },
  xuyến: { kata: "スエン", romaji: "Suen" },
  yen: { kata: "イエン", romaji: "Ien" },
  yến: { kata: "イエン", romaji: "Ien" },
};

/**
 * Strips tone marks / diacritics from Vietnamese string
 */
export function removeVietnameseTones(str: string = ""): string {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

/**
 * Transliterates a single Vietnamese word / name syllable to Katakana & Romaji
 */
export function transliterateSyllable(rawWord: string = ""): { kata: string; romaji: string } {
  if (!rawWord) return { kata: "", romaji: "" };

  const lower = rawWord.trim().toLowerCase();

  // 1. Direct match in dictionary
  if (VIETNAMESE_KATAKANA_DICT[lower]) {
    return VIETNAMESE_KATAKANA_DICT[lower];
  }

  // 2. Try match after removing diacritics
  const unaccented = removeVietnameseTones(lower);
  if (VIETNAMESE_KATAKANA_DICT[unaccented]) {
    return VIETNAMESE_KATAKANA_DICT[unaccented];
  }

  // 3. Fallback: Capitalized
  const capitalized = rawWord.charAt(0).toUpperCase() + rawWord.slice(1);
  return {
    kata: capitalized,
    romaji: capitalized,
  };
}

/**
 * Core Parser: Takes any learner username or display name and returns
 * structured Japanese naming information (Katakana, Romaji, Polite calling form).
 */
export function getLearnerJapaneseIdentity(inputName: string = ""): JapaneseLearnerIdentity {
  const clean = (inputName || "").trim();

  // If empty or default placeholder
  if (!clean || clean.toLowerCase() === "user" || clean.toLowerCase() === "học viên") {
    return {
      originalName: "Học viên",
      givenName: "Học viên",
      katakanaName: "ホック・ヴィエン",
      katakanaFullName: "ホック・ヴィエン",
      romajiName: "Gakusei",
      callingName: "さん",
      callingNameRomaji: "san",
      furiganaOpening: "はじめまして！",
    };
  }

  // Handle common compound username like "Thcamm" -> "Cam", "tcamm" -> "Cam"
  if (/^thcamm?$/i.test(clean) || /^tcamm?$/i.test(clean)) {
    return {
      originalName: clean,
      givenName: "Cẩm",
      katakanaName: "カム",
      katakanaFullName: "カム",
      romajiName: "Kamu",
      callingName: "カムさん",
      callingNameRomaji: "Kamu-san",
      furiganaOpening: "はじめまして！",
    };
  }

  // Split into words
  const normalizedWords = clean
    .replace(/[0-9_.-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedWords.length === 0) {
    return {
      originalName: clean,
      givenName: clean,
      katakanaName: clean,
      katakanaFullName: clean,
      romajiName: clean,
      callingName: `${clean}さん`,
      callingNameRomaji: `${clean}-san`,
      furiganaOpening: "はじめまして！",
    };
  }

  // In Vietnamese, the last word is the given name
  const givenWord = normalizedWords[normalizedWords.length - 1];
  const givenTrans = transliterateSyllable(givenWord);

  const fullKataList = normalizedWords.map((w) => transliterateSyllable(w).kata);
  const katakanaFullName = fullKataList.join("・");

  const katakanaGivenName = givenTrans.kata || givenWord;
  const romajiGivenName = givenTrans.romaji || givenWord;

  return {
    originalName: clean,
    givenName: givenWord,
    katakanaName: katakanaGivenName,
    katakanaFullName,
    romajiName: romajiGivenName,
    callingName: `${katakanaGivenName}さん`,
    callingNameRomaji: `${romajiGivenName}-san`,
    furiganaOpening: "はじめまして！",
  };
}

export default {
  VIETNAMESE_KATAKANA_DICT,
  removeVietnameseTones,
  transliterateSyllable,
  getLearnerJapaneseIdentity,
};
