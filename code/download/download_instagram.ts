import {IgApiClient} from 'instagram-private-api';

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


(async () => {
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

    const myPostsFirstPage = await userFeed.items();

    for (let item of myPostsFirstPage) {
        const info = await ig.media.info(item.id);
        let post = info.items[0];

        let data = getImageData(post.preview_comments);

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

    let tomlFile = `[[params]]
title = "Gallery"
`;

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

})();

interface ImageData {
    title: string;
    materials: string;
    size: string;
}

function getImageData(comments: any[]): ImageData {
    for (let comment of comments) {
        let data: ImageData;
        try {
            data = YAML.parse(comment.text)
        } catch (e) {
            continue
        }
        if (data.title != "") {
            return data
        }
    }
    return null
}
