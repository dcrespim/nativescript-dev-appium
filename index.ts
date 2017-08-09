import * as fs from "fs";
import * as path from "path";
import * as yargs from 'yargs';
import * as child_process from "child_process";
import * as utils from "./utils";
import * as elementFinder from "./element-finder";
import { ServerOptions } from './server-options';
import { createAppiumDriver } from './appium-driver';

const config = (() => {
    const options = yargs
        .option("runType", { describe: "Path to excute command.", type: "string", default: null })
        .option("path", { alias: "p", describe: "Path to app root.", default: process.cwd, type: "string" })
        .option("testFolder", { describe: "E2e test folder name", default: "e2e", type: "string" })
        .option("capsLocation", { describe: "Capabilities location", type: "string" })
        .option("sauceLab", { describe: "SauceLab", default: false, type: "boolean" })
        .option("verbose", { alias: "v", describe: "Log actions", default: false, type: "boolean" })
        .help()
        .argv;

    const config = {
        executionPath: options.path,
        loglevel: options.verbose,
        testFolder: options.testFolder,
        runType: options.runType || process.env.npm_config_runType,
        capsLocation: options.capsLocation || path.join(options.testFolder, "config"),
        isSauceLab: options.sauceLab
    }
    return config;
})();

const {
    executionPath,
    loglevel,
    testFolder,
    runType,
    capsLocation,
    isSauceLab
} = config;

const appLocation = utils.appLocation;
let appium = process.platform === "win32" ? "appium.cmd" : "appium";
const projectDir = utils.projectDir();
const pluginBinary = utils.pluginBinary();
const projectBinary = utils.projectBinary();
const pluginRoot = utils.pluginRoot();
const pluginAppiumBinary = utils.resolve(pluginBinary, appium);
const projectAppiumBinary = utils.resolve(projectBinary, appium);

if (fs.existsSync(pluginAppiumBinary)) {
    utils.log("Using plugin-local Appium binary.");
    appium = pluginAppiumBinary;
} else if (fs.existsSync(projectAppiumBinary)) {
    utils.log("Using project-local Appium binary.");
    appium = projectAppiumBinary;
} else {
    utils.log("Using global Appium binary.");
}

let server;
const serverOptoins = new ServerOptions(9200);
export function startAppiumServer(port) {
    serverOptoins.port = port || serverOptoins.port;
    server = child_process.spawn(appium, ["-p", port], {
        shell: true,
        detached: false
    });

    return utils.waitForOutput(server, /listener started/, 60000);
}

export function killAppiumServer() {
    // todo: check if allready dead?
    var isAlive = true;
    if (isAlive) {
        return new Promise((resolve, reject) => {
            server.on("close", (code, signal) => {
                console.log(`Appium terminated due ${signal}`);
                resolve();
            });
            // TODO: What about "error".
            server.kill('SIGINT');
            server = null;
        });
    } else {
        return Promise.resolve();
    }
}

export function createDriver(capabilities?, activityName?) {
    return createAppiumDriver(runType, serverOptoins.port);
};

export function getXPathWithExactText(text) {
    return elementFinder.getXPathByText(text, true, runType);
}

export function getXPathContainingText(text) {
    return elementFinder.getXPathByText(text, false, runType);
}

export function getElementClass(name) {
    return elementFinder.getElementClass(name, runType);
}
