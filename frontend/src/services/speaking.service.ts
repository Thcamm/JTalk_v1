export const evaluateSpeaking = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        transcript: "おはようございます",
        score: 92,
        feedback:
          "Excellent pronunciation. Try speaking a little slower."
      });
    }, 2000);
  });
};