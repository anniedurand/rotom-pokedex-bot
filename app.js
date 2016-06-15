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
          'title':'That\'s all for now',
          'payload':'thatsall-button'
          }
        ]
      }
    ]
  }
};


var userFirstRun = {};

// user said hello
controller.hears(['hello', '^hi$', '^yo$', '^hey$', 'what\'s up'], 'message_received', function(bot, message) {  // NOTE: Change dialog, add user nickname question linked with database
  if (!userFirstRun[message.user]) {
    userFirstRun[message.user] = 'done';
    bot.startConversation(message, function(err, convo) {
      convo.say('Hey there. Nice to meet you!');
      convo.say({attachment: mainMenu});
    });
  } else {
    bot.startConversation(message, function(err, convo) {
      convo.say('Hello, nice to see you again!');
      convo.say({attachment: mainMenu});
    });
  }
});


// HELP SECTION
controller.hears('^help$', 'message_received', function(bot, message) {
  bot.startConversation(message, function(err, convo) {
    convo.say('I am a work in progress. Try saying "pokemon" or "hi"!');
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

controller.hears(['^pokemon$', 'search'], 'message_received', searchPokemon);

function searchPokemon(bot, message) {
  bot.startConversation(message, function(err, convo) {
    if (!err) {
      convo.ask('Which Pokémon would you like to know more about? Say it\'s name or national pokedex entry number.', function(response, convo) {
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
        }
        
        // finding the entry
        if (chosenPokemonId || chosenPokemonName) {
          request('https://pokeapi.co/api/v2/pokedex/1/', function (err, result) {
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
                    displayFoundPokemon(bot, message, foundPokemon, pokemonName);
                  }
                });
              } else if (chosenPokemonName) {   // if it's a name
                pokemon_entries.forEach(function(index) {
                  var pokemonName = index.pokemon_species.name;
                  if (pokemonName.indexOf(chosenPokemonName) !== -1) {
                    foundPokemon = index.pokemon_species.url;
                    displayFoundPokemon(bot, message, foundPokemon, pokemonName);
                  }
                });
              }
              
              if (foundPokemon === null) {
                bot.reply(message, 'Sorry, I couldn\'t find the Pokémon that you requested.');
              }
              
              console.log(chosenPokemonId)
              console.log(chosenPokemonName)
              console.log(foundPokemon)
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

function displayFoundPokemon(bot, message, foundPokemon, pokemonName) {
  request(foundPokemon, function (err, result) {
    if (!err) {
      var resultObject = JSON.parse(result.body);
      var nationalDexNo = resultObject.pokedex_numbers[(resultObject.pokedex_numbers.length -1)].entry_number;
      var pokemonChainUrl = resultObject.evolution_chain.url;
      
      if (nationalDexNo) {
        request('https://pokeapi.co/api/v2/pokemon/' + nationalDexNo, function(err, result) {
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
                    'title': 'No. ' + nationalDexNo + ', ' + displayName + isBaby,
                    'image_url': pokemonInfo.sprites.front_default,
                    'subtitle': 'Type(s) : ' + pokemonTypes,
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
                // return;
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
}

controller.on('facebook_postback', function(bot, message) {
  var messageSplit = message.payload.split('*');
  var onButtonPress = messageSplit[0];
  
  if (messageSplit.length > 1) {
    var pokemonName = messageSplit[1];
    var pokemonChainUrl = messageSplit[2];
    var displayName = messageSplit[3];
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
});

function evolutionChain(bot, message, pokemonName, pokemonChainUrl, displayName) {
  
  request(pokemonChainUrl, function (err, result) {
    if (!err) {
      var evolutionInfos = JSON.parse(result.body);
      
      bot.startConversation(message, function(err, convo) {
        var evoLevelTwoArray = evolutionInfos.chain.evolves_to;
        var evoLevelThreeArray = evolutionInfos.chain.evolves_to[0].evolves_to;
        
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
            var details = pokemon.evolution_details[0];  // verify length; is there possibly more than 1?
            sayEvolutionInfos(convo, details, current, evolved, evolutionInfos, displayName);
          });
          convo.say({attachment: mainMenu});
        } 
        
        else if (first === current && secondLevel.length === 0) {  // if the current pokemon is the first in the chain and there is no second level
          convo.say(displayName + ' doesn\'t have any known evolution.');
          convo.say({attachment: mainMenu});
        } 
        
        else if (secondLevel.indexOf(current) !== -1 && thirdLevel.length > 0) {  // if the current pokemon is the second in the chain and there is a third level
          convo.say(capitalizeFirst(splitJoin(first)) + ' \u21e8 ' + beautifyWordsArrays(secondLevel) + ' \u21e8 ' + beautifyWordsArrays(thirdLevel));
          
          evoLevelThreeArray.forEach(function(pokemon) {
            var evolved = capitalizeFirst(splitJoin(pokemon.species.name));
            var details = pokemon.evolution_details[0];  // verify length; is there possibly more than 1?
            sayEvolutionInfos(convo, details, current, evolved, evolutionInfos, displayName);
          });
          convo.say({attachment: mainMenu});
        } 
        
        else if (secondLevel.indexOf(current) !== -1 && thirdLevel.length === 0) {  // if the current pokemon is the second in the chain and there is no third level
          convo.say(capitalizeFirst(splitJoin(first)) + ' \u21e8 ' + beautifyWordsArrays(secondLevel));
          convo.say(displayName + ' is at it\'s final evolution stage.');
          convo.say({attachment: mainMenu});
        } 
        
        else if (thirdLevel.indexOf(current) !== -1) {
          convo.say(capitalizeFirst(splitJoin(first)) + ' \u21e8 ' + beautifyWordsArrays(secondLevel) + ' \u21e8 ' + beautifyWordsArrays(thirdLevel));
          convo.say(displayName + ' is at it\'s final evolution stage.');
          convo.say({attachment: mainMenu});
        }
      });
    }
  });
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
  return pokemonName.charAt(0).toUpperCase() + pokemonName.slice(1);
}

function splitJoin(sentence) {
  return sentence.split('-').join(' ');
}

function reverseSplitJoin(sentence) {
  return sentence.split(' ').join('-');
}

function trigger(triggerType, details) {
  if (triggerType === 'level-up') {
    return ' by leveling up:'; 
  } else if (triggerType === 'trade') {
    return ' after being traded with another player:';
  } else if (triggerType === 'use-item') {
    return ' by being exposed to: ' + splitJoin(details.item.name) + '.';
  } else if (triggerType === 'shed') {
    return ' by shedding (?):'; // ? change this  
  }
}

function sayEvolutionInfos(convo, details, current, evolved, evolutionInfos, displayName) {
  var conditions = '';
  
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
  // if (details.item) {
  //   conditions += '\n• using this item: ' + splitJoin(details.item.name);  // might not be needed if only comes up with item evolution trigger
  // }
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
    conditions += '\n• min. happiness level: ' + details.min_happiness;  // verify
  }
  if (details.held_item) {
    conditions += '\n• while holding: ' + splitJoin(details.held_item.name); // verify
  }
  if (details.known_move) {
    conditions += '\n• while knowing the move: ' + capitalizeFirst(splitJoin(details.known_move.name)); 
  }
  if (details.location) {
    conditions += '\n• while being near: ' + splitJoin(details.location.name);  // see for example eevee to leafeon or glaceon evolution, fix the results.
  }
  
  convo.say(displayName + ' evolves to ' + evolved + trigger(details.trigger.name, details) + conditions);
  
  // find a nice separator (for multiple evolutions like Eevee).... stars ? '\u2606'
}



// NOTES for later

// var second;
// var third;

// convo.say('This Pokémon evolution chain starts with ' + capitalizeFirst(evolutionInfos.chain.species.name));
// if (evolutionInfos.chain.evolves_to[0].species.name !== null) {
//   second = capitalizeFirst(evolutionInfos.chain.evolves_to[0].species.name);
//   convo.say('Followed by ' + second);
// }
// if (evolutionInfos.chain.evolves_to[0].evolves_to[0].species.name !== null) {
//   third = capitalizeFirst(evolutionInfos.chain.evolves_to[0].evolves_to[0].species.name);
//   convo.say('And finally ' + third);
// }