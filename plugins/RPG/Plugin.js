const RPGUtils = require('./RPGUtils.js');
const sleep = require('system-sleep');
class RPGPlugin {
  constructor() {
    var self = this;
    self.DB = {};
    self.utils = {};
  }
  Init(onComplete) {
    var self = this;
    setTimeout(function() {
      self.disnode.db.InitPromise({}).then(function(dbo) {
        self.DB = dbo;
        self.utils = new RPGUtils(self);
        onComplete();
      });
    }, 100);
  }
  default (command) {
    var self = this;
    var msg = "";
    for (var i = 0; i < self.commands.length; i++) {
      msg += self.disnode.botConfig.prefix + self.config.prefix + " " + self.commands[i].cmd + " - " + self.commands[i].desc + "\n";
    }
    msg = msg.replace("!rpg dev - *Dev command*\n", "");
    self.disnode.bot.SendEmbed(command.msg.channel_id, {
      color: 3447003,
      author: {},
      fields: [{
        name: 'Disnode RPG',
        inline: true,
        value: "Hello, " + command.msg.author.username + "!",
      }, {
        name: 'Commands:',
        inline: false,
        value: msg,
      }, {
        name: 'Discord Server',
        inline: false,
        value: "**Join the RPG Server for Support and More!:** https://discord.gg/2dzZSgk",
      }],
      footer: {}
    });
  }
  adv(command) {
    var self = this;
    var prefix = '``!rpg adventure';
    self.utils.GetUser(command).then(function(player) {
      switch (command.params[0]) {
        case "start":
          if (player.adventure.type != "") {
            self.embed(command, "Adventure Error", "You are already fighting a " + player.adventure.Name);
            return;
          }
            self.utils.GetMobs(player.lvl).then(function(res) {
              var mob = [];
              for (var i = 0; i < res.length; i++) {
                if (res[i].lvlmin <= player.lvl && res[i].lvlmax >= player.lvl) {
                  mob.push(res[i]);
                }
              }
              var cm = mob[self.utils.theMaths(0, mob.length - 1)];
              player.adventure.type = cm.type;
              player.adventure.Name = cm.Name;
              player.adventure.MaxHealth = cm.MaxHealth;
              player.adventure.MinDamage = cm.MinDamage;
              player.adventure.MaxDamage = cm.MaxDamage;
              player.adventure.MinDefense = cm.MinDefense;
              player.adventure.MaxDefense = cm.MaxDefense;
              player.adventure.lvlmin = cm.lvlmin;
              player.adventure.lvlmax = cm.lvlmax;
              player.adventure.minXP = cm.minXP;
              player.adventure.maxXP = cm.maxXP;
              player.adventure.minGold = cm.minGold;
              player.adventure.maxGold = cm.maxGold;
              self.disnode.bot.SendMessage(command.msg.channel_id, cm.Name + '\n' + cm.lvlmin + '/' + cm.lvlmax);
              self.utils.plugin.DB.Update("players", {
                "id": player.id
              }, player);
            });
          break;
        default:



      }
    });
  }
  guildCommand(command) {
    var self = this;
    var prefix = '``!rpg guild';
    self.utils.GetUser(command).then(function(player) {
      var usr = self.utils.GetUser(command.msg.author.id);
      if (command.params[0] == undefined) {
        var prefix = '``!rpg guild';
        self.embed(command, "Guild Commands", prefix + " create`` - Creates a guild.\n" + prefix + "info`` - Gets your guilds info.\n" + prefix + " invite`` - Invites a user to your guild.\n" + prefix + " join`` - Join a guild.\n" + prefix + " members`` - Lists all members in a guild.\n" + prefix + " deposit`` - Deposit gold into your guild.\n" + prefix + " set`` - Guild settings.");
        return;
      }
      switch (command.params[0]) {
        case "info":
          if (player.guild != '') {
            self.utils.GetGuild(player.guild).then(function(guild) {
              var officer = 0;
              var member = 0;
              for (var ids in guild.members) {
                if (guild.members.hasOwnProperty(ids)) {
                  if (guild.members[ids].role == 'officer') {
                    officer++;
                  } else if (guild.members[ids].role == 'member') {
                    member++;
                  }
                }
              }
              self.disnode.bot.SendEmbed(command.msg.channel_id, {
                color: 1752220,
                author: {},
                thumbnail: {
                  url: (guild.thumbnail == '') ? "" : guild.thumbnail,
                },
                title: guild.name + "\'s info",
                description: (guild.desc != '') ? guild.desc : "No description set!",
                fields: [{
                  name: 'Owner',
                  inline: true,
                  value: guild.owner_name,
                }, {
                  name: 'Status',
                  inline: true,
                  value: (guild.open) ? "Guild is open!" : "Guild is closed.",
                }, {
                  name: 'Gold',
                  inline: true,
                  value: (guild.gold),
                }, {
                  name: 'Members',
                  inline: true,
                  value: 'Officers: ``' + officer + '``\nMembers: ``' + member + '``\nTotal: ``' + guild.members.length + '``',
                }],
                footer: {
                  text: command.msg.author.username,
                  icon_url: self.utils.avatarCommandUser(command),
                },
                timestamp: new Date(),
              });
            });
          } else self.embed(command, "Guild Info Error", "You are not in a guild. Either Join a guild or create a new guild!")
          break;
        case "join":
          if (player.guild == '') {
            self.utils.GetGuildName(command.params.splice(1).join(" ")).then(function(guild) {
              if (!guild.open) {
                var invfound = false;
                var invpos;
                for (var i = 0; i < guild.invites.length; i++) {
                  if (guild.invites[i].id == player.id) {
                    invfound = true;
                    invpos = i;
                    break;
                  }
                }
                if (invfound) {
                  var newMember = {
                    name: player.name,
                    id: player.id,
                    role: "member"
                  }
                  player.guild = guild.id;
                  player.guildrole = "member";
                  guild.members.push(newMember);
                  guild.invites.splice(invpos, 1);
                  self.embed(command, "Guild Join", "Joined " + guild.name + "!");
                  self.disnode.bot.SendDM(guild.id, "Member Join", usr.username + '#' + usr.discriminator + ' has joined your guild.');
                  self.utils.plugin.DB.Update("guilds", {
                    "id": guild.id
                  }, guild);
                  self.utils.plugin.DB.Update("players", {
                    "id": player.id
                  }, player);
                } else {
                  self.embed(command, "Guild Join Error", "You are not invited to this guild and an invite is required to join!");
                }
              } else {
                var newMember = {
                  name: player.name,
                  id: player.id,
                  role: "member"
                }
                player.guild = guild.id;
                player.guildrole = "member";
                guild.members.push(newMember);
                self.utils.plugin.DB.Update("guilds", {
                  "id": guild.id
                }, guild);
                self.utils.plugin.DB.Update("players", {
                  "id": player.id
                }, player);
                self.embed(command, "Guild Join", "Joined " + guild.name + "!");
                self.disnode.bot.SendCompactEmbed(guild.id, "Member Join", usr.username + '#' + usr.discriminator + ' has joined your guild.');
              }
            }).catch(function(err) {
              self.embed(command, "Guild Join Error", "" + err);
            });
          } else self.embed(command, "Guild Join Error", "You are in a guild.");
          break;
        case "invite":
          if (player.guild != '') {
            self.utils.FindPlayer(command.params[1]).then(function(res) {
              if (res.found) {
                var FindPlayer = res.p;
                self.utils.GetGuild(player.guild).then(function(guild) {
                  if (guild.owner_id == player.id) {
                    var newInvite = {
                      name: FindPlayer.name,
                      id: FindPlayer.id
                    }
                    guild.invites.push(newInvite);
                    self.utils.plugin.DB.Update("guilds", {
                      "id": guild.id
                    }, guild);
                    self.embed(command, "Guild Invite", FindPlayer.name + " was invited to the guild.");
                  } else self.embed(command, "Guild Invite Error", "As of right now only guild owner can invite.");
                });
              } else {
                self.embed(command, "Guild Invite Error", res.msg);
              }
            });
          } else self.embed(command, "Guild Invite Error", "You are not in a guild.");
          break;
        case "members":
          if (player.guild != '') {
            self.utils.GetGuild(player.guild).then(function(guild) {
              var ms = "";
              for (var ids in guild.members) {
                if (guild.members.hasOwnProperty(ids)) {
                  ms += guild.members[ids].name + '  **|**  ' + guild.members[ids].role + '\n';
                }
              }
              self.disnode.bot.SendEmbed(command.msg.channel_id, {
                color: 1752220,
                author: {},
                fields: [{
                  name: guild.name + '\'s Members',
                  inline: true,
                  value: '\n\n' + ms,
                }],
                footer: {
                  text: command.msg.author.username,
                  icon_url: self.utils.avatarCommandUser(command),
                },
                timestamp: new Date(),
              });
            });
          }
          break;
        case "create":
          if (command.params[1]) {
            if (player.guild == '') {
              var params = command.params.splice(1).join(" ");
              self.utils.FindGuild(params).then(function(fg) {
                if (fg == false) {
                  self.utils.newGuild(player, params).then(function(guild) {
                    self.embed(command, "Guild Create", "Guild: " + guild.name + " Created!");
                    player.guild = player.id;
                    player.guildrole = "owner";
                    self.utils.plugin.DB.Update("players", {
                      "id": player.id
                    }, player);
                  });
                } else self.embed(command, "Guild Create Error", 'That guild name is taken.');
              });
            } else {
              self.embed(command, "Guild Create Error", "You can't create a new guild when you are already in one!");
            }
          } else {
            self.embed(command, "Guild Create Error", "Please provide a name! like `!rpg guild create MyGuildName`");
          }
          break;
        case "role":
          if (player.guild != '') {
            if (command.params[1] != '') {
              if (self.utils.parseMention(command.params[1]) != player.id) {
                self.utils.FindPlayer(command.params[1]).then(function(res) {
                  if (res.found) {
                    var FindPlayer = res.p;
                    self.utils.GetGuild(player.guild).then(function(guild) {
                      var foundOwner = false;
                      var foundFindPlayer = false;
                      var editmember = -1;
                      for (var i = 0; i < guild.members.length; i++) {
                        if (guild.members[i].id == player.id & guild.members[i].role == 'owner') foundOwner = true;
                        if (guild.members[i].id == FindPlayer.id) {
                          foundFindPlayer = true;
                          editmember = i;
                        }
                        if (foundOwner && foundFindPlayer) break;
                      }
                      if (foundOwner & foundFindPlayer) {
                        switch (command.params[2].toLowerCase()) {
                          case "member":
                            guild.members[editmember].role = command.params[2].toLowerCase();
                            FindPlayer.guildrole = command.params[2].toLowerCase();
                            self.utils.plugin.DB.Update("guilds", {
                              "id": guild.id
                            }, guild);
                            self.utils.plugin.DB.Update("players", {
                              "id": FindPlayer.id
                            }, FindPlayer);
                            self.embed(command, "Guild Member Role Set", FindPlayer.name + ' now has the member role.');
                            break;
                          case "officer":
                            guild.members[editmember].role = command.params[2].toLowerCase();
                            FindPlayer.guildrole = command.params[2].toLowerCase();
                            self.utils.plugin.DB.Update("guilds", {
                              "id": guild.id
                            }, guild);
                            self.utils.plugin.DB.Update("players", {
                              "id": FindPlayer.id
                            }, FindPlayer);
                            self.embed(command, "Guild Member Role Set", FindPlayer.name + ' now has the officer role.');
                            break;
                          default:
                            self.embed(command, "Guild Member Role Error", "Guild roles are ``officer`` and ``member``.");
                        }
                      } else {
                        if (!foundOwner) {
                          self.embed(command, "Guild Member Role Error", "Only guild owner can set roles.");
                        }
                      }
                    });
                  } else self.embed(command, "Guild Member Role Error", res.msg);
                });
              } else self.embed(command, "Guild Member Role Error", "Can't change your own role.");
            } else self.embed(command, "Guild Member Role Error", "No guild member inputed.");
          } else self.embed(command, "Guild Member Role Error", "You are not in a guild.");
          break;
        case "deposit":
          switch (command.params[1]) {
            case "gold":
              if (player.guild != '') {
                self.utils.GetGuild(player.guild).then(function(guild) {
                  if (player.gold > parseInt(command.params[2])) {
                    var pgold = player.gold - parseInt(command.params[2]);
                    var ggold = guild.gold + parseInt(command.params[2]);
                    player.gold = pgold;
                    guild.gold = ggold;
                    self.utils.plugin.DB.Update("guilds", {
                      "id": guild.id
                    }, guild);
                    self.utils.plugin.DB.Update("players", {
                      "id": player.id
                    }, player);
                    self.embed(command, "Guild Deposit", parseInt(command.params[2]) + ' gold deposited. You now have ' + pgold + ' gold.');
                  } else self.embed(command, "Guild Deposit Error", "You dont have " + command.params[2] + " gold to deposit.");
                });
              } else self.embed(command, "Guild Deposit Error", "You are not in a guild.");
              break;
            case "item":
              if (player.guild != '') {
                self.utils.GetGuild(player.guild).then(function(guild) {
                  if (isNaN(parseInt(command.params[2])) == true) {
                    var params = command.params.splice(2).join(" ").replace(/(^|\s)[a-z]/g, function(f) {
                      return f.toUpperCase();
                    });
                    var itemfound = false;
                    var gitemfound = false;
                    var amt;
                    var gamt;
                    var pos;
                    var gpos;
                    for (var i = 0; i < player.inv.length; i++) {
                      if (player.inv[i].defaultName == params) {
                        itemfound = true;
                        amt = player.inv[i].amount;
                        pos = i;
                        break;
                      }
                    }
                    for (var i = 0; i < guild.inv.length; i++) {
                      if (guild.inv[i].defaultName == params) {
                        gitemfound = true;
                        gamt = guild.inv[i].amount;
                        gpos = i;
                        break;
                      }
                    }
                    if (amt == 1) {
                      if (gitemfound == true) {
                        player.inv.splice(pos, 1);
                        guild.inv[gpos].amount = gamt + 1;
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", 'You have deposited your last ' + params + ' for a total of ' + (gamt + 1));
                      } else {
                        var itemObj = {
                          defaultName: params,
                          amount: 1
                        }
                        player.inv.splice(pos, 1);
                        guild.inv.push(itemObj);
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", 'You have deposited your last ' + params);
                      }
                    } else if (amt > 1) {
                      if (gitemfound == true) {
                        player.inv[pos].amount = amt - 1;
                        guild.inv[gpos].amount = gamt + 1;
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", params + ' deposited for a total of ' + (gamt + 1) + '\n\nYou now have x' + (amt - 1) + ' of ' + params);
                      } else {
                        var itemObj = {
                          defaultName: params,
                          amount: 1
                        }
                        player.inv[pos].amount = amt - 1;
                        guild.inv.push(itemObj);
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", params + ' deposited.\n\nYou now have x' + (amt - 1) + ' of ' + params);
                      }
                    }
                  } else {
                    var params = command.params.splice(3).join(" ").replace(/(^|\s)[a-z]/g, function(f) {
                      return f.toUpperCase();
                    });
                    var itemfound = false;
                    var gitemfound = false;
                    var amt;
                    var gamt;
                    var pos;
                    var gpos;
                    var num = parseInt(command.params[2]);
                    for (var i = 0; i < player.inv.length; i++) {
                      if (player.inv[i].defaultName == params) {
                        itemfound = true;
                        amt = player.inv[i].amount;
                        pos = i;
                        break;
                      }
                    }
                    for (var i = 0; i < guild.inv.length; i++) {
                      if (guild.inv[i].defaultName == params) {
                        gitemfound = true;
                        gamt = guild.inv[i].amount;
                        gpos = i;
                        break;
                      }
                    }
                    if (amt < num) {
                      self.embed(command, "Guild Deposit Error", "You don\'t have x" + num + ' of ' + params);
                    } else if (amt == num) {
                      if (gitemfound == true) {
                        player.inv.splice(pos, 1);
                        guild.inv[gpos].amount = gamt + num;
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", params + ' deposited for a total of ' + (gamt + num) + '\n\nYou have deposited all of your ' + params + '\'s');
                      } else {
                        var itemObj = {
                          defaultName: params,
                          amount: num
                        }
                        player.inv[pos].amount = amt - num;
                        guild.inv.push(itemObj);
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", params + ' deposited for a total of ' + num + '\n\nYou have deposited all of your ' + params + '\'s');
                      }
                    } else if (amt > num) {
                      if (gitemfound == true) {
                        player.inv[pos].amount = amt - num;
                        guild.inv[gpos].amount = gamt + num;
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", params + ' deposited for a total of ' + (gamt + num) + '\n\nYou now have x' + (amt - num) + ' of ' + params);
                      } else {
                        var itemObj = {
                          defaultName: params,
                          amount: num
                        }
                        player.inv[pos].amount = amt - num;
                        guild.inv.push(itemObj);
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.utils.plugin.DB.Update("players", {
                          "id": player.id
                        }, player);
                        self.embed(command, "Guild Deposit Item", params + ' deposited for a total of ' + (gamt + num) + '\n\nYou now have x' + (amt - num) + ' of ' + params);
                      }
                    }
                  }
                });
              }
              break;
          }
          break;
        case "leave":
          if (player.guild != '') {
            self.utils.GetGuild(player.guild).then(function(guild) {
              if (guild.owner_id != player.id) {
                var index;
                var mems = guild.members;
                for (var i = 0; i < guild.members.length; i++) {
                  if (guild.members[i].id == player.id) {
                    index = i;
                    break;
                  }
                }
                player.guild = "";
                player.guildrole = "";
                guild.members.splice(index, 1);
                self.utils.plugin.DB.Update("guilds", {
                  "id": guild.id
                }, guild);
                self.utils.plugin.DB.Update("players", {
                  "id": player.id
                }, player);
                self.disnode.bot.SendCompactEmbed(guild.id, "Member Leave", usr.username + '#' + usr.discriminator + ' has left your guild.');
                self.embed(command, "Guild Leave", "You have left " + guild.name + ".");
              } else {
                if (command.params[1] == undefined) {
                  self.embed(command, "Guild Leave Error", "You are the guild owner. Leaving will result in the guild being disbanded. To continue with leaving type ``!rpg guild leave yes``.");
                } else if (command.params[1].toLowerCase() == 'yes') {
                  self.embed(command, "Guild Disband", guild.name + " has been disbanded.");
                  for (var i = 0; i < guild.members.length; i++) {
                    self.utils.FindPlayer(guild.members[i].id).then(function(fp) {
                      fp.p.guild = "";
                      fp.p.guildrole = "";
                      self.utils.plugin.DB.Update("players", {
                        "id": fp.p.id
                      }, fp.p);
                    });
                  }
                  self.utils.plugin.DB.Delete("guilds", {
                    "id": player.guild
                  });
                }
              }
            });
          } else self.embed(command, "Guild Disband", "You are not in a guild.");
          break;
        case "inv":
          if (player.guild != '') {
            self.utils.GetGuild(player.guild).then(function(guild) {
              var headingStringA = "Name";
              var headingStringB = "|Amount"
              var itemsAmountArr = [];
              var itemsNameArr = [];
              var final = "";
              for (var i = 0; i < guild.inv.length; i++) {
                itemsAmountArr.push("|x" + guild.inv[i].amount);
                itemsNameArr.push(guild.inv[i].defaultName);
              }
              var AmountL = self.utils.getLongestString(itemsAmountArr);
              var NameL = self.utils.getLongestString(itemsNameArr);
              headingStringA = self.utils.addSpacesToString(headingStringA, NameL);
              headingStringB = self.utils.addSpacesToString(headingStringB, AmountL);
              final += headingStringA + headingStringB + "\n\n";
              for (var i = 0; i < itemsNameArr.length; i++) {
                itemsNameArr[i] = self.utils.addSpacesToString(itemsNameArr[i], NameL);
              }
              for (var i = 0; i < itemsAmountArr.length; i++) {
                itemsAmountArr[i] = self.utils.addSpacesToString(itemsAmountArr[i], AmountL);
              }
              for (var i = 0; i < itemsNameArr.length; i++) {
                final += itemsNameArr[i] + itemsAmountArr[i] + "\n";
              }
              self.disnode.bot.SendEmbed(command.msg.channel_id, {
                color: 1752220,
                author: {},
                fields: [{
                  name: guild.name + "\'s Inventory",
                  inline: true,
                  value: "`\n" + final + "`",
                }],
                footer: {
                  text: command.msg.author.username,
                  icon_url: self.utils.avatarCommandUser(command),
                },
                timestamp: new Date(),
              });
            });
          } else self.embed(command, "Guild Disband", "You are not in a guild.");
          break;
        case "set":
          if (command.params[1] == undefined) {
            var prefix = '``!rpg guild set';
            self.embed(command, "Guild Set Commands", prefix + " desc`` - Sets the guild description.\n" + prefix + " open`` - Sets the guild joining status.\n" + prefix + " thumbnail`` - Sets the guild thumbnail.\n" + prefix + " name`` - Sets the guilds name.");
            return;
          }
          switch (command.params[1]) {
            case "desc":
              if (player.guild != '') {
                self.utils.GetGuild(player.guild).then(function(guild) {
                  if (guild.owner_id == player.id) {
                    var params = command.params.splice(2).join(" ");
                    guild.desc = params;
                    self.utils.plugin.DB.Update("guilds", {
                      "id": guild.id
                    }, guild);
                    self.embed(command, "Guild Desc Set", (params != '') ? "New Desc: ``" + params + "``" : "Guild description is cleared.");
                  } else self.embed(command, "Guild Desc Error", "Only guild owner can set desc.");
                });
              } else self.embed(command, "Guild Desc Error", "You are not in a guild.");
              break;
            case "open":
              if (player.guild != '') {
                self.utils.GetGuild(player.guild).then(function(guild) {
                  if (guild.owner_id == player.id) {
                    if (command.params[2] == 'true') {
                      guild.open = true;
                      self.utils.plugin.DB.Update("guilds", {
                        "id": guild.id
                      }, guild);
                      self.embed(command, "Guild Open Set", 'Guild is now set to open.');
                    } else if (command.params[2] == 'false') {
                      guild.open = false;
                      self.utils.plugin.DB.Update("guilds", {
                        "id": guild.id
                      }, guild);
                      self.embed(command, "Guild Open Set", 'Guild is now set to closed.');
                    } else self.embed(command, "Guild Open Error", "Input has to be ``true``or ``false``.");
                  } else self.embed(command, "Guild Open Error", "You are not the guild owner.");
                });
              } else self.embed(command, "Guild Open Error", "You are not in a guild.");
              break;
            case "thumbnail":
              if (player.guild != '') {
                self.utils.GetGuild(player.guild).then(function(guild) {
                  if (guild.owner_id == player.id) {
                    self.disnode.platform.GetUserUltra(command.msg.author.usernameID).then(function(role) {
                      if (role) {
                        guild.thumbnail = command.params[2];
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.embed(command, "Guild Thumbnail Set", 'The guilds thumbnail has been set.');
                      } else self.embed(command, "Guild Thumbnail Error", 'This is an [Ultra](https://disnodeteam.com/#/ultra) setting.');
                    });
                  } else self.embed(command, "Guild Thumbnail Error", 'You are not the guild owner.');
                });
              } else self.embed(command, "Guild Thumbnail Error", "You are not in a guild.");
              break;
            case "name":
              if (player.guild != '') {
                self.utils.GetGuild(player.guild).then(function(guild) {
                  var params = command.params.splice(2).join(" ");
                  if (guild.owner_id == player.id) {
                    self.utils.FindGuild(params).then(function(fg) {
                      if (fg == false) {
                        guild.name = params;
                        self.utils.plugin.DB.Update("guilds", {
                          "id": guild.id
                        }, guild);
                        self.embed(command, "Guild Name Set", 'New name: ``' + params + '``.');
                      } else self.embed(command, "Guild Name Set Error", 'That guild name is taken.');
                    });
                  } else self.embed(command, "Guild Name Set Error", 'You are not the guild owner.');
                });
              } else self.embed(command, "Guild Name Set Error", "You are not in a guild.");
              break
          }

      }
    });
  }
  gather(command) {
    var self = this;
    self.utils.GetUser(command).then(function(player) {
      switch (command.params[0]) {
        case "mine":
          var timeoutInfo = self.utils.checkTimeout(player, 5);
          if (player.dev) timeoutInfo = self.utils.checkTimeout(player, 0);
          if (!timeoutInfo.pass) {
            self.embed(command, "Cooldown", "You have to wait ``" + timeoutInfo.remain + "`` before mining again.");
            return;
          }
          self.utils.GetGather("mine", self.utils.theMaths(0, 2)).then(function(res) {
            var itemfound = false;
            var amt;
            var pos;
            for (var i = 0; i < player.inv.length; i++) {
              if (player.inv[i].defaultName == res.Name) {
                itemfound = true;
                amt = player.inv[i].amount;
                pos = i;
                break;
              }
            }
            var drop = self.utils.theMaths(res.minDrop, res.maxDrop);
            var xp = self.utils.theMaths(res.minXP, res.maxXP);
            if (itemfound == false) {
              var newItem = {
                defaultName: res.Name,
                amount: drop
              }
              player.inv.push(newItem);
              player.xp += xp;
              self.utils.checkLV(player, command.msg.channel_id);
              self.utils.plugin.DB.Update("players", {
                "id": player.id
              }, player);
              self.embed(command, "Mine Result", "You got " + drop + " " + res.Name + " and " + xp + " XP");
            } else {
              player.inv[pos].amount += drop;
              player.xp += xp;
              self.utils.checkLV(player, command.msg.channel_id);
              self.utils.plugin.DB.Update("players", {
                "id": player.id
              }, player);
              self.embed(command, "Mine Result", "You got " + drop + " " + res.Name + " and " + xp + " XP");
            }
          });
          self.utils.updatePlayerLastMessage(player);
          break;

      }
    })
  }
  player(command) {
    var self = this;
    self.utils.GetUser(command).then(function(player) {
      switch (command.params[0]) {
        case 'inv':
          var headingStringA = "Name";
          var headingStringB = "|Amount"
          var itemsAmountArr = [];
          var itemsNameArr = [];
          var final = "";
          for (var i = 0; i < player.inv.length; i++) {
            itemsAmountArr.push("|x" + player.inv[i].amount);
            itemsNameArr.push(player.inv[i].name);
          }
          var AmountL = self.utils.getLongestString(itemsAmountArr);
          var NameL = self.utils.getLongestString(itemsNameArr);
          headingStringA = self.utils.addSpacesToString(headingStringA, NameL);
          headingStringB = self.utils.addSpacesToString(headingStringB, AmountL);
          final += headingStringA + headingStringB + "\n\n";
          for (var i = 0; i < itemsNameArr.length; i++) {
            itemsNameArr[i] = self.utils.addSpacesToString(itemsNameArr[i], NameL);
          }
          for (var i = 0; i < itemsAmountArr.length; i++) {
            itemsAmountArr[i] = self.utils.addSpacesToString(itemsAmountArr[i], AmountL);
          }
          for (var i = 0; i < itemsNameArr.length; i++) {
            final += itemsNameArr[i] + itemsAmountArr[i] + "\n";
          }
          self.disnode.bot.SendEmbed(command.msg.channel_id, {
            color: 1752220,
            author: {},
            fields: [{
              name: player.name + "\'s Inventory",
              inline: true,
              value: "`\n" + final + "`",
            }],
            footer: {
              text: command.msg.author.username,
              icon_url: self.utils.avatarCommandUser(command),
            },
            timestamp: new Date(),
          });
          break;
        case 'stats':
          var bprefix = self.disnode.botConfig.prefix;
          var pprefix = self.config.prefix;
          if (command.params[1]) {
            self.utils.FindPlayer(command.params[1]).then(function(res) {
              if (res.found) {
                self.disnode.bot.SendEmbed(command.msg.channel_id, {
                  color: 1752220,
                  author: {},
                  title: res.p.name + "\'s stats",
                  description: "To see your inventory type ``" + bprefix + "" + pprefix + " inv``.",
                  fields: [{
                    name: 'Health',
                    inline: true,
                    value: (res.p.chealth) + "/" + (res.p.thealth) + " HP",
                  }, {
                    name: 'Gold',
                    inline: true,
                    value: (res.p.gold),
                  }, {
                    name: 'Level ' + res.p.lvl,
                    inline: true,
                    value: res.p.xp + '/' + res.p.nextlvl + ' XP',
                  }],
                  footer: {
                    text: command.msg.author.username,
                    icon_url: self.utils.avatarCommandUser(command),
                  },
                  timestamp: new Date(),
                });
              } else {
                self.disnode.bot.SendCompactEmbed(command.msg.channel_id, "Error", res.msg);
              }
            });
          } else {
            self.disnode.bot.SendEmbed(command.msg.channel_id, {
              color: 1752220,
              author: {},
              title: player.name + "\'s stats",
              description: "To see your inventory type ``" + bprefix + "" + pprefix + " inv``.",
              fields: [{
                name: 'Health',
                inline: true,
                value: (player.chealth) + "/" + (player.thealth) + " HP",
              }, {
                name: 'Gold',
                inline: true,
                value: (player.gold),
              }, {
                name: 'Level ' + player.lvl,
                inline: true,
                value: player.xp + '/' + player.nextlvl + ' XP',
              }],
              footer: {
                text: command.msg.author.username,
                icon_url: self.utils.avatarCommandUser(command),
              },
              timestamp: new Date(),
            });
          }
          break;
        case 'skills':
          switch (command.params[1]) {
            case "assign":

              break;
            default:
              self.disnode.bot.SendEmbed(command.msg.channel_id, {
                color: 1752220,
                author: {},
                fields: [{
                  name: player.name + "\'s skills",
                  inline: true,
                  value: 'Strength: ``' + player.skills.strength + '``\nDefense: ``' + player.skills.defense + '``\nLuck: ``' + player.skills.luck + '``\nCharisma: ``' + player.skills.charisma + '``\nUnassigned: ``' + player.skills.points + '``',
                }],
                footer: {
                  text: command.msg.author.username,
                  icon_url: self.utils.avatarCommandUser(command),
                },
                timestamp: new Date(),
              });
              break;
          }
          break;
        case 'equipped':
          var wpos;
          var hpos;
          var bpos;
          var gpos;
          var spos;
          for (var i = 0; i < player.equipped.length; i++) {
            if (player.equipped[i].type == 'weapon') {
              wpos = i;
            }
            if (player.equipped[i].type == 'breastplate') {
              bpos = i;
            }
            if (player.equipped[i].type == 'helmet') {
              hpos = i;
            }
            if (player.equipped[i].type == 'greaves') {
              gpos = i;
            }
            if (player.equipped[i].type == 'shield') {
              spos = i;
            }
          }
          self.disnode.bot.SendEmbed(command.msg.channel_id, {
            color: 1752220,
            author: {},
            title: player.name + "\'s Equipped Items",
            thumbnail: {
              url: 'https://cdn.discordapp.com/attachments/324059500556320774/324393831602716672/inventory.png'
            },
            fields: [{
              name: 'Helmet',
              inline: true,
              value: player.equipped[hpos].name,
            }, {
              name: 'Breastplate',
              inline: true,
              value: player.equipped[bpos].name,
            }, {
              name: 'Greaves',
              inline: true,
              value: player.equipped[gpos].name,
            }, {
              name: 'Shield',
              inline: true,
              value: player.equipped[spos].name,
            }, {
              name: 'Weapon',
              inline: true,
              value: player.equipped[wpos].name,
            }],
            footer: {
              text: command.msg.author.username,
              icon_url: self.utils.avatarCommandUser(command),
            },
            timestamp: new Date(),
          });
          break;
        case 'equip':
          var ipos;
          var invfound = false;
          var params = command.params.splice(1).join(" ").replace(/(^|\s)[a-z]/g, function(f) {
            return f.toUpperCase();
          });
          for (var i = 0; i < player.inv.length; i++) {
            if (player.inv[i].name == params) {
              ipos = i;
              invfound = true;
            }
          }
          if (invfound) {
            var epos;
            var item = player.inv[ipos].type;
            for (var i = 0; i < player.equipped.length; i++) {
              if (player.equipped[i].type == item) {
                epos = i;
              }
            }
            var equipobj = player.equipped[epos];
            var invobj = player.inv[ipos];
            player.inv.push(equipobj);
            player.equipped.push(invobj);
            player.inv.splice(ipos, 1);
            player.equipped.splice(epos, 1);
            self.utils.plugin.DB.Update("players", {
              "id": player.id
            }, player);
            self.embed(command, "Item Equip", params + ' has been equipped.');
          } else self.embed(command, "Item Equip Error", params + ' is not in your inv.');
          break;
        default:
          var prefix = '``!rpg player';
          self.embed(command, "Player Commands", prefix + " stats`` - Stats of you or a user.\n" + prefix + " inv`` - Gets your inventory.\n" + prefix + " skills`` - Skill related commands.\n" + prefix + " equipped`` - Shows what gear you have equipped.");
      }
    });
  }
  itemInfo(command) {
    var self = this;
    var prefix = self.disnode.botConfig.prefix + self.config.prefix;
    if (command.params[0] == undefined) {
      self.disnode.bot.SendEmbed(command.msg.channel_id, {
        color: 1752220,
        author: {},
        fields: [{
          name: 'Info',
          inline: true,
          value: "``" + prefix + " info [breastplate/greatsword/greaves/helmet/shortsword/health] [name]`` - Get Item Info",
        }],
        footer: {
          text: command.msg.author.username,
          icon_url: self.utils.avatarCommandUser(command),
        },
        timestamp: new Date(),
      });
    } else {
      console.log(command.params);
      var type = command.params[0];
      command.params.splice(0, 1);
      var itemL = command.params.join(" ");
      console.log(type + " : " + itemL);
      self.utils.getItem(type, itemL).then(function(item) {
        var embedFields = [];
        embedFields.push({
          name: 'Item Name',
          inline: true,
          value: item.name,
        });
        embedFields.push({
          name: 'Item Level',
          inline: true,
          value: item.lvl,
        });
        embedFields.push({
          name: 'Item Worth (Buy/Sell)',
          inline: true,
          value: item.buy + "/" + item.sell,
        });
        switch (item.type) {
          case "weapon":
            embedFields.push({
              name: 'Min Damage/Max Damage',
              inline: true,
              value: item.minDamage + "/" + item.maxDamage,
            });
            break;
          case "greaves":
            embedFields.push({
              name: 'Min Defense/Max Defense',
              inline: true,
              value: item.minDefense + "/" + item.maxDefense,
            });
            break;
          case "helmet":
            embedFields.push({
              name: 'Min Defense/Max Defense',
              inline: true,
              value: item.minDefense + "/" + item.maxDefense,
            });
            break;
          case "breastplate":
            embedFields.push({
              name: 'Min Defense/Max Defense',
              inline: true,
              value: item.minDefense + "/" + item.maxDefense,
            });
            break;
          case "health":
            embedFields.push({
              name: 'Healing Power',
              inline: true,
              value: item.heal,
            });
            break;
        }
        self.disnode.bot.SendEmbed(command.msg.channel_id, {
          color: 1752220,
          author: {},
          title: "Item Info",
          fields: embedFields,
          footer: {
            text: command.msg.author.username,
            icon_url: self.utils.avatarCommandUser(command),
          },
          timestamp: new Date(),
        });
      }).catch(function(err) {
        self.embed(command, "Error", "" + err);
      })
    }
  }
  storelist(command) {
    var self = this;
    var prefix = self.disnode.botConfig.prefix + self.config.prefix;
    if (command.params[0] == undefined) {
      self.disnode.bot.SendEmbed(command.msg.channel_id, {
        color: 1752220,
        author: {},
        fields: [{
          name: 'Info',
          inline: true,
          value: "``" + prefix + " list [breastplate/greatsword/greaves/helmet/shortsword/health]`` - Get Items",
        }],
        footer: {
          text: command.msg.author.username,
          icon_url: self.utils.avatarCommandUser(command),
        },
        timestamp: new Date(),
      });
    } else {
      self.utils.getItems(command.params[0]).then(function(items) {
        var Name = "";
        var cost = "";
        for (var i = 0; i < items.length; i++) {
          Name += items[i].name + "\n";
          cost += items[i].buy + " Gold\n";
        }
        cost = cost.replace("0 Gold", "Free");
        cost = cost.replace("null Gold", "Unavailable");
        self.disnode.bot.SendEmbed(command.msg.channel_id, {
          color: 1752220,
          author: {},
          title: "Item List",
          fields: [{
            name: 'Item Name',
            inline: true,
            value: Name,
          }, {
            name: 'Amount',
            inline: true,
            value: cost,
          }],
          footer: {
            text: command.msg.author.username,
            icon_url: self.utils.avatarCommandUser(command),
          },
          timestamp: new Date(),
        });
      }).catch(function(err) {
        self.embed(command, "Error", "" + err);
      });
    }
  }
  devCommand(command) {
    var self = this;
    self.utils.GetUser(command).then(function(player) {
      if (player.dev) {
        switch (command.params[0]) {
          case "eval":
            try {
              var codes = command.msg.message.split("dev eval ")[1];
              var results = eval("(() => { " + codes + " })();");
              if (results === "[object Object]") {
                results = JSON.stringify(results, null, 4);
              }
              if (typeof results !== 'string')
                results = require('util').inspect(results);
              self.disnode.bot.SendMessage(command.msg.channel_id, "```json\n" + results + "```")
            } catch (errors) {
              self.disnode.bot.SendMessage(command.msg.channel_id, errors)
            }
            break;
          case "player":
            switch (command.params[1]) {
              case "get":
                self.utils.FindPlayer(command.params[2]).then(function(res) {
                  if (res.found) {
                    self.disnode.bot.SendMessage(command.msg.channel_id, "```json\n" + JSON.stringify(res.p, false, 2) + "```");
                  } else {
                    self.disnode.bot.SendCompactEmbed(command.msg.channel_id, "Error", res.msg, 16772880);
                  }
                });
                break;
              case "set":
                switch (command.params[2]) {
                  case "lvl":
                    self.utils.FindPlayer(command.params[3]).then(function(res) {
                      if (res.found) {
                        res.p.lvl = parseInt(command.params[4]);
                        self.utils.plugin.DB.Update("players", {
                          "id": res.p.id
                        }, res.p);
                        self.disnode.bot.SendCompactEmbed(command.msg.channel_id, "Complete", res.p.name + " lvl set to " + command.params[4], 3447003);
                      } else {
                        self.disnode.bot.SendCompactEmbed(command.msg.channel_id, "Error", res.msg, 16772880);
                      }
                    });
                    break;
                }
                break;
            }
            break;
          case "changelog":
            self.disnode.bot.SendEmbed('323358134993289216', {
              color: 1752220,
              author: {},
              fields: [{
                name: 'Changelog ' + self.disnode.botConfig.version,
                inline: true,
                value: '```fix\n' + self.utils.ChangeLog() + '\n```',
              }],
              footer: {},
              timestamp: new Date(),
            });
            break;
        }
      }
    });
  }
  embed(command, title, body) {
    var self = this;
    self.disnode.bot.SendEmbed(command.msg.channel_id, {
      color: 1752220,
      author: {},
      fields: [{
        name: title,
        inline: true,
        value: body,
      }],
      footer: {
        text: command.msg.author.username,
        icon_url: self.utils.avatarCommandUser(command),
      },
      timestamp: new Date(),
    });
  }
}
module.exports = RPGPlugin;
