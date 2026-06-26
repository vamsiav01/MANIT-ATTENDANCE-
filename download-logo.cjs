const fs = require('fs');
const https = require('https');

const url = 'https://upload.wikimedia.org/wikipedia/en/b/b5/Maulana_Azad_National_Institute_of_Technology_Logo.png';
const file = fs.createWriteStream('public/manit-logo.png');

const options = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }
};

https.get(url, options, function(response) {
  response.pipe(file);
  file.on('finish', function() {
    file.close();
    console.log('Download complete');
  });
}).on('error', function(err) {
  fs.unlink('public/manit-logo.png');
  console.error('Error downloading:', err.message);
});
