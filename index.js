#!/usr/bin/node

// scrape UW Food Services daily menu and send it to a Discord webhook
// the documented API online doesn't seem to be working, so we're scraping the website

const axios = require('axios').default;
const cheerio = require('cheerio');
const config = require('./config');

if (!config.webhook || config.webhook === '') {
    console.error('No webhook provided in config.js');
    process.exit(1);
}

// note: this is expected to be run a machine operating in the same timezone as UW
const today = new Date();
const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
console.log(`Running now for ${date} at ${today.toLocaleTimeString()}`);

axios.get(`https://uwaterloo.ca/food-services/locations-and-hours/daily-menu?field_uw_fs_dm_date_value%5Bvalue%5D%5Bdate%5D=${date}`).then((response) => {
    let data = {
        embeds: [
            {
                title: "Today's Residence Menu",
                description: `Menu for [${date}](https://uwaterloo.ca/food-services/locations-and-hours/daily-menu?field_uw_fs_dm_date_value%5Bvalue%5D%5Bdate%5D=${date})`,
                color: 15786565,
                fields: [
                ]
            }
        ],
        username: "UW Foodie",
        avatar_url: "https://uwaterloo.ca/food-services/sites/ca.food-services/files/styles/sidebar-220px-wide/public/uploads/images/uwfs_app_logo_final-01.jpg"
    }

    const $ = cheerio.load(response.data);
    $('.paragraphs-items-field-uw-fs-daily-menu > div > .field-items > .field-item').each((i, el) => {
        let location = {};

        const scnd = cheerio.load($(el).toString());
        location.name = scnd('.dm-location').first().text().trim();
        location.value = '';


        scnd('li[class="dm-menu-item"] > span').each((j, el2) => {
            el2.children.map((c) => {
                if (c.name === 'a') {
                    location.value += `[${scnd(c).text().trim()}](https://uwaterloo.ca${c.attribs.href})\n`;
                }
            });
        });
        data.embeds[0].fields.push(location);
    });

    axios.post(config.webhook, data, {
        headers: {
            "Content-Type": "application/json"
        }
    }).then((response) => { console.log(`Menu sent for ${date}`) }).catch(console.error);
}).catch(console.error);
