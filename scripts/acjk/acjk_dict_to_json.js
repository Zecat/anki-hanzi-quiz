const fs = require("fs");
const findHanzi = require("find-hanzi");
const ids = require('./ids.json');
const graphics = require('./graphicsZhHans.json');
const graphicsKana = require('./graphicsKana.json');
const makemeahanziGraphics = require('./makemeahanzigraphics.json');
const makemeahanziDictionnary = require('./makemeahanzidictionnary.json');
const path = require('path');

// Path to your CEDICT file
//const cedictFilePath = './cedict_ts.u8';

// Create a new instance of CEDICTParser

    const transformedData = {};
const isCDLChar = (c) => {
  return c >= "⿰" && c <= "⿿";
};

function createFilesFromDictionary(dictionary, basePath) {
  for (const [key, value] of Object.entries(dictionary)) {
    const fileName = `_${key}.json`;
    const filePath = path.join(basePath, fileName);
    const fileContent = JSON.stringify(value, null);
    fs.writeFileSync(filePath, fileContent);
  }
}

const sum = (array) =>
  array.reduce((accumulator, currentValue) => accumulator + currentValue, 0);

const getStrokeLen = async (char) => {
  console.log(char)
  try {
    const found = await findHanzi(char)
    return Number(found[0].strokes)
  } catch (e) {
    const decomp = ids[char]
    if (!decomp || decomp == char)
      throw new Error(`Stroke count unavailable for ${char}`)
    const decompArr = [...decomp].filter(c => !isCDLChar(c))
    const strokesLenArr = await Promise.all(decompArr.map(getStrokeLen))
    return sum(strokesLenArr)
  }
}

const run = async () => {
  // Parse the CEDICT file
  //const dict = cccedict.parseFile(cedictFilePath)
  //  console.log(dict)
  async function decompositionToAcjk(decomposition) {
    let decompWithNum = decomposition
    const chars = [...new Set(decomposition)].filter(c => !isCDLChar(c) && c != '.')
    for (const char of chars) {
      try {
        const strokesLen = await getStrokeLen(char)
        const regex = new RegExp(char, 'g');
        decompWithNum = decompWithNum.replace(regex, char + strokesLen)
      } catch (e) {
        console.warn('Hanzi stroke len unknown', char)
      }
      //if (!found ) {
      //  console.warn('Hanzi not found', char)
      //  continue
      //}
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

  const alternativeChar = {
    "𥫗":"竹",
    "⺈":"刀",
    "𠃋": "乙"
  }

  //HACK
  const getEquivalent = (char)=> {
    if (char === '𥫗') return '竹'
    if (char === '⺈') return '刀'
    //if (char === 'ス') return '又'
    return char
  }

  const populateItem = async (char, item) => {

    if (!item.pinyin || !item.definition) {
      try {
        const c = alternativeChar[char] ||char

        const found = (await findHanzi(c))[0];
        if (!item.pinyin) item.pinyin = found.pinyinList;
        if (!item.definition) item.definition = found.definition;

        console.warn(
          `fixed char: ${char} => pinyin: ${item.pinyin}, definition: ${item.definition}`,
        );
      } catch (e) {
        console.warn("missing data for ", char);
      }
    }

    // Note fallback to Kana for 轻
    const graphic = graphics[char] || makemeahanziGraphics[char] || graphicsKana[char]
    if (graphic) {
      item.strokes = graphic.strokes
      item.medians = graphic.medians
    } else {
      console.warn(`Strokes not found for ${char}`)
    }
    if (item.strokes)
      item.len = item.strokes.length
    else {
      try {
      item.len = await getStrokeLen(char)
      } catch(e) {
      console.warn('!!!!!!!!!!!!!! NO STROKE LEN FOR ', char)
      }
    }


    //if(!item.decomposition) {
    let decomposition = ids[char]
    if (decomposition) {
        let decompositionCleaned = decomposition.replace(/\[.*?\]/, '');

      for (const c of [...decompositionCleaned]) {
        if ("①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑲".includes(c))
          {

          decompositionCleaned = char
            break;
          }
      }
        item.decomposition = decompositionCleaned
    }
    //}
    if(!item.decomposition) {
        item.decomposition = char
      }
    item.decomposition = [...item.decomposition].map(char => alternativeChar[char] || char).join('')

      let missingChars = Array.from(item.decomposition.slice(1)).filter(char => !transformedData[char])//char.charCodeAt(1))
      missingChars = [...new Set(missingChars)] // remove duplicates

      for (const missingChar of missingChars) {
        const item = {}
        await populateItem(missingChar, item)
        transformedData[missingChar] = item
        //if (!transformedData[char])
        //  notfound.add(char)
        //let decomposition = ids[char];
        //if (!decomposition) continue
        //decomposition = decomposition.replace(/\[.*?\]/, '');
        //if (decomposition == char)continue
        //try {
        //  let regex = new RegExp(char + '\\d*', 'g');
        //  let developed = await decompositionToAcjk(decomposition)
        //  item.acjk = item.acjk.replace(regex, developed)
        //} catch (e) {
        //  console.warn("====>! missing data for ", char);
        //}
      }

    // TODO USE ACJK
    //if (!item.acjk) {
    //  let decomposition = item.decomposition
    //  if (decomposition) {
    //    let acjk = await decompositionToAcjk(decomposition)
    //    item.acjk = acjk
    //  }
    //}

    //if (!transformedData[char])
    //  notfound.add(char)
    //let decomposition = ids[char];
    //if (!decomposition) continue
    //decomposition = decomposition.replace(/\[.*?\]/, '');
    //if (decomposition == char)continue
    //try {
    //  let regex = new RegExp(char + '\\d*', 'g');
    //  let developed = await decompositionToAcjk(decomposition)
    //  item.acjk = item.acjk.replace(regex, developed)
    //} catch (e) {
    //  console.warn("====>! missing data for ", char);
    //}
  }

  async function transformFile(inputFilePath, outputFilePath) {
    const inputData = fs.readFileSync(inputFilePath, "utf8").trim().split("\n");

    for (const line of inputData) {
      const item = JSON.parse(line);
      const character = item.character;
      delete item.character;
      await populateItem(character, item)
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
    const notfound = new Set()
    for (const item of Object.values(transformedData)) {

      let missingChars = Array.from(item.decomposition.slice(1)).filter(char => !transformedData[char])//char.charCodeAt(1))
      missingChars = [...new Set(missingChars)] // remove duplicates

      for (const missingChar of missingChars) {
        const item = {}
        await populateItem(missingChar, item)
        transformedData[missingChar] = item
        //if (!transformedData[char])
        //  notfound.add(char)
        //let decomposition = ids[char];
        //if (!decomposition) continue
        //decomposition = decomposition.replace(/\[.*?\]/, '');
        //if (decomposition == char)continue
        //try {
        //  let regex = new RegExp(char + '\\d*', 'g');
        //  let developed = await decompositionToAcjk(decomposition)
        //  item.acjk = item.acjk.replace(regex, developed)
        //} catch (e) {
        //  console.warn("====>! missing data for ", char);
        //}
      }
    }

    let i = 0
    for (const [c, v] of Object.entries(makemeahanziDictionnary)) {
      const d = transformedData[c]
      if (!d) {
        transformedData[c] = v
        if (makemeahanziGraphics[c]) {
          transformedData[c] = { ...transformedData[c], ...makemeahanziGraphics[c] }
        }
        i++;
      }
    }
    fs.writeFileSync(outputFilePath, JSON.stringify(transformedData, null, 2));
    createFilesFromDictionary(transformedData, "./characters/")
    console.log(`Transformed data has been written to ${outputFilePath}`);
    //console.log([...notfound].length,[...notfound].includes("𡨄") )
    //for (const n of notfound)
    //  console.log(n)
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
