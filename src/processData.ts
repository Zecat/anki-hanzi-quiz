

  // TODO extract
  export const getPinyinTone = (pinyin: string) => {
    // Define a dictionary mapping accents to tone numbers
    const toneMap: { [key: string]: number } = {
      ā: 1,
      á: 2,
      ǎ: 3,
      à: 4,
      ē: 1,
      é: 2,
      ě: 3,
      è: 4,
      ī: 1,
      í: 2,
      ǐ: 3,
      ì: 4,
      ō: 1,
      ó: 2,
      ǒ: 3,
      ò: 4,
      ū: 1,
      ú: 2,
      ǔ: 3,
      ù: 4,
      ǖ: 1,
      ǘ: 2,
      ǚ: 3,
      ǜ: 4,
      ü: 5, // Neutral tone for ü
    };

    for (let char of pinyin) {
      if (char in toneMap) {
        return toneMap[char];
      }
    }

    return 5;
  }

  export const cleanPinyin = (strArr: string[] | undefined): string => {
    if (!strArr || !strArr.length) return "pinyin unavailable";
    const str = strArr[0];

    //if (!pinyinData)
    //  return 5
    //const pinyin = Array.isArray(pinyinData) ? pinyinData[0] : pinyinData

    if (!str) return "";
    const match = str.match(/^[^(]+/);
    return match ? match[0] : "";
  }

  export const cleanDescription = (desc: string | undefined): string => {
    if (!desc) return "";
    let regex = /Kangxi radical\s+\d+;?/g;

    // Remove occurrences of the pattern
    let result = desc.replace(regex, "");

    regex = /rad.\s+\d+;?/g;
    result = result.replace(regex, "");

    regex = /radical number\s+\d+;?/g;
    result = result.replace(regex, "");

    result = result.replace(/;(\s*)$/, "$1");
    return result;
  }
