const { execSync } = require('child_process');
const fs = require('fs');

console.log('Downloading MongoDB MSI...');
try {
    execSync('curl.exe -L -o mongodb.msi "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.5-signed.msi"', { stdio: 'inherit' });
    console.log('Installing MongoDB silently...');
    execSync('msiexec.exe /q /i mongodb.msi', { stdio: 'inherit' });
    console.log('MongoDB successfully installed as a service!');
} catch (e) {
    console.error('Installation failed:', e);
}
