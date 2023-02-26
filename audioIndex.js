console.log(`Forked by xxspell | https://github.com/xxspell`);
import fetch from 'node-fetch';
import logUpdate from 'log-update';
import cookiee from './sessions.json' assert { type: 'json' };

const CONFIG = {
    audioLink: process.argv[2],
	cookie: cookiee,
	
};


class Util {
    static queryStringify(object = {}) {
        return Object.entries(object)
            .map(
                ([key, value]) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            )
            .join("&");
    }

    static parseAudioData(audioLink = "") {
        let matchArray = audioLink.match(
            /audios(\d+).+?audio_playlist(\d+)_(\d+)/i
        );
        let access_hash = audioLink.match(/%2F([\da-f]+)/i);
        if (access_hash) {
            access_hash = access_hash[1];
        } else {
            access_hash = "";
        }
        return {
            audios: matchArray[1],
            owner_id: matchArray[2],
            playlistId: matchArray[3],
            location: audioLink.match(/https:\/\/vk\.com\/(.+)/i)[1],
            access_hash
        };
    }

    static sleep(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

const listenAudio = async ({
    parsedData,
    audioInfo,
    cookie
}) => {
    return await fetch("https://vk.com/al_audio.php", {
        credentials: "include",
        headers: {
            accept: "*/*",
            "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/x-www-form-urlencoded",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest",
            cookie
        },
        body: Util.queryStringify({
            act: "listened_data",
            al: "1",
            audio_id: `${audioInfo.audioOwner_id}_${audioInfo.audio_id}`, //айди аудио из пайлоад
            context: "user_playlists",
            end_stream_reason: "stop_btn",
            hash: audioInfo.hashes[Math.random() * audioInfo.hashes.length ^ 0], //брать из паулоад
            impl: "html5",
            listened: "20",
            loc: parsedData.location,
            playlist_id: `${parsedData.owner_id}_${parsedData.playlistId}${parsedData.access_hash ? `_${parsedData.access_hash}` : ``}`,
            state: "app",
            timings: "776",
            track_code: audioInfo.track,
            v: "5"
        }),
        method: "POST",
        mode: "cors"
    });
};

let initialListensCount, startListening;

const main = async () => {
    const parsedData = Util.parseAudioData(CONFIG.audioLink);
    while (true) {
        const cookiePos = Math.random() * CONFIG.cookie.length ^ 0;
        const respone = await fetch("https://vk.com/al_audio.php", {
            credentials: "include",
            headers: {
                accept: "*/*",
                "accept-language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
                "content-type": "application/x-www-form-urlencoded",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest",
                cookie: CONFIG.cookie[cookiePos]
            },
            body: Util.queryStringify({
                access_hash: parsedData.access_hash,
                act: "load_section",
                al: "1",
                claim: "0",
                context: "user_playlists",
                from_id: parsedData.audios,
                is_loading_all: "1",
                offset: "0",
                owner_id: parsedData.owner_id,
                playlist_id: parsedData.playlistId,
                type: "playlist"
            }),
            method: "POST"
        });
        const responeJson = await respone.json();
        const {
            payload: [, [playlistInfo]]
        } = responeJson;
        if (!playlistInfo) {
            console.log(`${cookiePos} аккаунт недействителен!`);
            continue;
        }
        const { listens, list } = playlistInfo;
        if (!list) {
            console.log(`${cookiePos} аккаунт недействителен!`);
            continue;
        }
        if (!initialListensCount) {
            initialListensCount = +listens;
        }
        const playlistAudios = [];
        for (let i = 0; i < list.length; i++) {
            playlistAudios.push({
                audio_id: list[i][0],
                audioOwner_id: list[i][1],
                hashes: list[i][13].match(/[a-f\d]+/g),
                track: list[i][20]
            });
        }
        for (let j = 0; j < CONFIG.cookie.length; j++) {
            // for (let i = 0; i < playlistAudios.length; i++) { //playlistAudios.length
            //     try {
            //         await listenAudio({
            //             parsedData,
            //             audioInfo: playlistAudios[i],
            //             cookie: CONFIG.cookie[j]
            //         });
            //     } catch (e) {
            //         console.log(
            //             e
            //         );
            //     }
            // }
            const randomAudio = playlistAudios[Math.random() * playlistAudios.length ^ 0];
            try {
                await listenAudio({
                    parsedData,
                    audioInfo: randomAudio,
                    cookie: CONFIG.cookie[j]
                });
            } catch (e) {
                console.log(
                    e
                );
            }
            if (!startListening) {
                startListening = Date.now();
            }
            //await Util.sleep(10);
        }
        const timePassed = ((Date.now() - startListening) / 1000) / 60;
        const woundUp = +listens - initialListensCount;
        logUpdate(
            `
            \x1b[31m♥♥\x1b[0m ${listens} прослушиваний \x1b[31m♥♥\x1b[0m
            Начальное количество прослушиваний: ${initialListensCount} 
            Накручено прослушиваний: ${woundUp} 
            Времени прошло: ${timePassed.toFixed(3)} минут 
            Скорость: ${(woundUp / timePassed).toFixed(3)} прослушиваний/минуту 
            `
                );
    }
};

main();

