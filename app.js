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
  bot.startConversation(message, function(err, convo) {
    convo.say("I am a work in progress, please come back later!");
  });
});


// WHICH GAME: Finding which game the user is playing for pokedex entry numbers

var userCurrentGame = {};

controller.hears('game', 'message_received', function(bot, message) {   
  bot.startConversation(message, function(err, convo) {
    if (!err && !userCurrentGame[message.user]) {
      convo.ask('Which game are you currently playing?', function(response, convo) {
        var userAnswer = response.text.toLowerCase();
        
        // if 'pokemon' is in the answer, remove it
        if (userAnswer.indexOf('pokemon') !== -1) {
          userAnswer = userAnswer.split('pokemon ')[1];
        } else if (userAnswer.indexOf('pokémon') !== -1) {
          userAnswer = userAnswer.split('pokémon ')[1];
        }
        
        // REGEXP (for some answers - to avoid having another game/multiple games as a result ('black 2' instead of 'black', etc.))
        
        if (userAnswer === 'y') { 
          userAnswer = /\sy$/;
        } else if (userAnswer === 'x') {
          userAnswer = /^x\s/;
        } else if (userAnswer === 'ruby') {
          userAnswer = /^ruby\s/;
        } else if (userAnswer === 'red') {
          userAnswer = /^red\s/;
        } else if (userAnswer === 'gold') {
          userAnswer = /^gold\s/;
        } else if (userAnswer === 'silver') {
          userAnswer = /\ssilver$/;
        } else if (userAnswer === 'white') {
          userAnswer = /\swhite$/;
        } else if (userAnswer === 'sapphire') {
          userAnswer = /^ruby sapphire$/;
        } else if (userAnswer === 'black') {
          userAnswer = /^black white$/;
        }
        
        request('https://pokeapi.co/api/v2/version-group/', function (err, result) {
          if (!err) {
            var resultObject = JSON.parse(result.body);
            var results = resultObject.results;
            
            results.forEach(function(index) {
              var currentGameName = index.name.split('-').join(' ');
              console.log(currentGameName);
              if (currentGameName.search(userAnswer) !== -1 && currentGameName !== 'colosseum' && currentGameName !== 'xd') {    // ignoring Colosseum and XD
                console.log('found! here is the url: ' + index.url);
                userCurrentGame[message.user] = index.name;
              }
            });
          }
        });
        convo.say('you said: ' + response.text);  // placeholder
        convo.next();
      });
    }
  });
});


// WHICH POKEMON ?

controller.hears(['^pokemon$', 'search'], 'message_received', function(bot, message) {
  bot.startConversation(message, function(err, convo) {
    if (!err && !userCurrentGame[message.user]) {
      convo.ask('Which pokemon would you like to know more about? Say it\'s name or national pokedex entry number.', function(response, convo) {
        var chosenPokemon = response.text;
        // note to future self: make up for people entering things like '#025', 'number 25', 'pokemon no. 25', etc.
        
        var chosenPokemonId;
        var chosenPokemonName;
        
        // checking if a name or an ID number was entered
        if (chosenPokemon.match(/^[^0-9]+$/)) {
          chosenPokemonName = chosenPokemon.toLowerCase();
        } else if (chosenPokemon.match(/^[0-9]+$/)) {
          chosenPokemonId = Number(chosenPokemon);
        } else {
          bot.reply(message, 'Sorry, I didn\'t understand...');
        }
        console.log(chosenPokemon)
        console.log(chosenPokemonId)
        console.log(chosenPokemonName)
        
        // finding the entry
        if (chosenPokemonId || chosenPokemonName) {
          request('https://pokeapi.co/api/v2/pokedex/1/', function (err, result) {
            if (!err) {
              var resultObject = JSON.parse(result.body);
              var pokemon_entries = resultObject.pokemon_entries;
              var foundPokemon;
              
              // if it's an ID...
              if (chosenPokemonId) {
                pokemon_entries.forEach(function(index) {
                  var entry_number = index.entry_number;
                  if (entry_number === chosenPokemonId) {
                    foundPokemon = index.pokemon_species.url;
                  }
                });
              } else if (chosenPokemonName) {
                // do the same for a name
              }
              
              if (foundPokemon) {
                request(foundPokemon, function (err, result) {
                  if (!err) {
                    var resultObject = JSON.parse(result.body);
                    
                    bot.startConversation(message, function(err, convo) {
                      if (!err) {
                        convo.say('I have found : ' + resultObject.names[0].name);
                        convo.say('National Pokedex entry no. : ' + resultObject.pokedex_numbers[(resultObject.pokedex_numbers.length -1)].entry_number);
                        convo.say('Natural habitat : ' + resultObject.habitat.name);
                        convo.say(resultObject.names[0].name + ' evolves from ' + resultObject.evolves_from_species.name);   // need to remove this line if null
                        convo.say(resultObject.flavor_text_entries[1].flavor_text);
                        
                        // NOTE: current bug; can't do a second search. need to exit the flow
                      }
                    });
                  }
                });
              }
            }
          });
        }
      });
    }
  });
})