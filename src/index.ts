import {
  Client,
  MessageCollector,
  MessageEmbed,
  TextChannel,
} from "discord.js";
const client = new Client();
const { slayersDB } = require("slayer.db");
const db = new slayersDB();

client.on("message", (message) => {
  let prefix = "!";
  let { author, member, content, guild } = message;

  let questions = [
    "How old are you?",
    "What position are you applying for?",
    "How active can you be every day?",
    "Are you still in school?",
  ];

  if (author.bot) return;
  if (message.guild && db.has(`prefixes_${guild.id}`))
    prefix = db.get(`prefixes_${guild.id}`);

  const args = content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (db.has(`questions_${guild.id}`)) {
    let q = db.get(`questions_${guild.id}`);

    q.forEach((x) => {
      questions.push(x);
    });
  }

  if (command === "set-logs") {
    if (!args[0])
      return message.channel.send(
        `Logs channel for the server is: ${
          db.get(`logs_${guild.id}`) ? db.get(`logs_${guild.id}`).name : "None"
        }`
      );

    if (!message.mentions.channels.first())
      return message.reply("No channel was mentioned");
    db.set(`logs_${guild.id}`, message.mentions.channels.first());

    db.save();

    message.channel.send(`Logs channel has been set`);
  }

  if (command === "questions") {
    if (!args[0])
      return message.channel.send(`Questions:\n\n${questions.join("\n\n")}`);
    if (args[0] === "add") {
      if (!args[1]) return message.channel.send("No question was given");
      if (!db.has(`questions_${guild.id}`))
        db.set(`questions_${guild.id}`, [args.slice(1).join(" ")]);
      else {
        db.push(`questions_${guild.id}`, [args.slice(1).join(" ")]);
      }
      message.channel.send(`Added a question`);
      db.save();
    }
    if (args[0] === "remove") {
      const toRemove = args[1];
      if (!toRemove) return message.channel.send("No question was given");

      if (!db.has(`questions_${guild.id}`))
        return message.channel.send("There are no questions for this server");

      db.splice(`questions_${guild.id}`, args.slice(1).join(" "));
      db.save();
      message.reply("Removed question");
    }
  }

  if (command === "apps") {
    let func = args[0];
    if (!func)
      return message.channel.send(
        `Apps is currently: ${db.get(`apps_${guild.id}`) || "off"}`
      );

    if (!["off", "on"].includes(func))
      return message.channel.send(`Options are only: on OR off`);

    db.set(`apps_${guild.id}`, func);

    db.save();

    message.channel.send(`Apps are now: ${func}`);
  }

  if (command === "apply") {
    if (!message.guild) return;
    if (!db.has(`apps_${guild.id}`))
      return message.channel.send("Applications are disabled for this server");
    if (db.get(`apps_${guild.id}`) === "off")
      return message.channel.send("Applications are disabled for this server");
    let count = 0;
    let filter = (m) => {
      return m.author.id === message.author.id;
    };
    let collector = new MessageCollector(
      message.channel as TextChannel,
      filter,
      {
        max: questions.length,
        time: 1000 * 1000,
      }
    );
    message.channel.send(questions[count++]);
    collector.on("collect", (m) => {
      if (count < questions.length) {
        m.channel.send(questions[count++]);
      } else {
        collector.stop("done");
      }
    });

    collector.on("end", async (collected) => {
      message.reply("Application has been sent to management team");
      let arr = [];

      let count = 0;
      let c = 0;
      collected.forEach((value) => {
        // c++;
        // if (questions[c] === questions[0]) {
        //   let answer = value.content;
        //   let regexMatched = answer.match(/[0-9]+/g);
        //   if (Number(regexMatched) >= 13) {
        //     console.log("User is above 13");
        //     letIn++;
        //   } else {
        //   }
        // }
        // if (questions[c] === questions[2]) {
        //   console.log("FOUND 2");
        //   let answer = value.content;
        //   let regexMatched = answer.match(/[0-9]+/g);
        //   console.log(regexMatched);
        //   if (Number(regexMatched[0]) >= 3) {
        //     letIn++;
        //     console.log("There active hours is above 3");
        //   } else {
        //   }
        // }
        arr.push(
          `**Question:** ${questions[count++]}\n**Answer:** ${value.content}`
        );
      });
      let logs = db.get(`logs_${guild.id}`);
      if (logs) {
        if (!message.guild.channels.cache.has(logs.id)) return;
        let logsChannel = client.channels.cache.get(logs.id) as TextChannel;
        const embed = new MessageEmbed()
          .setColor("BLUE")
          .setAuthor(
            message.author.username,
            message.author.displayAvatarURL({ dynamic: true })
          );
        arr.map((x) => {
          let splited = x.split("\n**Answer:**");
          embed.addField(splited[0], splited[1]);
        });
        logsChannel.send(embed);
      } else {
        return message.channel.send(`Failed to find application channnel`);
      }
    });
  }
});

client.login("ODE3ODQyMTM3MTEwNTQ0NDM0.YEPY2A.MB1YC76WS5PO45kC3b4K8WTz4W0");
