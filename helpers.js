const moment = require('moment')



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
function log(message, color = "lightpurple")
{
	const colors = {
		"error" 		: "\\033[91m",
		"success" 		: "\\033[92m",
		"info" 			: "\\033[96m",
		"debug" 		: "\\033[95m",
		"yellow" 		: "\\033[93m",
		"lightpurple" 	: "\\033[94m",
		"lightgray" 	: "\\033[97m",
		"reset"			: "\\033[00m"
	}

	let msg = "";

	if(color) {
		msg += colors[color] + message + colors["reset"]
	} else {
		msg = message
	}

	console.log(`[${moment().format('hh:mm:ss:SS')}] ${msg}`)
}

  module.exports = {generateRandomId, sleep,log}
