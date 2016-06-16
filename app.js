// MODULES
var Botkit = require('botkit');
var request = require('request');

// CONFIG
var controller = Botkit.facebookbot({
  access_token: process.env.page_access_token,
  verify_token: process.env.verify_token,
});

// BOT SPAWN
var bot = controller.spawn({
});

// SERVER
controller.setupWebserver(process.env.PORT, function(err,webserver) {
  controller.createWebhookEndpoints(controller.webserver, bot, function() {
    console.log('This bot is online!!!');
  });
});

// MONITORING MIDDLEWARE
controller.middleware.receive.use(function(bot, message, next) {
  console.log(userCurrentGame, 'userCurrentGame')
  console.log(userPokedex, 'userPokedex')
  next();
})


// MENUS

var mainMenu = {
  'type':'template',
  'payload':{
    'template_type':'generic',
    'elements':[
      {
        'title': 'What can I help you with?',
        'buttons': [
          {
          'type':'postback',
          'title':'Search for a Pokémon',
          'payload':'search'
          },
          {
          'type':'postback',
          'title':'Search for a type',
          'payload':'search-type'
          },
          {
          'type':'postback',
          'title':'More options',
          'payload':'moreoptions-button'
          }
        ]
      }
    ]
  }
};

var mainMenuNext = {
  'type':'template',
  'payload':{
    'template_type':'generic',
    'elements':[
      {
        'title': 'What can I help you with?',
        'buttons': [
          {
          'type':'postback',
          'title':'Set my Pokédex',
          'payload':'pokedexmenu'
          },
          {
          'type':'postback',
          'title':'Help section',
          'payload':'help'
          },
          {
          'type':'postback',
          'title':'That\'s all for now',
          'payload':'thatsall-button'
          }
        ]
      }
    ]
  }
};

var pokedexMenu = {
  'type':'template',
  'payload':{
    'template_type':'generic',
    'elements':[
      {
        'title': 'What would you like to do?',
        'buttons': [
          {
          'type':'postback',
          'title':'Use National Pokédex',
          'payload':'default'
          },
          {
          'type':'postback',
          'title':'Use game Pokédex',
          'payload':'set-pokedex'
          },
          {
          'type':'postback',
          'title':'Keep current Pokédex',
          'payload':'keep-pokedex'
          }
        ]
      }
    ]
  }
};

var newSearchMenu = {
  'type':'template',
  'payload':{
    'template_type':'generic',
    'elements':[
      {
        'title': 'Would you like to do another search?',
        'buttons': [
          {
          'type':'postback',
          'title':'Search for a Pokémon',
          'payload':'search'
          },
          {
          'type':'postback',
          'title':'See main menu',
          'payload':'mainmenu-button'
          },
          {
          'type':'postback',
          'title':'That\'s all for now',
          'payload':'thatsall-button'
          }
        ]
      }
    ]
  }
};


// MENUS HANDLER

controller.on('facebook_postback', function(bot, message) {
  var currentGameName;
  
  if (userCurrentGame[message.user]) {
    currentGameName = userCurrentGame[message.user].name.split('-').join(' ');
  }
  
  var messageSplit = message.payload.split('*');
  var onButtonPress = messageSplit[0];
  
  if (messageSplit.length === 4) {
    var pokemonName = messageSplit[1];
    var pokemonChainUrl = messageSplit[2];
    var displayName = messageSplit[3];
  } else if (messageSplit.length === 3) {
    var chosenPokedexUrl = messageSplit[1];
    var chosenPokedexName = messageSplit[2];
  }
  
  if (onButtonPress === 'evolution-button') {
    bot.reply(message, 'No problem, hold on a second!');
    evolutionChain(bot, message, pokemonName, pokemonChainUrl, displayName);
  } 
  else if (onButtonPress === 'search') {
    searchPokemon(bot, message);
  } 
  else if (onButtonPress === 'thatsall-button') {
    bot.reply(message, 'Ok, tell me if you need my help again!');
    return;
  } 
  else if (onButtonPress === 'mainmenu-button') {
    bot.reply(message, {attachment: mainMenu});
  } 
  else if (onButtonPress === 'moreoptions-button') {
    bot.reply(message, {attachment: mainMenuNext});
  } 
  else if (onButtonPress === 'search-type') {
    bot.reply(message, 'Sorry, this area is still in construction');
    // call type function
  } 
  else if (onButtonPress === 'pokedexmenu') {
    if (userPokedex[message.user]) {
      var name = userPokedex[message.user][0].name;
      bot.reply(message, 'You are currently using the Pokédex for Pokémon ' + displayGameName(currentGameName) + ': ' + capitalizeFirst(splitJoin(name)) + '.');
    } else {
      bot.reply(message, 'You are currently using the National Pokédex.');
    }
    bot.reply(message, {attachment: pokedexMenu});
  }
  else if (onButtonPress === 'set-pokedex') {
    findGame(bot, message);
  } 
  else if (onButtonPress === 'keep-pokedex') {
    bot.startConversation(message, function(err, convo) {
      if (!err) {
        convo.say('No problem!');
        convo.say({attachment: mainMenu});
      } else {
        bot.reply(message, 'error'); // verify
        return;
      }
    });
  }
  else if (onButtonPress === 'default') {
    if (userPokedex[message.user]) {
      delete userPokedex[message.user];
      bot.startConversation(message, function(err, convo) {
        if (!err) {
          convo.say('Alright, you are now using the National Pokédex.');
          convo.say({attachment: mainMenu});
        } else {
          bot.reply(message, 'error'); // verify
          return;
        }
      });
    } else {
      bot.startConversation(message, function(err, convo) {
        if (!err) {
          convo.say('You are already using the National Pokédex!');
          convo.say({attachment: mainMenu});
        } else {
          bot.reply(message, 'error'); // verify
          return;
        }
      });
    }
  }
  else if (onButtonPress === 'help') {
    bot.reply(message, 'Sorry, this area still is in construction');
    // call help function
  }
  else if (onButtonPress === 'pokedexchoice') {
    userPokedex[message.user] = [ { url: chosenPokedexUrl, name: chosenPokedexName } ];
    console.log(userPokedex[message.user])
    
    bot.startConversation(message, function(err, convo) {
      if (!err) {
        convo.say('Pokédex now set to ' + capitalizeFirst(splitJoin(chosenPokedexName)) + '.');
        convo.say({attachment: mainMenu});
      } else {
        bot.reply(message, 'error'); // verify
        return;
      }
    });
  }
});


// HELLO

var userFirstRun = {};

controller.hears(['hello', '^hi$', '^yo$', '^hey$', 'what\'s up'], 'message_received', function(bot, message) {  // NOTE: Change dialog, add user nickname question linked with database
  if (!userFirstRun[message.user]) {
    userFirstRun[message.user] = 'done';
    bot.startConversation(message, function(err, convo) {
      if (!err) {
        convo.say('Hey there. Nice to meet you!');
        convo.say({attachment: mainMenu});
      } else {
        bot.reply(message, 'error'); // verify
        return;
      }
    });
  } else {
    bot.startConversation(message, function(err, convo) {
      if (!err) {
        convo.say('Hello, nice to see you again!');
        convo.say({attachment: mainMenu});
      } else {
        bot.reply(message, 'error'); // verify
        return;
      }
    });
  }
});


// HELP SECTION
controller.hears('^help$', 'message_received', function(bot, message) {
  bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.say('I am a work in progress. Try saying "pokemon" or "hi"!');
    } else {
      bot.reply(message, 'error'); // verify
      return;
    }
  });
});


// WHICH GAME: Finding which game the user is playing for pokedex entry numbers

var userCurrentGame = {};
var userPokedex = {};

controller.hears(['game', '^pokedex$'], 'message_received', findGame);

function findGame(bot, message) {
  bot.startConversation(message, function(err, convo) {
    if (!err) {
      if (!userCurrentGame[message.user]) {
        convo.ask('Which game are you currently playing?', function(response, convo) {
          var userAnswer = response.text.toLowerCase();
          
          // if 'pokemon' is in the answer, remove it
          if (userAnswer.indexOf('pokemon') !== -1) {
            userAnswer = userAnswer.split('pokemon ')[1];
          } else if (userAnswer.indexOf('pokémon') !== -1) {
            userAnswer = userAnswer.split('pokémon ')[1];
          }
          
          // REGEXP (to avoid having another game/multiple games as a result ('black' instead of 'black 2', etc.))
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
          
          // Fetching game info
          request('https://pokeapi.co/api/v2/version-group/', function (err, result) {
            if (!err) {
              var resultObject = JSON.parse(result.body);
              var versionGroup = resultObject.results;
              
              // loop over each available game
              versionGroup.forEach(function(version) {
                var currentGameName = version.name.split('-').join(' ');
                console.log(currentGameName);
                
                // compare user answer to available games. if found, save infos for that game
                if (currentGameName.search(userAnswer) !== -1 && currentGameName !== 'colosseum' && currentGameName !== 'xd') {    // ignoring Colosseum and XD
                  console.log('found! here is the url: ' + version.url);
                  userCurrentGame[message.user] = version;
                }
              });
              
              // if game infos saved
              if (userCurrentGame[message.user]) {
                getPokedex(bot, message);  // call next function
              }
            } else {
              bot.reply(message, 'error'); // verify
              return;
            }
          });
          convo.stop();
        });
      } else {
        delete userCurrentGame[message.user];
        convo.stop();
        findGame(bot, message);
      }
    } else {
      bot.reply(message, 'error'); // verify, use convo.stop(); instead of return??
      return;
    }
  });
}


// GET POKEDEX for the current game

function getPokedex(bot, message) {
  var currentGameName = userCurrentGame[message.user].name.split('-').join(' ');
  
  // requesting game version
  request(userCurrentGame[message.user].url, function(err, result) {
    if (!err) {
      var resultObject = JSON.parse(result.body);
      var pokedexes = resultObject.pokedexes;
      console.log(pokedexes, 'pokedexes')
      
      // if only 1 pokedex available for that game
      if (pokedexes.length === 1) {
        userPokedex[message.user] = pokedexes;   // assign pokedex to user
        bot.startConversation(message, function(err, convo) {
          if (!err) {
            convo.say('You are currently playing Pokémon ' + displayGameName(currentGameName) + '. Pokédex now set to ' + capitalizeFirst(splitJoin(pokedexes[0].name)) + '.');
            convo.say({attachment: mainMenu});
          } else {
            bot.reply(message, 'error'); // verify
            return;
          }
        });
      } 
      // if multiple pokedexes available for one game
      else if (pokedexes.length > 1) {
        var pokedexButtons = [];
        
        pokedexes.forEach(function(pokedex) {
          var pokedexName = capitalizeFirst(splitJoin(pokedex.name));
          var button = {
            type:'postback',
            title: pokedexName,
            payload:'pokedexchoice*' + pokedex.url + '*' + pokedex.name
          };
          pokedexButtons.push(button);
        });
        
        var pokedexChoice = {
          'type':'template',
          'payload':{
            'template_type':'generic',
            'elements':[
              {
                'title': 'Which Pokédex should I use?',
                'buttons': pokedexButtons
              }
            ]
          }
        }; 
        
        bot.startConversation(message, function(err, convo) {
          if (!err) {
            convo.say('You are currently playing Pokémon ' + displayGameName(currentGameName) + '.');
            convo.say('I have found multiple available Pokédex for this game.');
            convo.say({attachment: pokedexChoice});
          } else {
            bot.reply(message, 'error'); // verify
            return;
          }
        });
      }
    } else {
      bot.reply(message, 'error'); // verify
      return;
    }
  });
}


// WHICH POKEMON ?

controller.hears(['^pokemon$', 'search'], 'message_received', searchPokemon);

function searchPokemon(bot, message) {
  bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('Which Pokémon would you like to know more about? Say it\'s name or Pokédex entry number.', function(response, convo) {
        bot.reply(message, 'Alright, please wait while I look through my files.');
        
        var chosenPokemon = response.text;
        // note to future self: make up for people entering things like '#025', 'number 25', 'pokemon no. 25', etc.
        
        var chosenPokemonId;
        var chosenPokemonName;
        
        // checking if a name or an ID number was entered
        if (chosenPokemon.match(/^[^0-9]+$/)) {
          chosenPokemonName = reverseSplitJoin(chosenPokemon.toLowerCase());
        } else if (chosenPokemon.match(/^[0-9]+$/)) {
          chosenPokemonId = Number(chosenPokemon);
        } else {
          bot.reply(message, 'Sorry, I didn\'t understand... Please say a number OR a name.');
          // add menu ?
        }
        
        // FINDING THE POKEMON ENTRY BASED ON SET POKEDEX
        if (chosenPokemonId || chosenPokemonName) {
          var pokedex;
          if (!userPokedex[message.user]) {
            pokedex = 'https://pokeapi.co/api/v2/pokedex/1/';
          } else {
            pokedex = userPokedex[message.user][0].url;
          }
          
          console.log(pokedex, 'pokedex');
          
          request(pokedex, function (err, result) {
            if (!err) {
              var resultObject = JSON.parse(result.body);
              var pokemon_entries = resultObject.pokemon_entries;
              var foundPokemon = null;
              
              // if it's an ID...
              if (chosenPokemonId) {
                pokemon_entries.forEach(function(index) {
                  var entry_number = index.entry_number;
                  var pokemonName = index.pokemon_species.name;
                  if (entry_number === chosenPokemonId) {
                    foundPokemon = index.pokemon_species.url;
                    displayFoundPokemon(bot, message, foundPokemon, pokemonName, entry_number);
                  }
                });
              } else if (chosenPokemonName) {   // if it's a name
                pokemon_entries.forEach(function(index) {
                  var entry_number = index.entry_number;
                  var pokemonName = index.pokemon_species.name;
                  if (pokemonName.indexOf(chosenPokemonName) !== -1) {
                    foundPokemon = index.pokemon_species.url;
                    displayFoundPokemon(bot, message, foundPokemon, pokemonName, entry_number);
                  }
                });
              }
              
              if (foundPokemon === null) {
                bot.startConversation(message, function(err, convo) {
                  if (!err) {
                    convo.say('Sorry, I couldn\'t find the Pokémon that you requested.');
                    convo.say({attachment: mainMenu});
                  } else {
                    bot.reply(message, 'error'); // verify
                    return;
                  }
                });
              }
              
              console.log(chosenPokemonId)
              console.log(chosenPokemonName)
              console.log(foundPokemon)
            } else {
              bot.reply(message, 'error'); // verify
              return;
            }
          });
        }
        convo.stop();
      });
    }
  });
}


// DISPLAY POKEMON WITH MENU

function displayFoundPokemon(bot, message, foundPokemon, pokemonName, entry_number) {
  request(foundPokemon, function (err, result) {
    if (!err) {
      var resultObject = JSON.parse(result.body);
      var nationalDexNo = resultObject.pokedex_numbers[(resultObject.pokedex_numbers.length -1)].entry_number;
      var currentPokedexEntryNo = entry_number;
      var pokemonChainUrl = resultObject.evolution_chain.url;
      
      if (nationalDexNo) {
        request('https://pokeapi.co/api/v2/pokemon/' + nationalDexNo, function(err, result) {  // need to change the no. display according to chosen pokedex
          if (!err) {
            var displayName = resultObject.names[0].name;
            var isBaby = '';
            if (resultObject.is_baby === true) {
              isBaby = ' [baby]';
            }
            var pokemonInfo = JSON.parse(result.body);
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
                    'title': 'No. ' + currentPokedexEntryNo + ', ' + displayName + isBaby,
                    'image_url': pokemonInfo.sprites.front_default,
                    'subtitle': 'Type(s) : ' + beautifyWordsArrays(pokemonTypes),
                    'buttons': [
                      {
                      'type':'postback',
                      'title':'See evolution chain',
                      'payload':'evolution-button*' + pokemonName + '*' + pokemonChainUrl + '*' + displayName
                      },
                      {
                      'type':'postback',
                      'title':'Search for a Pokémon',
                      'payload':'search'
                      },
                      {
                      'type':'postback',
                      'title':'That\'s all for now',
                      'payload':'thatsall-button'
                      }
                    ]
                  }
                ]
              }
            };
            
            bot.startConversation(message, function(err, convo) {
              if (!err) {
                convo.say('I have found:');
                convo.say({attachment: attachment});
              }
            });
          } else {
            bot.startConversation(message, function(err, convo) {
              convo.say('Sorry, I couldn\'t find the Pokémon that you requested.');
              convo.say({attachment: mainMenu});
            });
          }
        });
      } else {
        bot.startConversation(message, function(err, convo) {
          convo.say('Sorry, I couldn\'t find the Pokémon that you requested.');
          convo.say({attachment: mainMenu});
        });
      } 
    }
  });
}


// DISPLAY EVOLUTION CHAIN

function evolutionChain(bot, message, pokemonName, pokemonChainUrl, displayName) {
  
  request(pokemonChainUrl, function (err, result) {
    if (!err) {
      var evolutionInfos = JSON.parse(result.body);
      
      bot.startConversation(message, function(err, convo) {
        if (!err) {
          var evoLevelTwoArray = evolutionInfos.chain.evolves_to;
          var evoLevelThreeArray = [];
          if (evoLevelTwoArray.length > 0) {
            evoLevelThreeArray = evolutionInfos.chain.evolves_to[0].evolves_to;
          }
          
          var current = pokemonName;
          var first = evolutionInfos.chain.species.name;
          var secondLevel = [];
          var thirdLevel = [];
          
          // pushing all second level pokemon names for a specie in the second level array
          if (evoLevelTwoArray.length > 0) {
            evoLevelTwoArray.forEach(function(pokemon) {
              secondLevel.push(pokemon.species.name);
            });
          }
          
          // pushing all third level pokemon names for a specie in the third level array
          if (evoLevelThreeArray.length > 0) {
            evoLevelThreeArray.forEach(function(pokemon) {
              thirdLevel.push(pokemon.species.name);
            });
          }
          
          // sending the right information depending on the evolution chain
          if (first === current && secondLevel.length > 0) {    // if the current pokemon is the first in the chain and there is a second level
            if (thirdLevel.length === 0) {
              convo.say(displayName + ' \u21e8 ' + beautifyWordsArrays(secondLevel));
            } else {
              convo.say(displayName + ' \u21e8 ' + beautifyWordsArrays(secondLevel) + ' \u21e8 ' + beautifyWordsArrays(thirdLevel));
            }
            
            evoLevelTwoArray.forEach(function(pokemon) {
              var evolved = capitalizeFirst(splitJoin(pokemon.species.name));
              var details = pokemon.evolution_details[0];  //   check if only for locations? also potential feature: display only if location is in current game
              var evolution_details = pokemon.evolution_details;
              var locationsArray = [];
              if (evolution_details.length > 1) {
                evolution_details.forEach(function(index) {
                  var locationFound = ' ' + capitalizeFirst(splitJoin(index.location.name));
                  locationsArray.push(locationFound);
                });
              }
              sayEvolutionInfos(convo, details, current, evolved, evolutionInfos, displayName, locationsArray);
            });
            convo.say({attachment: newSearchMenu});
          } 
          
          else if (first === current && secondLevel.length === 0) {  // if the current pokemon is the first in the chain and there is no second level
            convo.say(displayName + ' doesn\'t have any known evolution.');
            convo.say({attachment: newSearchMenu});
          } 
          
          else if (secondLevel.indexOf(current) !== -1 && thirdLevel.length > 0) {  // if the current pokemon is the second in the chain and there is a third level
            convo.say(capitalizeFirst(splitJoin(first)) + ' \u21e8 ' + beautifyWordsArrays(secondLevel) + ' \u21e8 ' + beautifyWordsArrays(thirdLevel));
            
            evoLevelThreeArray.forEach(function(pokemon) {
              var evolved = capitalizeFirst(splitJoin(pokemon.species.name));
              var details = pokemon.evolution_details[0];  //   check if only for locations? also potential feature: display only if location is in current game
              
              var evolution_details = pokemon.evolution_details;
              var locationsArray = [];
              if (evolution_details.length > 1) {
                evolution_details.forEach(function(index) {
                  var locationFound = ' ' + capitalizeFirst(splitJoin(index.location.name));
                  locationsArray.push(locationFound);
                });
              }
              
              sayEvolutionInfos(convo, details, current, evolved, evolutionInfos, displayName, locationsArray);
            });
            convo.say({attachment: newSearchMenu});
          } 
          
          else if (secondLevel.indexOf(current) !== -1 && thirdLevel.length === 0) {  // if the current pokemon is the second in the chain and there is no third level
            convo.say(capitalizeFirst(splitJoin(first)) + ' \u21e8 ' + beautifyWordsArrays(secondLevel));
            convo.say(displayName + ' is at it\'s final evolution stage.');
            convo.say({attachment: newSearchMenu});
          } 
          
          else if (thirdLevel.indexOf(current) !== -1) {
            convo.say(capitalizeFirst(splitJoin(first)) + ' \u21e8 ' + beautifyWordsArrays(secondLevel) + ' \u21e8 ' + beautifyWordsArrays(thirdLevel));
            convo.say(displayName + ' is at it\'s final evolution stage.');
            convo.say({attachment: newSearchMenu});
          }
        } else {
          bot.reply(message, 'error');
          return;
        }
      });
    } else {
      bot.reply(message, 'error');
      return;
    }
  });
}


// EVOLUTION TRIGGERS

function trigger(triggerType, details) {
  if (triggerType === 'level-up') {
    return ' by leveling up'; 
  } else if (triggerType === 'trade') {
    return ' after being traded with another player';
  } else if (triggerType === 'use-item') {
    return ' by being exposed to: ' + splitJoin(details.item.name);
  } else if (triggerType === 'shed') {
    return ' by shedding (?)'; // ? change this  
  }
}


// EVOLUTION CONDITIONS DISPLAY

function sayEvolutionInfos(convo, details, current, evolved, evolutionInfos, displayName, locationsArray) {
  var conditions = ':';
  var shouldDisplay = false;
  
  function displayConditions(bool) {
    if (bool === true) {
      return conditions;
    } else {
      return;
    }
  }
  
  if (details.min_level) {
    conditions += '\n• at level ' + details.min_level;
  }
  if (details.min_beauty) {
    conditions += '\n• min. beauty level: ' + details.min_beauty;  // verify
  }
  if (details.time_of_day.length > 1) {
    conditions += '\n• during the ' + details.time_of_day;
  }
  if (details.gender) {
    conditions += '\n• it\'s gender must be: ' + details.gender;  // verify
  }
  if (details.relative_physical_stats) {
    conditions += '\n• phys. stats: ' + details.relative_physical_stats; // verify
  }
  if (details.needs_overworld_rain) {
    conditions += '\n• while it\'s raining in the overworld';
  }
  if (details.turn_upside_down) {
    conditions += '\n• you have to turn your 3DS upside down';  // verify
  }
  if (details.item) {
    conditions += '\n• using this item: ' + splitJoin(details.item.name);  // might not be needed if only comes up with item evolution trigger
  }
  if (details.known_move_type) {
    conditions += '\n• while knowing a ' + splitJoin(details.known_move_type.name) + '-type move';
  }
  if (details.min_affection) {
    conditions += '\n• while having at least ' + details.min_affection + ' affection hearts in Pokémon-Amie';
  }
  if (details.party_type) {
    conditions += '\n• party type: ' + details.party_type;  // verify
  }
  if (details.trade_species) {
    conditions += '\n• trade_species: ' + details.trade_species; // verify
  }
  if (details.party_species) {
    conditions += '\n• while having a ' + capitalizeFirst(details.party_species.name) + ' in your party';
  }
  if (details.min_happiness) {
    conditions += '\n• with a minimum happiness level of ' + details.min_happiness;  // verify
  }
  if (details.held_item) {
    conditions += '\n• while holding: ' + splitJoin(details.held_item.name); // verify
  }
  if (details.known_move) {
    conditions += '\n• while knowing the move: ' + capitalizeFirst(splitJoin(details.known_move.name)); 
  }
  if (locationsArray.length > 0) {
    conditions += '\n• while being located in either:' + locationsArray;
  }
  
  if (conditions.length > 1) {
    shouldDisplay = true;
  }
  
  convo.say(displayName + ' evolves to ' + evolved + trigger(details.trigger.name, details) + displayConditions(shouldDisplay));
  // find a nice separator (for multiple evolutions like Eevee).... stars ? '\u2606'
}


// TEXT DISPLAY FUNCTIONS

function displayGameName(game) {
  var array = game.split(' ');
  if (array.length === 4) {
    var first = array[0]+' '+array[1];
    var second = array[2]+' '+array[3];
    return capitalizeFirst(first + ' / ' + second);
  } else {
    return capitalizeFirst(array.join(' / '));
  }
}

function beautifyWordsArrays(array) {
  var newArray = array.map(function(item) {
    var words = [];
    
    if (item.indexOf('-') !== -1) {
      words = item.split('-');
    } else {
      words.push(item);
    }
    
    var capitalizedWords = words.map(function(word) { 
      return ' ' + capitalizeFirst(word);
    });
    
    var joinCapitalizedWords = capitalizedWords.join('');
    return joinCapitalizedWords;
  });
  return newArray;
}

function capitalizeFirst(pokemonName) {
  return pokemonName.replace(/\b./g, function(m){ return m.toUpperCase(); });
}

function splitJoin(sentence) {
  return sentence.split('-').join(' ');
}

function reverseSplitJoin(sentence) {
  return sentence.split(' ').join('-');
}

// TO DO LIST:
/* 
  - info on types
  - test with multiple users
  - help section
  - read me
  - test more pokemon evolutions (triggers / conditions) 
*/