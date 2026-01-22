
const fs = require('fs');
const path = require('path');

const dir = 'public/cardapio';
const fileList = [];

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath, { withFileTypes: true }).forEach(function(dirent) {
        const filePath = path.join(currentDirPath, dirent.name);
        if (dirent.isDirectory()) {
            walkSync(filePath, callback);
        } else {
            callback(filePath, dirent.name);
        }
    });
}

walkSync(dir, function(filePath, fileName) {
    // Relativo a public
    const relPath = filePath.replace('public/', '/');
    fileList.push({
        path: relPath,
        name: fileName,
        folder: path.dirname(filePath).split(path.sep).pop()
    });
});

console.log(JSON.stringify(fileList, null, 2));
