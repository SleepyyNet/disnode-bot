"use strict"
// Command Handler Controls and Parses Every Message against a list of Commands/
// Consider the dispatcher of your app

class CommandHandler{
  // Set Inital Varibles
  // Prefix: The Command Prefix for this list.
  // List: List of Command Objects

  constructor(prefix,list, context){
    this.prefix = prefix;
    this.list = list;
    this.context = context;
    console.log("[CommandHandler] Init. ");
    console.log("[CommandHandler] |--- Prefix: " + prefix);
    for (var i = 0; i < list.length; i++) {
      console.log("[CommandHandler] |--- Command: " + list[i].cmd);
    }
  }

  UpdateList(list)
  {
    console.log("[CommandHandler] Updating List. ");
    for (var i = 0; i < list.length; i++) {
      console.log("[CommandHandler] |--- Command: " + list[i].cmd);
    }
    this.list = list
  }
  // Parse the message and run any commands it contains
  RunMessage(msg){
    // Get the prefix
    var self = this;
    var msgContent = msg.content;
    var firstLetter = msgContent.substring(0,1)

    // Check if it is the prefix, else ignore
    if(firstLetter == this.prefix){
      var command = "";

      // Check if the message has a space, require for command parsing
      if(CheckSpace(msgContent)){
        // Get command string as anything before the first space
        command = msgContent.substring(1,msgContent.indexOf(" "));
        console.log(command);
      }else {
        // Get the command as just the string (minus the prefix)
        command = msgContent.substring(1);
      }

      // Check if command is registered
      if(CheckForCommand(command, this.list)){
        // Get the command
        var commandObject = GetCommand(command, this.list);
        // Run the command
        console.log(commandObject.run);

        if(commandObject.require){
          var foundAllRequies = true;

          for(var i=0;i<commandObject.require.length;i++){
            if(!self.context[commandObject.require[i]]){
              foundAllRequies = false;
            }
          }

          if(foundAllRequies){
            self.context[commandObject.run]({msg: msg, params:GetParmas(msgContent)});
          }else{
            console.log("[CommandHandler] Missing Requirements!");
          }
        }else{
          console.log("[CommandHandler] No Requirements. Running!");
          self.context[commandObject.run]({msg: msg, params:GetParmas(msgContent)});
        }
      }
    }
  }
}

function CheckSpace(toCheck){
  if(toCheck.indexOf(" ") != -1){
    return true;
  }
  else{
    return false;
  }
}

function CheckForCommand(toSearch, list){
  for (var i = 0; i < list.length; i++) {
    if(list[i].cmd == toSearch){
      return true;
    }
  }
  return false;
}

function GetCommand(toSearch, list){
  var returnCommand;
  for (var i = 0; i < list.length; i++) {
    if(list[i].cmd == toSearch){
      returnCommand = list[i];
    }
  }
  return returnCommand;
}

function GetParmas(raw){
  var parms = [];
  var lastSpace = -1;
  var end = false;
  while(!end){


    var BeginSpace = raw.indexOf(" ", lastSpace);
    var EndSpace = -1;
    if(BeginSpace != -1){
       EndSpace = raw.indexOf(" ", BeginSpace + 1);


       if(EndSpace == -1){
         EndSpace = raw.length;
         end = true;
       }

       var param = raw.substring(BeginSpace + 1, EndSpace);
       var containsQuoteIndex = param.indexOf('"');



       var BeginQuote = -1;
       var EndQuote = -1;
       if(containsQuoteIndex != -1){
         BeginQuote = raw.indexOf('"', BeginSpace);


         EndQuote = raw.indexOf('"', BeginQuote + 1);

         if(EndQuote != -1){
           BeginSpace = BeginQuote;
           EndSpace = EndQuote;
           param = raw.substring(BeginSpace + 1, EndSpace);


           console.log(" ");
         }
       }

       lastSpace = EndSpace;

       if(param != ""){
         parms.push(param);
       }else{

       }



    }else{
      end = true;
    }
  }
  return parms;
}
module.exports = CommandHandler;
