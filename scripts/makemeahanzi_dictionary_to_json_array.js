const fs = require('fs');

// Get input and output file paths from command-line arguments
const inputPath = process.argv[2];
const outputPath = process.argv[3];

if (!inputPath || !outputPath) {
    console.error('Usage: node script.js <input_path> <output_path>');
    process.exit(1);
}

// Read the input text file line by line
const lines = fs.readFileSync(inputPath, 'utf8').split('\n');

// Initialize an array to store parsed objects
const data = [];

// Parse each line as JSON and push to the array
lines.forEach(line => {
    if (line.trim() !== '') { // Skip empty lines
        try {
            const obj = JSON.parse(line);
            data.push(obj);
        } catch (error) {
            console.error('Error parsing line as JSON:', error.message);
        }
    }
});

// Write the final JSON array to the output file
fs.writeFileSync(outputPath, JSON.stringify(data));

console.log(`JSON data has been written to ${outputPath}`);
