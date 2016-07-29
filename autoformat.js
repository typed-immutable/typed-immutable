var exec = require('child-process-promise').exec;

exec('git status --porcelain')
.then(status => {
  status = status.stdout.trim();
  if (status.length) {
    throw new Error('You must not have any uncommited changes to run autoformat.');
  }
})
.then(() => exec('esformatter ./src/*.js ./src/**/*.js -i'))
.then(() => exec('git commit -am "autoformatting"'))
.then(() =>  {
  console.log('Autoformatting was successful. Please push the changes.');
})
.catch(err => {
  console.log('Could not autoformat.');
  console.error(err);
});
