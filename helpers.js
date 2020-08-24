



function generateRandomId(prefix, addLetter, exsitIds) {

    var generated = addLetter === true ? Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) : ''
  
    while (true) {
      generated = generated + prefix + Math.floor(Math.random() * 100000);
      if (!exsitIds || !(generated in exsitIds)) {
        break;
      }
    }
    return generated;
  }

  function sleep(time, logIt) {
   time = time * 1000
   if (logIt){
    console.log("Sleeping for " + time / 1000  + " seconds", "info");
   }
  
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve(true);
      }, time);
    });
  }

  module.exports = {generateRandomId, sleep,log}