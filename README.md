streamfire
==========
[![Build Status](https://travis-ci.org/kelveden/streamfire.png?branch=master)](https://travis-ci.org/kelveden/streamfire)

Simple [Campfire](http://campfirenow.com) client that streams the room to terminal.

Features
--------

* Stream the content from a specified campfire room to stdout.
* Allow sending of messages to the same room via stdin.
* Paste multi-line messages.

That's it. Well, that's not completely true; there are the following bonus features too:

* Auto-complete the name of a user in the room (Tab key).
* List the users currently logged into the room (F2 key).
* Open the room in a browser (F3 key)
* Search a given room for messages matching a specific search term.

Installation
------------
streamfire runs as a nodejs executable. So, to create a global symlink to the streamfire binaries:

    npm install -g streamfire

Or, if you prefer to use from source then take advantage of `npm link`:

    git clone git@github.com:kelveden/streamfire.git
    cd streamfire
    npm install
    sudo npm link
  
That will create a symlink from the source into your global node modules. Reverse the process with `sudo npm unlink`.

Configuration
-------------
streamfire needs to know your Campfire API token and domain. To this end create a file `~/.streamfire/config.json` and put
the following in it:

    {
      "domain": "your-campfire-domain",
      "apiToken": "your-campfire-api-token",
      "alertOn": [ "match1", "match2", ..., "matchX" ],
      "locale": "en-GB"
      "rooms": [
        { "id": 1234, "alias": "myroom" },
        { "id": 5678, "alias": "anotherroom" }
      ]
    }

 * The `domain` is just the subdomain of `campfirenow.com` you use for your rooms - e.g. `mydomain.campfirenow.com`.
 * The `alertOn` field is a list of text fragments to match against messages in each room. (Each text fragment is treated as a case-insensitive
regular expression internally; so feel free to use regular expressions.) When a match occurs the body of the matching
message will be sent as a notification to the underlying OS. (This is done by pushing the message via
[node-growl](https://github.com/visionmedia/node-growl) so see the documentation for that if you are not getting alerts.)
 * The `locale` field is used to format dates in the room output. (Defaults to "en-GB" if not specified.)
 * The `rooms` field allows specification of room aliases so that you can enter the alias rather than the room id at the command line
 (e.g. `streamfire myroom` instead of `streamfire 1234`.)

Usage
-----
### To list all available rooms and aliases

    streamfire

### To join a room:

    streamfire (<your-room-id>|<your-room-alias>)

E.g. `streamfire myroom`. If you connect successfully you'll get shown all the recent messages in the room.

### To search a room:

    streamfire-search (<your-room-id>|<your-room-alias>) <search-term>
    
E.g. `streamfire myroom "some term or other"`. The output will be a list of all messages that match.


Creating new messages
---------------------
 * Simply type into stdin to send messages to the room.
 * Paste in multi-line text into a single message - but make sure that the last line has a carriage return at the end, otherwise that line won't be sent.
 * Start typing the name of a user already in the room and then use tab to auto-complete.

More goodies
------------

Press `F1` once in a room to get a list of the available hotkeys. They currently are:

 * `F1`: Display help
 * `F2`: List users currently in room
 * `F3`: Open room in default browser

Searching a room
----------------
See usage section above.
