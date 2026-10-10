const { execSync } = require('child_process');
console.log('Installing mongodb-memory-server...');
try {
    execSync('npm i mongodb-memory-server', { stdio: 'inherit' });
    console.log('Successfully installed mongodb-memory-server!');
} catch (e) {
    console.error('Failed', e);
}
