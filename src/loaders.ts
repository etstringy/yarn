import * as fs from "fs";
import * as path from "path";
import * as Discord from "discord.js";
import ora, { Ora } from "ora";
import { YarnGlobals } from "./utils/types"
import Command from "./classes/Command";

/**
 * @classdesc Command & event loader for Yarn
 * @param client Discord Client instance
 */

class Loaders {
    private globals: YarnGlobals;
    private client: Discord.Client;
    constructor(client: Discord.Client, globals: YarnGlobals){
        this.client = client;
        this.globals = globals;
    }

    /**
     * Loads interactions (commands v2) with .js and .ts extension in folder recursively
     * @param directory Directory of commands (usually "commands")
     */
    loadInteractions = async (directory: string): Promise<Map<string, Command>> => {
        let interactions: Map<string, Command> = new Map;
        let loaded: number = 0;
        return new Promise((res, rej) => {
            
            try {
                const files = fs.readdirSync(directory, {withFileTypes: true})
                files.forEach(async f => {
                    if(f.isDirectory()) {
                        const recursion = await this.loadInteractions(path.join(directory, f.name));
                        recursion.forEach((v, k) => { interactions.set(k, v) })
                    }

                    let fileExtension = f.name.split(".")[f.name.split(".").length - 1]
                    let moduleName = f.name.replace(".js", "").replace(".ts", "")
                    if(!f.name.endsWith(".js") && !f.name.endsWith(".ts")) return;
                    if(f.name.split("")[0] == "_") return;

                    try {
                        const interaction: { default: Command } = await import(path.join(directory, moduleName))
                        if(!interaction.default.meta.enabled) return "disabled";
                        interactions.set(interaction.default.meta.name, interaction.default);
                        console.log(`❯ Loaded interaction ${f.name}`);
                    } catch(err) {
                        console.log(`❯ Error loading interaction ${f.name}!`)
                        console.log(err)
                    }
                })
                res(interactions)
            } catch(err) {
                console.log("❌ Error loading interactions!")
                rej(err)
            }
        })
    }

    updateSlashCommands = async (commands: Map<string, Command>): Promise<void> => {
        try {
            if (!this.client.application?.owner) await this.client.application?.fetch();

            let data: Discord.ApplicationCommandData[] = []
            let dev_data: Discord.ApplicationCommandData[] = []

            commands.forEach((value: Command, key: string) => {
                data.push({
                    name: value.meta.name,
                    description: value.meta.description,
                    options: value.meta.options,
                    type: value.meta.type || "CHAT_INPUT"
                })
            })
            if(this.globals.env === "development") {
                const devsrv = await this.client.guilds.fetch(this.globals.config.serverId)
                await devsrv.commands.set(data.concat(dev_data));
                await this.client.application?.commands.set([]);
            } else {
                await this.client.application?.commands.set(data);
            }
            console.log(`✔️ Updated ${commands.size} slash commands!`)
        } catch(err) {
            console.log("❌ Error updating slash commands! Retrying in 2 seconds")
            setTimeout(() => this.updateSlashCommands(commands), 2000)
        }
    }

    /**
     * Loads events from .js or .ts files in one folder.
     * @param directory Directory of events (usually "events")
     */
    loadEvents = async (directory: string): Promise<void> => {
        fs.readdir(directory, {withFileTypes: true}, async (err, files: fs.Dirent[]) => {
            if(err) throw err;
            if(files.length === 0) return console.log(`✔️ No events to load`)
    
            let processed = 0, loaded = 0;

            files.forEach((f: fs.Dirent) => {
                let fileExtension = f.name.split(".")[f.name.split(".").length - 1]
                let moduleName = f.name.replace(".js", "").replace(".ts", "")
    
                processed++;

                if(f.isDirectory()) return;
                if(!f.name.endsWith(".js") && !f.name.endsWith(".ts")) return;
    
                let eventSpinner = ora(`Loading event ${f.name}`)
                let relativePath = directory.split(path.sep).slice(directory.split(path.sep).indexOf("commands")).join("/")
    
                import("./" + path.join(relativePath, moduleName))
                    .then((event) => {
                        loaded++;
                        this.client.on(moduleName, (...args) => event.default(...args, this.client, this.globals));
                        console.log(`❯ Loaded event ${f.name}`);
                    })
                    .catch((err) => {
                        console.log(`❯ Error loading event ${f.name}!`)
                        console.log(err)
                    })

                if(processed === files.length) console.log(`✔️ ${loaded} events loaded`)
            })
        })
    }

    /**
    * Loads jobs from .js or .ts files in one folder.
    * @param directory Directory of events (usually "events")
    */
    loadJobs = async (directory: string, client: Discord.Client): Promise<void> => {
        fs.readdir(directory, {withFileTypes: true}, async (err, files: fs.Dirent[]) => {
            if(err) throw err;
            if(files.length === 0) return console.log(`✔️ No jobs to load`)
    
            let loaded = 0;

            files.forEach((f: fs.Dirent) => {
                let fileExtension = f.name.split(".")[f.name.split(".").length - 1]
                let moduleName = f.name.replace(".js", "").replace(".ts", "")
    
                if(f.isDirectory()) return;
                if(!f.name.endsWith(".js") && !f.name.endsWith(".ts")) return;
    
                let eventSpinner = ora(`Loading event ${f.name}`)
                let relativePath = directory.split(path.sep).slice(directory.split(path.sep).indexOf("commands")).join("/")
    
                import("./" + path.join(relativePath, moduleName))
                    .then((job) => {
                        setInterval(job.run, job.delay, [client])
                        console.log(`❯ Loaded job ${f.name}`)
                    })
                    .catch((err) => {
                        console.log(`❯ Job ${f.name} failed to load!`)
                        console.log(err)
                    })

                loaded++;
                if(loaded == files.length) console.log(`✔️ ${loaded} jobs loaded`)
            })
        })
    }
}

export default Loaders;