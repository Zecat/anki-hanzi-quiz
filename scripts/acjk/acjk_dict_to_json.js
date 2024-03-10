const fs = require('fs');

function transformFile(inputFilePath, outputFilePath) {
  const inputData = fs.readFileSync(inputFilePath, 'utf8').trim().split('\n');
  const transformedData = {};

  inputData.forEach(line => {
    const item = JSON.parse(line);
    const character = item.character;
    delete item.character;
    transformedData[character] = item;
  });

  fs.writeFileSync(outputFilePath, JSON.stringify(transformedData, null, 2));
  console.log(`Transformed data has been written to ${outputFilePath}`);
}

// Check if both input and output file names are provided
if (process.argv.length !== 4) {
  console.error('Usage: node script.js input_file output_file');
  process.exit(1);
}

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];

transformFile(inputFilePath, outputFilePath);
