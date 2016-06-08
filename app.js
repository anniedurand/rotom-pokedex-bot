var Botkit = require('botkit');
var request = require('request');

var controller = Botkit.facebookbot({
  access_token: process.env.page_access_token,
  verify_token: process.env.verify_token,
});

var bot = controller.spawn({
});

// SERVER
controller.setupWebserver(process.env.PORT, function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
    console.log('This bot is online!!!');
  });
});

var userFirstRun = {};

// user said hello
controller.hears(['hello', '^hi$', '^yo$', '^hey$', 'what\'s up'], 'message_received', function(bot, message) {  // NOTE: Change dialog, add user nickname question linked with database
  if (!userFirstRun[message.user]) {
    userFirstRun[message.user] = 'done';
    bot.reply(message, "Hey there. Nice to meet you! Try saying 'help'!");
  } else {
    bot.reply(message, 'Hello, nice to see you again!');
  }
});

// HELP SECTION
controller.hears('^help$', 'message_received', function(bot, message) {
  bot.startConversation(message,function(err,convo) {
    convo.say("I am a work in progress, please come back later!");
  });
});