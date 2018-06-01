const fs = require('fs');
const cron = require('node-cron');
const request = require('request');
const config = require('../config');

let templates = [];

function updateLxcTemplates() {
    console.log("Updating template list...");
    request(config.TEMPLATES_URL, (error, response, body) => {
        if (error) return console.log('Error requesting templates: ', error);
        if (body) {
            templates = [];
            let bodyLines = body.split('\n');
            for (let n in bodyLines) {
                let auxTemplate = bodyLines[n].split(';');
                let template = {
                    dist: auxTemplate[0],
                    release: auxTemplate[1],
                    arch: auxTemplate[2],
                    variant: auxTemplate[3],
                    buildDate: auxTemplate[4]
                };
                if (template.arch === config.TEMPLATES_ARCH) {
                    templates.push(template);
                }
            }
            fs.writeFile('templates.json', JSON.stringify(templates), (err) => {
                if (err) return console.log('Error saving templates');
                console.log(templates.length + " templates found");
            });
        }
    });
}

function initCrontab() {
    fs.readFile('templates.json', (err, data) => {
        if (err) return;
        templates = JSON.parse(data.toString());
    });
    updateLxcTemplates();
    cron.schedule('0 0 0 * * *', () => {
        updateLxcTemplates();
    });
}

function getTemplates() {
    return templates;
}

module.exports = {
    getTemplates,
    initCrontab,
    updateLxcTemplates
};