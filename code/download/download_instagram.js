"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var instagram_private_api_1 = require("instagram-private-api");
var fs = require('fs');
var wget = require('node-wget-promise');
var YAML = require('yaml');
var ig = new instagram_private_api_1.IgApiClient();
// You must generate device id's before login.
// Id's generated based on seed
// So if you pass the same value as first argument - the same id's are generated every time
ig.state.generateDevice(process.env.IG_USERNAME);
// Optionally you can setup proxy url
ig.state.proxyUrl = process.env.IG_PROXY;
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var images, dir, loggedInUser, userFeed, myPostsFirstPage, _i, myPostsFirstPage_1, item, info, post, data, tomlFile, _a, images_1, image;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                console.log("start");
                images = [];
                dir = process.argv[2];
                if (dir === undefined) {
                    dir = ".";
                }
                // Execute all requests prior to authorization in the real Android application
                // Not required but recommended
                return [4 /*yield*/, ig.simulate.preLoginFlow()];
            case 1:
                // Execute all requests prior to authorization in the real Android application
                // Not required but recommended
                _b.sent();
                return [4 /*yield*/, ig.account.login(process.env.IG_USERNAME, process.env.IG_PASSWORD)];
            case 2:
                loggedInUser = _b.sent();
                // The same as preLoginFlow()
                // Optionally wrap it to process.nextTick so we dont need to wait ending of this bunch of requests
                process.nextTick(function () { return __awaiter(void 0, void 0, void 0, function () { return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, ig.simulate.postLoginFlow()];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                }); }); });
                userFeed = ig.feed.user(loggedInUser.pk);
                return [4 /*yield*/, userFeed.items()];
            case 3:
                myPostsFirstPage = _b.sent();
                _i = 0, myPostsFirstPage_1 = myPostsFirstPage;
                _b.label = 4;
            case 4:
                if (!(_i < myPostsFirstPage_1.length)) return [3 /*break*/, 9];
                item = myPostsFirstPage_1[_i];
                return [4 /*yield*/, ig.media.info(item.id)];
            case 5:
                info = _b.sent();
                post = info.items[0];
                data = getImageData(post.preview_comments);
                if (data == null || typeof data === "string") {
                    return [3 /*break*/, 8];
                }
                console.log("data:", data);
                return [4 /*yield*/, wget(post.image_versions2.candidates[0].url, {
                        output: "static/" + dir + "/" + data.title + ".jpg"
                    })];
            case 6:
                _b.sent();
                return [4 /*yield*/, wget(post.image_versions2.candidates[1].url, {
                        output: "static/" + dir + "/" + data.title + "_thumb.jpg"
                    })];
            case 7:
                _b.sent();
                images.push(data);
                _b.label = 8;
            case 8:
                _i++;
                return [3 /*break*/, 4];
            case 9:
                tomlFile = "[[params]]\ntitle = \"Gallery\"\n";
                for (_a = 0, images_1 = images; _a < images_1.length; _a++) {
                    image = images_1[_a];
                    tomlFile +=
                        "\n[[items]]\nimage = \"" + dir + "/" + image.title + ".jpg\"\nthumb = \"" + dir + "/" + image.title + "_thumb.jpg\"\ntitle = \"" + image.title + "\"\nmaterials = \"" + image.materials + "\"\nsize = \"" + image.size + "\"\n";
                }
                fs.writeFileSync("data/images.toml", tomlFile);
                return [2 /*return*/];
        }
    });
}); })();
function getImageData(comments) {
    for (var _i = 0, comments_1 = comments; _i < comments_1.length; _i++) {
        var comment = comments_1[_i];
        var data = void 0;
        try {
            data = YAML.parse(comment.text);
        }
        catch (e) {
            continue;
        }
        if (data.title != "") {
            return data;
        }
    }
    return null;
}
