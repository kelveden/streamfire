streamfire
==========

> WARNING: Very much a work-in-progress; that being said, I'm using it every day and so intend to keep updating it until it
works to my satisfaction. So, feel free to raise issues/feature requests but bear in mind you might be ignored for a while
whilst I concentrate on the functionality I want :-)

> WARNING: Following on from the above warning - note that the source code is very much in "prototype mode" at the moment whilst I dabble with it. So, don't expect nice looking code or tests just yet! They'll be there soon though fear not :-)

Simple [Campfire](http://campfirenow.com) client running on nodejs to stream room output to terminal. Functionality:

* Stream the content from a specified campfire room to stdout
* Allow sending of messages to the same room via stdin

That's it. So, this is NOT meant to be a full-featured library of nodejs bindings to Campfire.

Installation
------------
streamfire is not installed to npm just yet as it's still very much pre-release (see caveat at top of README). You can
still install from code very easily though:

    git clone git@github.com:kelveden/streamfire.git
    cd streamfire
    sudo npm link
  
That will create a symlink from the source into your global node modules. Reverse the process with `sudo npm unlink`.

Configuration
-------------
streamfire needs to know your Campfire API token and domain. To this end create a file `~/.streamfire/config.json` and put
the following in it:

    {
      "domain": "your-campfire-domain",
      "apiToken": "your-campfire-api-token",
      "alertOn": [ "match1", "match2", ..., "matchX" ]
    }

The `domain` is just the subdomain of `campfirenow.com` you use for your rooms - e.g. `mydomain.campfirenow.com`.
The `alertOn` field is a list of pieces of text to match on in each room. (Each text fragment is treated as a case-insensitive
regular expression internally; so feel free to use regular expressions.) When a match occurs the body of the matching
message will be sent as a notification to the underlying OS. (This is done simply by pushing the message via
[node-growl](https://github.com/visionmedia/node-growl) so see the documentation for that if you are not getting alerts.)

Usage
-----
To join a room:

    streamfire join <your-room-id>

If you connect successfully you'll get shown all the recent messages in the room. Simply type into stdin to send messages to the room.


