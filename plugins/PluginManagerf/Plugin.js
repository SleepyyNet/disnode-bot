
const axios = require('axios');
class PluginManager {

  default(command) { // This is the default command that is ran when you do your bot prefix and your plugin prefix example   !ping
    const sizeof = require('object-sizeof');
    var self = this;

    var evals = eval(command.params[0]);
    console.log(evals);
    self.disnode.bot.SendCompactEmbed(command.msg.channel, "SIZE", sizeof(evals));
  }

  commandAdd(command) {
    var self = this;
    if (!command.params[0]) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a Plugin ID! (Can be found at http://disnodeteam.com/#/plugins)");
      return;
    }
    self.disnode.bot.SendMessage(command.msg.channel, "**Downloading Plugin:** `" + command.params[0] + "`")
    self.pluginManager.AddServerPluginRemote(command.params[0]).then(function () {
      self.disnode.bot.SendCompactEmbed(command.msg.channel, "Success :white_check_mark: ", "**Added Plugin! This plugin can now be used and configured for this server!:** `" + command.params[0] + "`");

    });
  }
  commandList(command) {
    var self = this;
    var LoadedText = "";

    for (var i = 0; i < self.pluginManager.plugins.length; i++) {
      var _plugin = self.pluginManager.plugins[i];
      LoadedText += " - **" + _plugin.name + "** - *" + _plugin.id + "* - `" + _plugin.path + "`\n";
    }

    var LaucnhedText = "";

    for (var i = 0; i < self.pluginManager.instances.length; i++) {
      var _plugin = self.pluginManager.instances[i];
      LaucnhedText += " - **" + _plugin.name + "** - *" + _plugin.id + "* - `" + _plugin.path + "`\n";
    }

    self.disnode.bot.SendEmbed(command.msg.channel, {
      color: 3447003,
      author: {},
      fields: [{
        name: "**Server**",
        inline: true,
        value: "**Server:** `" + self.server + "`"
      },
      {
        name: "Stats",
        inline: true,
        value: "**Instances:** `" + self.pluginManager.instances.length + "` **- Loaded:** `" + self.pluginManager.plugins.length + '`'
      },
      {
        name: "Loaded",
        inline: true,
        value: LoadedText
      }, {
        name: "Launched",
        inline: true,
        value: LaucnhedText
      }],
      footer: {}
    });

    self.Destory();

  }
  commandInfo(command) {
    console.log("INFO!");
    var self = this;
    if (!command.params[0]) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a Plugin ID! (Can be found at http://disnodeteam.com/#/plugins)");
      return;
    }
    self.disnode.bot.SendMessage(command.msg.channel, "**Getting Plugin:** `" + command.params[0] + "`")

    axios.get("https://www.disnodeteam.com/api/plugins/" + command.params[0]).then(function (res) {
      var suc = res.data.type;
      switch (suc) {
        case "SUC":
          self.disnode.bot.SendEmbed(command.msg.channel, {
            color: 3447003,
            author: {},
            fields: [{
              name: "**Name**",
              inline: true,
              value: "**Name:** `" + res.data.data.name + "`"
            },
            {
              name: "Desc",
              inline: true,
              value: "**Desc:** `" + res.data.data.description + '`'
            },
            {
              name: "Verified",
              inline: true,
              value: self.parseBool(res.data.data.verified, "<:plugin_verified:320783752265596928> (Verified)")
            }, {
              name: "Offical",
              inline: true,
              value: self.parseBool(res.data.data.official, "<:plugin_official:320783752110276618> (Made by Disnode)")
            }, {
              name: "Ultra Rewards",
              inline: true,
              value:self.parseBool(res.data.data.ultraReward, "<:plugin_ultra_rewards:320783752026390528> (Rewards for Ultra Users)")
            }],
            footer: {}
          });

          break;
        case "ERR":
          self.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", res.data.data);
          break;
      }
    });
  }
  parseBool(val, render){
    if(val){return render;}
  }
  commandBrowse(command) {
    var self = this;

    axios.get("http://www.disnodeteam.com/api/plugins/").then(function (res) {
      var suc = res.data.type;
      switch (suc) {
        case "SUC":
          var plugins = res.data.data;
          var page = 1;
          var maxindex;
          var startindex;
          if (parseInt(command.params[0]) >= 1) {
            page = Number(parseInt(command.params[0]));
          }
          if (page == 1) {
            page = 1;
            startindex = 0
            maxindex = 10;
          } else {
            maxindex = (page * 10);
            startindex = maxindex - 10;
          }

          var msg = "**Page:** " + page + "\n";
          for (var i = startindex; i < plugins.length; i++) {
            if (i == maxindex) break;
            if (plugins[i].verified) { msg += "-`" + plugins[i].id + "` - **" + plugins[i].name + "** - *" + plugins[i].description + "*\n"; }



          }
          self.disnode.bot.SendCompactEmbed(command.msg.channel, "Plugins (Only Verified Plugins, see http://disnodeteam.com/#/plugins for all)", msg);


          break;
        case "ERR":
          self.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", res.data.data);
          break;
      }
    });
  }

  commandRemove(command) {
    var self = this;
    if (!command.params[0]) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a Plugin ID! (Can be found at http://disnodeteam.com/#/plugins)");
      return;
    }

    self.pluginManager.RemoveServerPlugin(command.params[0]);
  }


  commandSet(command) {
    var self = this;
    var plugin = command.params[0];
    var file = command.params[1];
    var key = command.params[2];
    var value = command.params[3];

    if (!plugin) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a Plugin ID!");
      return;
    }
    if (!file) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a file (config, command)!");
      return;
    }
    if (!key) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a key!");
      return;
    }
    if (!value) {
      this.disnode.bot.SendCompactEmbed(command.msg.channel, "Error :warning: ", "Please Enter a value!");
      return;
    }

    var pluginManager = self.disnode.server.GetPluginInstance(self.server);

    switch (file) {
      case "config":

        
        break;
    }

  }



}
module.exports = PluginManager;