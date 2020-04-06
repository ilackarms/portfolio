import {IgApiClient} from 'instagram-private-api';
import {UserFeedResponseItemsItem} from "instagram-private-api/dist/responses";

const fs = require('fs');
const wget = require('node-wget-promise');
const YAML = require('yaml');
const ig = new IgApiClient();

// You must generate device id's before login.
// Id's generated based on seed
// So if you pass the same value as first argument - the same id's are generated every time
ig.state.generateDevice(process.env.IG_USERNAME);
// Optionally you can setup proxy url
ig.state.proxyUrl = process.env.IG_PROXY;

const timer = ms => new Promise(res => setTimeout(res, ms));

function wait(ms: number) {
    (async () => {
        try {
            await timer(ms);
        } catch (e) {
            console.log('Error caught', e);
        }
    })()
}

(async () => {
    try {

    console.log("start");

    let images = [];

    let dir = process.argv[2];
    if (dir === undefined) {
        dir = "."
    }

    // Execute all requests prior to authorization in the real Android application
    // Not required but recommended
    await ig.simulate.preLoginFlow();
    const loggedInUser = await ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD);
    // The same as preLoginFlow()
    // Optionally wrap it to process.nextTick so we dont need to wait ending of this bunch of requests
    process.nextTick(async () => await ig.simulate.postLoginFlow());
    // Create UserFeed instance to get loggedInUser's posts
    const userFeed = ig.feed.user(loggedInUser.pk);

    //console.log("waiting after getting user", userFeed);
    wait(25);

    let handleItems = async function (items: UserFeedResponseItemsItem[]) {
        for (let item of items) {


            //console.log("waiting before getting item", item);
            wait(25);
            const info = await ig.media.info(item.id);
            let post = info.items[0];

            if (post === undefined || post.image_versions2 === undefined) {
                continue
            }
            //console.log("waiting before getting comment", info);
            wait(25);

            let comments = await ig.feed.mediaComments(item.id).items();
            // console.log(comments);
            //console.log("waiting after getting comments", comments);
            wait(25);

            let data = getImageData(comments);

            if (data == null || typeof data === "string") {
                continue
            }

            console.log("data:", data);

            await wget(post.image_versions2.candidates[0].url, {
                output: "static/" + dir + "/" + data.title + ".jpg"
            });

            await wget(post.image_versions2.candidates[1].url, {
                output: "static/" + dir + "/" + data.title + "_thumb.jpg"
            });

            images.push(data)
        }

    };


    let items = await userFeed.items();

    while (items != undefined) {
        try {
            await handleItems(items);
            items = await userFeed.items();
        } catch (e) {
            break;
        }
        // break;
    }

    let tomlFile = `[[params]]
title = "Gallery"
`;

    // temp fix:
    dir = ".";

    for (let image of images) {
        tomlFile +=
            `
[[items]]
image = "` + dir + `/` + image.title + `.jpg"
thumb = "` + dir + `/` + image.title + `_thumb.jpg"
title = "` + image.title + `"
materials = "` + image.materials + `"
size = "` + image.size + `"
`
    }

    fs.writeFileSync("data/images.toml", tomlFile)

    } catch (e) {
        console.log("error!", e)
    }
})();

interface ImageData {
    title: string;
    materials: string;
    size: string;
}

function getImageData(comments: any[]): ImageData {
    console.log("comments: ", comments.length);
    for (let comment of comments) {
        let data: ImageData;
        console.log("trying text:", comment.text);
        try {
            // console.log("comments: ", comment.text);
            data = YAML.parse(comment.text)
        } catch (e) {
            // console.log("caught");
            continue
        }

        if (data != null && data.title != "" && data.title != undefined) {
            data.title = data.title.trim();
            // console.log("returned", data.title);
            return data
        }
        // console.log("continue");
    }
    return null
}
