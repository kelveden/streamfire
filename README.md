streamfire
==========
[![Build Status](https://travis-ci.org/kelveden/streamfire.png?branch=master)](https://travis-ci.org/kelveden/streamfire)

> Note that the source code is very much in "prototype mode" at the moment whilst I dabble with it. So, don't expect nice looking code or tests just yet. They'll be there soon though, fear not.

Simple [Campfire](http://campfirenow.com) client running on nodejs to stream room output to terminal. Functionality:

* Stream the content from a specified campfire room to stdout
* Allow sending of messages to the same room via stdin

That's it. So, this is NOT meant to be a full-featured library of nodejs bindings to Campfire.

Installation
------------
To create a global symlink to the streamfire binary:

    npm install -g streamfire

If you prefer to use from source then take advantage of `npm link`:

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
 * The `rooms` field allows specification of room aliases so that you can enter the alias rather than the room id at the command line
 (e.g. `streamfire join myroom` instead of `streamfire join 1234`.)

Usage
-----
To join a room:

    streamfire (<your-room-id>|<your-room-alias>)

If you connect successfully you'll get shown all the recent messages in the room.

Creating new messages
---------------------
 * Simply type into stdin to send messages to the room.
 * Paste in multi-line text into a single message - but make sure that the last line has a carriage return at the end.
 * Start typing the name of a user already in the room and then use tab to auto-complete.

More goodies
------------

Press `F1` once in a room to get a list of the available hotkeys. They currently are:

 * `F1`: Display help
 * `F2`: List users currently in room
 * `F3`: Open room in default browser

Room List
---------
To get a list of the available rooms just run streamfire with no arguments; i.e.

    streamfire
