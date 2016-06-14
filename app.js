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
    bot.reply(message, "Hey there. Nice to meet you! Try saying 'pokemon'!");
  } else {
    bot.reply(message, 'Hello, nice to see you again!');
  }
});


// HELP SECTION
controller.hears('^help$', 'message_received', function(bot, message) {
  bot.startConversation(message, function(err, convo) {
    convo.say("I am a work in progress. Try saying 'pokemon'!");
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

var userCurrentPokemonChain = {};

controller.hears(['^pokemon$', 'search'], 'message_received', searchPokemon);

function searchPokemon(bot, message) {
  bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('Which pokemon would you like to know more about? Say it\'s name or national pokedex entry number.', function(response, convo) {
        bot.reply(message, 'Alright, please wait while I go through my files.');
        
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
          bot.reply(message, 'Sorry, I didn\'t understand... Please say a number OR a name.');
        }
        
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
              } else if (chosenPokemonName) {   // if it's a name
                pokemon_entries.forEach(function(index) {
                  var name = index.pokemon_species.name;
                  if (name === chosenPokemonName) {
                    foundPokemon = index.pokemon_species.url;
                  }
                });
              }
              
              console.log(chosenPokemonId)
              console.log(chosenPokemonName)
              console.log(foundPokemon)
              
              if (foundPokemon) {
                request(foundPokemon, function (err, result) {
                  if (!err) {
                    var resultObject = JSON.parse(result.body);
                    var nationalDexNo = resultObject.pokedex_numbers[(resultObject.pokedex_numbers.length -1)].entry_number;
                    var pokemonInfo;
                    userCurrentPokemonChain[message.user] = resultObject.evolution_chain.url;
                    
                    if (nationalDexNo) {
                      request('https://pokeapi.co/api/v2/pokemon/' + nationalDexNo, function(err, result) {
                        if (!err) {
                          pokemonInfo = JSON.parse(result.body);
                          var pokemonTypes = [];
                          
                          pokemonInfo.types.forEach(function(type) {
                            pokemonTypes.push(type.type.name);
                          });
                          
                          var attachment = {
                            'type':'template',
                            'payload':{
                              'template_type':'generic',
                              'elements':[
                                {
                                  'title': 'No. ' + nationalDexNo + ', ' + resultObject.names[0].name,
                                  'image_url': pokemonInfo.sprites.front_default,
                                  'subtitle': 'Type(s) : ' + pokemonTypes,
                                  'buttons': [
                                    {
                                    'type':'postback',
                                    'title':'See Evolution Chain',
                                    'payload':'evolution-button'
                                    },
                                    {
                                    'type':'postback',
                                    'title':'Another search',
                                    'payload':'search'
                                    },
                                    {
                                    'type':'postback',
                                    'title':'That will be all',
                                    'payload':'thatsall-button'
                                    }
                                  ]
                                }
                              ]
                            }
                          };
                          
                          bot.startConversation(message, function(err, convo) {
                            if (!err) {
                              convo.say('I have found :');
                              convo.say({attachment: attachment});
                              return;
                            }
                          });
                        } else {
                          bot.reply(message, 'Sorry, I couldn\'t find the Pokémon that you requested.');
                          return;
                        }
                      });
                    } else {
                      bot.reply(message, 'Sorry, I couldn\'t find the Pokémon that you requested.');
                      return;
                    } 
                  }
                });
              } else {
                bot.reply(message, 'Sorry, I couldn\'t find the Pokémon that you requested.');
                return;
              }
            } else {
              // catch error
            }
          });
        }
        convo.stop();
      });
    }
  });
}

controller.on('facebook_postback', function(bot, message) {
  if (message.payload === 'evolution-button') {
    // bot.reply(message, 'Sorry, this area is still in construction :3');
    // return;
    bot.reply(message, 'No problem, hold on a second!');
    evolutionChain(bot, message);
    
    // call evolution chain function
  } else if (message.payload === 'search') {
    searchPokemon(bot, message);
  } else if (message.payload === 'thatsall-button') {
    bot.reply(message, 'Ok, tell me if you need my help again!');
    return;
  }
});

// create evolution chain function

function evolutionChain(bot, message) {
  request(userCurrentPokemonChain[message.user], function (err, result) {
    if (!err) {
      var evolutionInfos = JSON.parse(result.body);
      bot.startConversation(message, function(err, convo) {
        convo.say('This pokemon evolution chain starts with ' + evolutionInfos.chain.species.name.charAt(0).toUpperCase() + evolutionInfos.chain.species.name.slice(1));
        convo.say('Followed by ' + evolutionInfos.chain.evolves_to[0].species.name.charAt(0).toUpperCase() + evolutionInfos.chain.evolves_to[0].species.name.slice(1));
        convo.say('And finally ' + evolutionInfos.chain.evolves_to[0].evolves_to[0].species.name.charAt(0).toUpperCase() + evolutionInfos.chain.evolves_to[0].evolves_to[0].species.name.slice(1));
      });
    }
  });
}