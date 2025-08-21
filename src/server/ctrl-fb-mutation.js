import axios from 'axios'
import path from 'node:path';
import express from 'express';
import FormData from 'form-data';
import file_manager from './file_api.js';
import fs from 'node:fs';
import { code, menu } from '../modules/index.js';

function blockRequest(app, api) {
    for (let p of [
        'upload', 'save', 'create/file',
        'create/folder', 'delete', 'rename',
        'move']) {
        app.route(`${api}/${p}`).all((_, res) => res.status(403).json({ error: 'Yêu cầu này không hỗ trợ thực hiện!' }));
    }
}

const FB_PHOTO_UPLOAD = 'https://upload.facebook.com/ajax/react_composer/attachments/photo/upload'
const photo = {
    upload_image: async (u_dat, imgPath) => {
        const c = 'append', f = new FormData();
        f[c]('source', '8');
        f[c]('waterfallxapp', 'comet');
        f[c]('profile_id', u_dat.nes.__user);
        f[c]('upload_id', `jsc_c_${Math.random().toString(36).substring(2, 12)}`);
        f[c]('farr', await fs.promises.readFile(imgPath), { filename: path.basename(imgPath), contentType: null });

        const res = await axios.post(
            `${FB_PHOTO_UPLOAD}?${code.queryEncode(u_dat.nes)}`, f
            , { headers: Object.assign({ 'Cookie': u_dat.cookie }, f.getHeaders()) }
        );

        if (!res) return
        let { photoID, imageSrc } = JSON.parse(res.data.substring(9)).payload
        menu.std.info(`POST IMAGE(${res.status}:${res.statusText})\t:\t${imgPath}\t:\t"${photoID}"\t:\t"${imageSrc}"`)
        return { id: photoID, src: imageSrc }
    },

    upload_images: async (u_dat, pathImages, _key = 'photo' || 'media') => {
        let attachments = [];
        if (!pathImages || pathImages.length <= 0) return attachments;
        for (let pathImage of pathImages) {
            let res = await photo.upload_image(u_dat, pathImage)
            if (res) attachments.push({ [_key]: { id: res.id, src: res.src } })
        }
        return attachments
    }
}

const fbVariables = {
    provider: (location = 'timeline') => ({
        "feedLocation": location.toUpperCase(),
        "feedbackSource": 0,
        "focusCommentID": null,
        "gridMediaWidth": 230,
        "groupID": null,
        "scale": 1,
        "privacySelectorRenderLocation": "COMET_STREAM",
        "checkPhotosToReelsUpsellEligibility": true,
        "renderLocation": location.toLowerCase(),
        "useDefaultActor": false,
        "inviteShortLinkKey": null,
        "isFeed": false,
        "isFundraiser": false,
        "isFunFactPost": false,
        "isGroup": false,
        "isEvent": false,
        "isTimeline": true,
        "isSocialLearning": false,
        "isPageNewsFeed": false,
        "isProfileReviews": false,
        "isWorkSharedDraft": false,
        "hashtag": null,
        "canUserManageOffers": false,
        "__relay_internal__pv__CometUFIShareActionMigrationrelayprovider": true,
        "__relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider": true,
        "__relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider": true,
        "__relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider": false,
        "__relay_internal__pv__IsWorkUserrelayprovider": false,
        "__relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider": false,
        "__relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider": true,
        "__relay_internal__pv__FeedDeepDiveTopicPillThreadViewEnabledrelayprovider": false,
        "__relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider": false,
        "__relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider": false,
        "__relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider": false,
        "__relay_internal__pv__IsMergQAPollsrelayprovider": false,
        "__relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider": true,
        "__relay_internal__pv__StoriesArmadilloReplyEnabledrelayprovider": true,
        "__relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider": false,
        "__relay_internal__pv__GHLShouldChangeSponsoredAuctionDistanceFieldNamerelayprovider": true
    }),
    input: (actor_id, text = '', attachments = [], location = 'timeline') => ({
        "source": "WWW",
        "composer_source_surface": location.toLowerCase(),
        attachments,
        "audience": {
            "privacy": {
                "allow": [],
                "base_state": "EVERYONE",
                "deny": [],
                "tag_expansion_state": "UNSPECIFIED"
            }
        },
        "message": { "ranges": [], text },
        "with_tags_ids": null,
        "inline_activities": [],
        "text_format_preset_id": "0",
        "publishing_flow": {
            "supported_flows": [
                "ASYNC_SILENT",
                "ASYNC_NOTIF",
                "FALLBACK"
            ]
        },
        "event_share_metadata": {
            "surface": "newsfeed"
        },
        actor_id,
        "client_mutation_id": "1"
    }),
    all: (actor_id, text, attachments, location = 'timeline') => ({ input: fbVariables.input(actor_id, text, attachments, location), ...fbVariables.provider(location) }),
}


const fbCtrl = {
    postMutation: async (doc_id, user, variables) => {
        const body = { doc_id, ...user.nes, variables: JSON.stringify(variables) }
        const headers = { "content-type": 'application/x-www-form-urlencoded', 'Cookie': user.cookie };
        return await axios.post("https://www.facebook.com/api/graphql/", body, { headers })
    },
}


export default async (app, __dirname) => {
    const fullPath = (p = "") => { let l = path.normalize(p).replace(/^(\.\.(\/|\\|$))+/, ""); return path.join(__dirname, l) };
    const api = '/fb-mutation';

    app.use(api, express.static('.accounts'));
    app.use(api, express.static('.data'));
    blockRequest(app, api);

    app.route(`${api}/post-photo`).post(async (req, res) => {
        try {
            const { f, u } = req.body;
            if (!f) return res.status(400).json({ error: 'Thiếu tham số f' });
            const folder = fullPath(`.data/${f}`);

            if (!fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
                return res.status(404).json({ error: 'Thư mục không tồn tại' });
            }

            const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            const items = await fs.promises.readdir(folder, { withFileTypes: true });

            const imageFiles = items
                .filter(item => item.isFile() && imageExts.includes(path.extname(item.name).toLowerCase()))
                .map(item => path.join(folder, item.name));

            let response = await photo.upload_images(u, imageFiles, 'photo')
            // fs.writeFileSync('.test.json', JSON.stringify({ f, u, imageFiles, response }, null, 2));
            return res.status(200).json(response) // 
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    });

    app.route(`${api}/post-mutation`).post(async (req, res) => {
        const { message, attachments, u } = req.body;
        console.log(req.body);

        let result = await fbCtrl.postMutation('24163581963251290', u, fbVariables.all(u.nes.__user, message, attachments))
        // fs.writeFileSync('.test-post.json', JSON.stringify(result.data, null, 2));
        return res.status(200).json(result.data);
    })

    app.route(`${api}/group-feed`).post(async (req, res) => {
        const { u } = req.body;
        console.log(u.cookie);
        
        const request = async _ => {
            let result = await axios.get('https://www.facebook.com/groups/feed', {
                headers: { 'accept': "text/html", 'Cookie': u.cookie },
            })
            fs.writeFileSync('.test-query.html', result.data);
            return result.data;
        }
        return res.status(200).send(await request())
    })
    file_manager(app, api, path.join(__dirname, '.data'));
}