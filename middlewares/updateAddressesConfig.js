const fs = require('fs');
const path = require('path');

function updateAddressesConfig(variableName, contractAddress) {
    const configPath = path.join(__dirname, '../../addressesConfig.js');
    let content = fs.readFileSync(configPath, 'utf8');
  
    const regex = new RegExp(`(const ${variableName} = ')(.*?)(';)`, 'g');
    const match = regex.test(content);
  
    if (match) {
      content = content.replace(regex, `$1${contractAddress}$3`);
      fs.writeFileSync(configPath, content, 'utf8');
      console.log(`${variableName} updated in addressesConfig.js`);
    } else {
      console.log(`${variableName} not found in addressesConfig.js.`);
    }
  }

module.exports = { updateAddressesConfig };
