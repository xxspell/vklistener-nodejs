console.log(`Forked by xxspell | https://github.com/xxspell`);
import puppeteer from 'puppeteer';
import fs from 'fs';
import readline from 'readline';
import VKCaptchaSolver from 'vk-captchasolver'
import prompt from 'prompt-sync'
import download from 'image-downloader'


(async () => {
    const browser = await puppeteer.launch({
        headless: false
    });
    const rl = readline.createInterface({
        input: fs.createReadStream('accounts.txt'),
        crlfDelay: Infinity
    });
    const sessions = [];
    for await (const line of rl) {
        const loginSearch = line.match(/(.+)\s+/);
        const [completeMatch, login] = loginSearch;
        const password = line.slice(completeMatch.length);
        console.log(`Захожу на аккаунт ${login} ${password}`);
        const context = await browser.createIncognitoBrowserContext();
        const page = await context.newPage();
        await page.goto("https://vk.com", {
            waitUntil: "domcontentloaded"
        });
        await page.type('#index_email', login);
	await page.click('.VkIdForm__signInButton');
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
      });
    if (await page.$('.vkc__Captcha__image') !== null) {
        console.log(`Решаю капчу`)
        // await page.waitForSelector('.vkc__Captcha__image img');
        // console.log(`дождался ссылка`)
        const captcha_url = await page.$eval('.vkc__Captcha__image', (el) => el.getAttribute('src'));
        console.log(`ссылка есть ${captcha_url}`)
        const response = await fetch(captcha_url);
            const bufferr = await response.buffer();
            fs.writeFile(`captcha/image.jpg`, bufferr, () => 
              console.log('В /captcha сохранено изображение капчи, откройте его и разгадайте шифр'));



//         const options = {
//             url: '${captcha_url}',
//             dest: '/images',               // will be saved to /path/to/dest/image.jpg
//           };
// ;
//           download.image(options)
//           .then(({ filename }) => {
//             console.log('Saved to', filename); // saved to /path/to/dest/image.jpg
//           })
//           .catch((err) => console.error(err));
//           download.image()   
    const captchadone = prompt("Какой шифр?  ");


    await page.type('vkc__TextField__input', captchadone);
        console.log(`сзаписал рез`)
        await page.click('.vkuiButton__in');
        console.log(`доне`)


        
        
    } else {
        console.log(`неРешаю капчу`)
    }
	await page.waitForSelector('.vkc__Password__Wrapper');
        await page.type('.vkc__Password__Wrapper', password);
        await page.click('.vkuiButton');
    if (await page.$('.vkc__TextField__errorMessage') !== null) {
            
    console.log(`Походу неверный пароль`)
      

    } else {
        console.log(`ессс`)
        }
        await page.waitForNavigation();
        const cookies = await page.cookies();
        const resCookies = [];
        for (let i = 0; i < cookies.length; i++) {
            resCookies.push(`${cookies[i].name}=${cookies[i].value}`);
        }
        sessions.push(resCookies.join('; '));
        await fs.promises.writeFile('sessions.json', JSON.stringify(sessions));
        console.log(`Сессия аккаунта ${login} ${password} сохранена`);
        await context.close();
    }
    await browser.close();
})();
