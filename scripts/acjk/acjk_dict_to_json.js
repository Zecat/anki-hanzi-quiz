const fs = require("fs");
const findHanzi = require("find-hanzi");
const ids = require('./ids.json');

// const cccedict = require('parse-cc-cedict');

// Path to your CEDICT file
//const cedictFilePath = './cedict_ts.u8';

// Create a new instance of CEDICTParser

const isCDLChar = (c) => {
    return c >= "⿰" && c <= "⿿";
};

const run = async () => {
  // Parse the CEDICT file
  //const dict = cccedict.parseFile(cedictFilePath)
  //  console.log(dict)
  async function decompositionToAcjk(decomposition) {
    let decompWithNum = decomposition
    const chars = [...new Set(decomposition)].filter(c => !isCDLChar(c) && c != '.')
    for (const char of chars) {
       const found = (await findHanzi(char))[0];
       const regex = new RegExp(char, 'g');
       decompWithNum = decompWithNum.replace(regex, char+found.strokes)
       //console.log(item)

       //transformedData[char] = {
       //  set: ['unknown'],
       //  pinyin: found.pinyinList,
       //  radical: found.radical,
       //  decomposition: '',
       //  acjk: await decompositionToAcjk(decomposition)
       //}
    }
    return decompWithNum
  }

  async function transformFile(inputFilePath, outputFilePath) {
    const inputData = fs.readFileSync(inputFilePath, "utf8").trim().split("\n");
    const transformedData = {};

    for (const line of inputData) {
      const item = JSON.parse(line);
      const character = item.character;
      delete item.character;
      if (!item.pinyin || !item.definition) {
        try {
          const found = (await findHanzi(character))[0];
          if (!item.pinyin) item.pinyin = found.pinyinList;
          if (!item.definition) item.definition = found.definition;
          console.warn(
            `fixed character: ${character} => pinyin: ${item.pinyin}, definition: ${item.definition}`,
          );
        } catch (e) {
          console.warn("missing data for ", character);
        }
      }
      transformedData[character] = item;
    }
//function replaceCharByDecomp(inputString ) {
//    let result = '';
//    for (let i = 0; i < inputString.length; i++) {
//        const currentChar = inputString[i];
//        if (currentChar.charCodeAt(1)) {
//            let decomposition = ids[char];
//            decomposition = decomposition.replace(/\[.*?\]/, '');
//            if (decomposition != char)
//              {
//              result += replacementString;
//              }
//        } else {
//            result += currentChar;
//        }
//    }
//    return result;
//}
      for (const item of Object.values(transformedData)) {

        const subDecompRequired = Array.from(item.acjk.slice(1)).filter(char => char.charCodeAt(1))

        for(const char of subDecompRequired) {
            let decomposition = ids[char];
            if (!decomposition) continue
            //if (transformedData[char]) continue
            decomposition = decomposition.replace(/\[.*?\]/, '');
            if (decomposition == char)continue
            try {
              let regex = new RegExp(char + '\\d*', 'g');
              let developed = await decompositionToAcjk(decomposition)
              let a = char+developed
              console.log(developed, char+developed)
              item.acjk = item.acjk.replace(regex, a)
              console.log(char, item)

              //transformedData[char] = {
              //  set: ['unknown'],
              //  pinyin: found.pinyinList,
              //  radical: found.radical,
              //  decomposition: '',
              //  acjk: await decompositionToAcjk(decomposition)
              //}

            } catch (e) {
              //console.warn("! missing data for ", character);
            }
        }
      }

    fs.writeFileSync(outputFilePath, JSON.stringify(transformedData, null, 2));
    console.log(`Transformed data has been written to ${outputFilePath}`);
  }

  // Check if both input and output file names are provided
  if (process.argv.length !== 4) {
    console.error("Usage: node script.js input_file output_file");
    process.exit(1);
  }

  const inputFilePath = process.argv[2];
  const outputFilePath = process.argv[3];

  transformFile(inputFilePath, outputFilePath);
};

run();
