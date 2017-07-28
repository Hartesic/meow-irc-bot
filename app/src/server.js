var fs = require('fs')
var irc = require('irc')

// Get rid of first one or two args
var UNWANTED_ARGS_PATTERN = /nodejs|node|server\.js/
var args = process.argv
while (UNWANTED_ARGS_PATTERN.test(args[0])) {
  args.shift()
}

// Set various const
var DEBUG = args.indexOf('-d') > -1
var CAT_ACTIONS
var CLIENT
var CAT_REACTIONS
var CAT_REACTION_UNKNOWN_ACTION
var CHAN
var NICK
var URL
var USER_ACTIONS

var ACTION_ON_CAT_PATTERN
var REACTION_USERNICK_PATTERN = /%\(user\)s/

var TIMEOUT_ID
var TIMEOUT_MAX = 3600
var TIMEOUT_MIN = 1800

// Get absolute file path
var filePath = args.shift()
if (filePath[0] !== '/') {
  filePath = process.env.PWD + '/' + filePath
}

// Where it all begins
if (DEBUG) {
  console.log('APP: parsing JSON conf')
}
fs.readFile(filePath, function (err, data) {
  if (err) {
    handleError(err)
    return -1
  }
  initConsts(data)
})

function initConsts (conf) {
  if (DEBUG) {
    console.log('APP: initializing consts')
  }
  confObj = JSON.parse(conf)
  CAT_ACTIONS = confObj.commands.live
  CAT_REACTIONS = confObj.actions
  CAT_REACTION_UNKNOWN_ACTION = confObj.actions.default
  CHAN = confObj.irc.channel
  NICK = confObj.irc.user
  URL = confObj.irc.server
  USER_ACTIONS = confObj.commands.actions

  ACTION_ON_CAT_PATTERN = new RegExp('^(.+) ' + NICK + '$')

  initClient(URL, NICK, CHAN)
}

function initClient (url, nick, chan) {
  if (DEBUG) {
    console.log('APP: initializing IRC client with args: ', arguments)
  }
  var client = new irc.Client(url, nick, {
    channels: [chan]
  })

  CLIENT = client

  client.addListener('error', handleError)
  client.addListener('message', handleMessage)
  client.addListener('pm', handlePrivateMessage)
  client.addListener('registered', handleRegistered)
  client.addListener('join' + chan, handleJoinChan)
  client.addListener('action', handleAction)
}

function actCatishly () {
  if (DEBUG) {
    console.log('CATLIFE: about to act like a cat')
  }
  doStupidCrap(getRandomAction(), getRandomUserNick())
  planCatMess()
}

function doStupidCrap (something, usernick) {
  if (DEBUG) {
    console.log('ACTION: doing something stupid: ', something, usernick)
  }
  var actionType = something.type
  var func = CLIENT[actionType].bind(CLIENT)
  if (func != null) {
    func(CHAN, something.text.replace(REACTION_USERNICK_PATTERN, usernick))
  } else {
    doStupidCrap(CAT_REACTION_UNKNOWN_ACTION, usernick)
  }
}

function getRandomAction () {
  var randomAction = getRandomValueFromArray(CAT_ACTIONS)
  return CAT_REACTIONS[randomAction]
}

function getRandomInt (min, max) {
  return Math.round((Math.random() * max) + min)
}

function getRandomUserNick () {
  var userNickList = Object.keys(CLIENT.chans[CHAN].users)
  var randomUserNick = getRandomValueFromArray(userNickList)
  return randomUserNick
}

function getRandomValueFromArray (arr) {
  var arrLen = arr.length
  if (arrLen === 1) {
    var randomValue = arr[0]
  } else {
    var randomIndex = getRandomInt(0, arrLen - 1)
    var randomValue = arr[randomIndex]
  }
  return randomValue

}

function handleAction (from, to, text, message) {
  if (DEBUG) {
    console.log(from, to, text, message)
  }
  text = text.trim()
  var actionMatches = text.match(ACTION_ON_CAT_PATTERN)
  console.log(ACTION_ON_CAT_PATTERN, text, actionMatches)
  if (actionMatches != null && actionMatches.length > 0) {
    var action = actionMatches[1]
    var possibleReactions = USER_ACTIONS[action]
    if (possibleReactions != null) {
      var reaction = getRandomValueFromArray(possibleReactions)
      var reactionObj = CAT_REACTIONS[reaction]
      doStupidCrap(reactionObj, from)
    } else {
      var reactionObj = CAT_REACTION_UNKNOWN_ACTION
      doStupidCrap(reactionObj, from)
    }
  }
}

function handleError (message) {
  if (DEBUG) {
    console.log(message)
  }
}

function handleJoinChan (nick, message) {
  if (DEBUG) {
    console.log(nick, message)
  }
  if (nick === NICK) {
    planCatMess(1)
  }
}

function handleMessage (from, to, message) {
  if (DEBUG) {
    console.log(from, to, message)
  }
}

function handlePrivateMessage (from, message) {
  if (DEBUG) {
    console.log(from, message)
  }
  client.say(from, 'meow')
}

function handleRegistered (message) {
  if (DEBUG) {
    console.log(message)
  }
}

function planCatMess (timeout) {
  timeout = (timeout || getRandomInt(TIMEOUT_MIN, TIMEOUT_MAX)) // Between 2 and 10 minutes
  if (DEBUG) {
    console.log('CATLIFE: planning to act like a cat in ' + timeout + ' seconds')
  }
  TIMEOUT_ID = setTimeout(function () {
    actCatishly()
  }, timeout * 1000)
}
