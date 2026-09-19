export type Message = {
  sender: "ai" | "user";
  text: string;
};

export type Step =
  | "ai"
  | "user"
  | "recording"
  | "processing"
  | "result";


export const lesson1 = [
  {
    id: 1,
    image: "/lesson/img1.png",
    dialogues: [
      "はじめまして。",
      "ソムです。",
      "タイからきました。",
      "どうぞよろしく。"
    ]
  },

  {
    id: 2,
    image: "/lesson/img2.png",
    dialogues: [
      "はじめまして。",
      "わたしはマリアです。",
      "ベトナムからきました。",
      "21歳です。",
      "ハノイ大学の学生です。",
      "こちらこそ、よろしくおねがいします。"
    ]
  },

  {
    id: 3,
    image: "/lesson/img3.png",
    dialogues: [
      "こんにちは。",
      "わたしはジョンです。",
      "アメリカからきました。",
      "25歳です。",
      "エンジニアです。",
      "よろしくおねがいします。"
    ]
  },

  {
    id: 4,
    image: "/lesson/img4.png",
    dialogues: [
      "はじめまして。",
      "リーです。",
      "中国からきました。",
      "22歳です。",
      "日本語を勉強しています。",
      "どうぞよろしくおねがいします。"
    ]
  },

  {
    id: 5,
    image: "/lesson/img5.png",
    dialogues: [
      "こんにちは。",
      "わたしはアンです。",
      "ベトナムからきました。",
      "大学生です。",
      "アニメが好きです。",
      "よろしくおねがいします。"
    ]
  }
];