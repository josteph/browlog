const fs = require('fs');

(async () => {
  const copyFile = (src, dest) => {
    return fs.promises.copyFile(src, dest);
  };

  await Promise.all(['CHANGELOG.md', 'package.json', 'LICENSE', 'README.md'].map(src => copyFile(src, `./dist/${src}`)));
})();