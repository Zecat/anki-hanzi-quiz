const fs = require('fs');

function convertFileToJson(inputFilePath, outputFilePath) {
  const data = fs.readFileSync(inputFilePath, 'utf8').trim().split('\n').slice(2);;
  const result = {};

  data.forEach(line => {
    const [unicode, key, value] = line.trim().split('\t');
    result[key] = value;
  });

  fs.writeFileSync(outputFilePath, JSON.stringify(result, null, 2));
  console.log(`JSON data has been written to ${outputFilePath}`);
}

// Check if both input and output file names are provided
if (process.argv.length !== 4) {
  console.error('Usage: node script.js input_file output_file');
  process.exit(1);
}

const inputFilePath = process.argv[2];
const outputFilePath = process.argv[3];

convertFileToJson(inputFilePath, outputFilePath);
