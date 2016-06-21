# Rotom Pokédex Bot

### Table of Contents

* [Introduction](#1)
* [What it does](#2)
* [Behind the Bot](#3)
* [User privacy](#4)
* [What it currently cannot do](#5)
* [What it won't ever do](#6)
* [Contact](#7)

## <a name="1">Introduction</a>

The purpose of this bot is to assist me - and potentially other players - while playing handheld Pokémon games. Specifically, the ones who want to fill their Pokédex. 

It lives in Facebook Messenger and replies to various user requests. **It has now been reviewed and approved by Facebook and anyone can send messages to it!** *However it is still in beta testing and I keep on improving features, therefore bugs might happen.*

* [Rotom Pokédex Bot on Facebook](https://www.facebook.com/Rotom-Pok%C3%A9dex-Bot-541426089377828/)
* [Rotom Pokédex Bot on Messenger](https://www.messenger.com/t/541426089377828)

## <a name="2">What it does</a>

Rotom Pokédex Bot can **find any Pokémon** through **any Pokédex** of a given game (or National Pokédex if left to default) either with a name or Pokédex entry number. It can tell you about the requested Pokémon's **evolution trigger and conditions**. It can also search for a specific **type** and say what it's good or bad against.
*Keep in mind that all Pokémon/evolutions are up to date and therefore, results might be less accurate for older games.*

All the functions are available through menus, though they can also be called by saying things like "pokemon", "pokedex", "type", "help". To access the main menu, simply say "hi" or "hello".

![screenshot 1](img/1.png?raw=true) ![screenshot 2](img/2.png?raw=true) ![screenshot 3](img/3.png?raw=true) 

![screenshot 4](img/4.png?raw=true) ![screenshot 5](img/5.png?raw=true)

## <a name="3">Behind the Bot</a>

This bot was developed using [Botkit](https://howdy.ai/botkit/) in Node.js.

It also couldn't have been possible to make if it wasn't for the [PokéAPI](http://pokeapi.co/) (thank you!!!)

Other technologies used: 
* Messenger's Send API
* NPM Request for API calls
* Currently running on a free Heroku plan

## <a name="4">User privacy</a>

This bot does not ask nor keep any personal or sensitive user information, and never will. It only keeps track of you current game and associated Pokédex/region; if you tell it to set one, that is. 
That information is saved in a global object with the user's Messenger ID as a key. When Rotom goes to sleep, it forgets everything.

## <a name="5">What it currently cannot do</a>

* Find or display special / Mega Pokémon
* Display how / where to get evolution triggering items
* Display encounter locations per Pokémon

I might, or might not, add them in the future.

## <a name="6">What it won't ever do</a>

* Display Pokémon stats 
* Display Pokémon moves

*If you were looking for these functionalities, sorry! This bot probably isn't for you. :)*

## <a name="7">Contact</a>

If you have questions, suggestions, etc. feel free to contact me! My email is displayed on my [profile page](https://github.com/poe21).